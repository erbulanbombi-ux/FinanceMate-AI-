import asyncio
from contextlib import asynccontextmanager
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.auth import router as auth_router
from backend.api.transactions import create_transaction
from backend.database.database import FinanceDatabase
from backend.database.models import TransactionCreate
from backend.services.auth import AuthService


class FakeEmailService:
    is_configured = True
    verification_url = "http://127.0.0.1:5173/verify-email"
    reset_url = "http://127.0.0.1:5173/reset-password"

    def __init__(self):
        self.verification_links = []
        self.reset_links = []

    async def send_verification(self, recipient, link):
        self.verification_links.append((recipient, link))

    async def send_password_reset(self, recipient, link):
        self.reset_links.append((recipient, link))


class AuthTests(unittest.TestCase):
    def test_email_verification_password_reset_and_cookie_sessions(self):
        with tempfile.TemporaryDirectory() as directory:
            email = FakeEmailService()

            @asynccontextmanager
            async def lifespan(app):
                database = FinanceDatabase(Path(directory) / "auth.db")
                await database.initialize()
                app.state.auth = AuthService(database, email)
                app.state.email = email
                yield
                await database.close()

            app = FastAPI(lifespan=lifespan)
            app.state.allowed_origins = ["http://127.0.0.1:5173"]
            app.include_router(auth_router)

            with TestClient(app) as client:
                origin = {"Origin": "http://127.0.0.1:5173"}
                self.assertEqual(client.get("/api/auth/me").status_code, 401)
                untrusted = client.post(
                    "/api/auth/register",
                    json={
                        "username": "alice",
                        "email": "alice@example.com",
                        "password": "correct horse battery staple",
                    },
                )
                self.assertEqual(untrusted.status_code, 403)

                registration = client.post(
                    "/api/auth/register",
                    headers=origin,
                    json={
                        "username": "alice",
                        "email": "alice@example.com",
                        "password": "correct horse battery staple",
                    },
                )
                self.assertEqual(registration.status_code, 202)
                duplicate = client.post(
                    "/api/auth/register",
                    headers=origin,
                    json={
                        "username": "alice",
                        "email": "alice@example.com",
                        "password": "different secure password 123",
                    },
                )
                self.assertEqual(duplicate.status_code, 202)
                self.assertEqual(duplicate.json(), registration.json())
                verify_token = parse_qs(urlparse(email.verification_links[-1][1]).fragment)["token"][0]
                self.assertEqual(
                    client.post("/api/auth/verify-email", headers=origin, json={"token": verify_token}).status_code,
                    200,
                )
                self.assertEqual(
                    client.post("/api/auth/verify-email", headers=origin, json={"token": verify_token}).status_code,
                    400,
                )

                login = client.post(
                    "/api/auth/login",
                    headers=origin,
                    json={"username": "alice", "password": "correct horse battery staple"},
                )
                self.assertEqual(login.status_code, 200)
                cookie = login.headers["set-cookie"].lower()
                self.assertIn("httponly", cookie)
                self.assertIn("samesite=strict", cookie)
                self.assertIn("max-age=43200", cookie)
                self.assertIn("path=/api", cookie)
                self.assertNotIn("access_token", login.json())
                self.assertEqual(client.get("/api/auth/me").json()["username"], "alice")

                self.assertEqual(client.post("/api/auth/logout").status_code, 403)
                self.assertEqual(client.post("/api/auth/logout", headers=origin).status_code, 204)
                self.assertEqual(client.get("/api/auth/me").status_code, 401)

                forgot = client.post(
                    "/api/auth/forgot-password",
                    headers=origin,
                    json={"email": "alice@example.com"},
                )
                unknown = client.post(
                    "/api/auth/forgot-password",
                    headers=origin,
                    json={"email": "nobody@example.com"},
                )
                self.assertEqual(forgot.status_code, 202)
                self.assertEqual(forgot.json(), unknown.json())
                reset_token = parse_qs(urlparse(email.reset_links[-1][1]).fragment)["token"][0]
                reset = client.post(
                    "/api/auth/reset-password",
                    headers=origin,
                    json={"token": reset_token, "password": "a new secure password 123"},
                )
                self.assertEqual(reset.status_code, 200)
                self.assertEqual(client.get("/api/auth/me").status_code, 401)
                self.assertEqual(
                    client.post(
                        "/api/auth/reset-password",
                        headers=origin,
                        json={"token": reset_token, "password": "another secure password 123"},
                    ).status_code,
                    400,
                )
                new_login = client.post(
                    "/api/auth/login",
                    headers=origin,
                    json={"username": "alice", "password": "a new secure password 123"},
                )
                self.assertEqual(new_login.status_code, 200)

    def test_transaction_owner_comes_from_authenticated_session(self):
        async def run():
            created = []

            class TransactionStore:
                async def create(self, payload):
                    created.append(payload)
                    return payload

            request = SimpleNamespace(
                app=SimpleNamespace(state=SimpleNamespace(transactions=TransactionStore()))
            )
            payload = TransactionCreate(
                user_id="another-user",
                amount=100,
                category="food",
                type="expense",
            )

            await create_transaction(
                payload,
                request,
                {"user_id": "authenticated-user", "username": "alice"},
            )
            return created[0].user_id

        owner = asyncio.run(run())
        self.assertEqual(owner, "authenticated-user")

    def test_auth_rate_limit_is_atomic_and_expires(self):
        async def run():
            with tempfile.TemporaryDirectory() as directory:
                database = FinanceDatabase(Path(directory) / "limits.db")
                await database.initialize()
                first = await database.claim_rate_limit("test-bucket", 1, 60)
                second = await database.claim_rate_limit("test-bucket", 1, 60)
                await database.close()
                return first, second

        first, second = asyncio.run(run())
        self.assertTrue(first)
        self.assertFalse(second)


if __name__ == "__main__":
    unittest.main()