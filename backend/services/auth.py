from __future__ import annotations

import asyncio
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import aiosqlite
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from backend.database.database import FinanceDatabase
from backend.services.email import EmailService

PASSWORD_ITERATIONS = 600_000
SESSION_HOURS = 12
PASSWORD_HASHER = PasswordHasher(time_cost=3, memory_cost=65_536, parallelism=2)
DUMMY_PASSWORD_HASH = PASSWORD_HASHER.hash(secrets.token_urlsafe(32))


class AuthRateLimited(Exception):
    pass


def _verify_password_sync(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("$argon2"):
        try:
            return PASSWORD_HASHER.verify(stored_hash, password)
        except (InvalidHashError, VerificationError, VerifyMismatchError):
            return False
    try:
        iterations, salt_hex, expected_hex = stored_hash.split("$", maxsplit=2)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        ).hex()
        return hmac.compare_digest(actual, expected_hex) and int(iterations) == PASSWORD_ITERATIONS
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, database: FinanceDatabase, email: EmailService) -> None:
        self.database = database
        self.email = email

    async def register(self, username: str, email: str, password: str, client_ip: str) -> dict:
        if not self.email.is_configured:
            raise RuntimeError("SMTP email delivery must be configured before account registration")
        await self._enforce_rate_limit(f"register-ip:{client_ip}", 5, 3600)
        await self._enforce_rate_limit(f"register-email:{email}", 3, 3600)
        user_id = uuid.uuid4().hex
        password_hash = await asyncio.to_thread(PASSWORD_HASHER.hash, password)
        try:
            await self.database.write(
                """INSERT INTO users
                   (user_id, username, email, email_verified, password_hash, created_at)
                   VALUES (?, ?, ?, 0, ?, ?)""",
                (user_id, username, email, password_hash, datetime.now(timezone.utc).isoformat()),
            )
        except aiosqlite.IntegrityError as exc:
            raise ValueError("An account with this username or email already exists") from exc
        link = await self._new_action_link(user_id, "verify_email", timedelta(hours=24), self.email.verification_url)
        return {
            "message": "If the account can be created, a verification email will be sent.",
            "recipient": email,
            "verification_link": link,
        }

    async def login(self, username: str, password: str, client_ip: str) -> dict | None:
        await self._enforce_rate_limit(f"login-ip:{client_ip}", 30, 900)
        await self._enforce_rate_limit(f"login-user:{username}", 10, 900)
        user = await self.database.fetch_one(
            "SELECT user_id, username, email, email_verified, password_hash FROM users WHERE username = ?",
            (username,),
        )
        valid_password = await asyncio.to_thread(
            _verify_password_sync,
            password,
            user["password_hash"] if user else DUMMY_PASSWORD_HASH,
        )
        if user is None or not valid_password:
            return None
        if user["email"] and not user["email_verified"]:
            return None
        if not user["password_hash"].startswith("$argon2") or PASSWORD_HASHER.check_needs_rehash(user["password_hash"]):
            upgraded_hash = await asyncio.to_thread(PASSWORD_HASHER.hash, password)
            await self.database.write(
                "UPDATE users SET password_hash = ? WHERE user_id = ?",
                (upgraded_hash, user["user_id"]),
            )
        return await self._create_session(user["user_id"], user["username"])

    async def verify_email(self, token: str, client_ip: str) -> bool:
        await self._enforce_rate_limit(f"verify-attempt-ip:{client_ip}", 30, 3600)
        return await self.database.verify_email_with_token(
            _token_hash(token), datetime.now(timezone.utc).isoformat()
        )

    async def resend_verification(self, email: str, client_ip: str) -> dict | None:
        if not await self._claim_rate_limit(f"verify-ip:{client_ip}", 5, 3600):
            return None
        user = await self.database.fetch_one(
            "SELECT user_id FROM users WHERE email = ? AND email_verified = 0",
            (email,),
        )
        if user is None:
            return None
        link = await self._new_action_link(user["user_id"], "verify_email", timedelta(hours=24), self.email.verification_url)
        return {"recipient": email, "link": link}

    async def request_password_reset(self, email: str, client_ip: str) -> dict | None:
        ip_allowed = await self._claim_rate_limit(f"reset-ip:{client_ip}", 5, 3600)
        email_allowed = await self._claim_rate_limit(f"reset-email:{email}", 3, 3600)
        if not ip_allowed or not email_allowed:
            return None
        user = await self.database.fetch_one(
            "SELECT user_id FROM users WHERE email = ? AND email_verified = 1",
            (email,),
        )
        if user is None:
            return None
        link = await self._new_action_link(
            user["user_id"], "reset_password", timedelta(minutes=15), self.email.reset_url
        )
        return {"recipient": email, "link": link}

    async def reset_password(self, token: str, password: str, client_ip: str) -> bool:
        await self._enforce_rate_limit(f"reset-attempt-ip:{client_ip}", 20, 3600)
        password_hash = await asyncio.to_thread(PASSWORD_HASHER.hash, password)
        return await self.database.reset_password_with_token(
            _token_hash(token), password_hash, datetime.now(timezone.utc).isoformat()
        )

    async def authenticate(self, token: str) -> dict | None:
        now = datetime.now(timezone.utc).isoformat()
        return await self.database.fetch_one(
            """SELECT users.user_id, users.username
               FROM auth_sessions
               JOIN users ON users.user_id = auth_sessions.user_id
               WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?""",
            (_token_hash(token), now),
        )

    async def logout(self, token: str) -> None:
        await self.database.write(
            "DELETE FROM auth_sessions WHERE token_hash = ?",
            (_token_hash(token),),
        )

    async def _new_action_link(
        self, user_id: str, purpose: str, lifetime: timedelta, base_url: str
    ) -> str:
        token = secrets.token_urlsafe(32)
        await self.database.write(
            "DELETE FROM auth_action_tokens WHERE user_id = ? AND purpose = ?",
            (user_id, purpose),
        )
        await self.database.write(
            """INSERT INTO auth_action_tokens (token_hash, user_id, purpose, expires_at)
               VALUES (?, ?, ?, ?)""",
            (
                _token_hash(token),
                user_id,
                purpose,
                (datetime.now(timezone.utc) + lifetime).isoformat(),
            ),
        )
        return f"{base_url.split('#', maxsplit=1)[0]}#token={quote(token)}"

    async def _claim_rate_limit(self, key: str, maximum: int, window_seconds: int) -> bool:
        bucket_hash = hashlib.sha256(key.encode()).hexdigest()
        return await self.database.claim_rate_limit(bucket_hash, maximum, window_seconds)

    async def _enforce_rate_limit(self, key: str, maximum: int, window_seconds: int) -> None:
        if not await self._claim_rate_limit(key, maximum, window_seconds):
            raise AuthRateLimited("Too many attempts. Try again later.")

    async def _create_session(self, user_id: str, username: str) -> dict:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)
        await self.database.write(
            "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (_token_hash(token), user_id, expires_at.isoformat()),
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": SESSION_HOURS * 60 * 60,
            "user": {"user_id": user_id, "username": username},
        }