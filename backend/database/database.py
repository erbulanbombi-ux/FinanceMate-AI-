from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Iterable

import aiosqlite


class FinanceDatabase:
    """Small asynchronous SQLite data layer used by the finance services."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self._connection: aiosqlite.Connection | None = None
        self._write_lock = asyncio.Lock()

    @property
    def connection(self) -> aiosqlite.Connection:
        if self._connection is None:
            raise RuntimeError("Finance database has not been initialized")
        return self._connection

    async def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._connection = await aiosqlite.connect(self.database_path)
        self._connection.row_factory = aiosqlite.Row
        await self.connection.execute("PRAGMA foreign_keys = ON")
        await self.connection.execute("PRAGMA journal_mode = WAL")
        await self.connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                amount REAL NOT NULL CHECK (amount > 0),
                category TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
                currency TEXT NOT NULL DEFAULT 'KZT',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_user_created
                ON transactions(user_id, created_at DESC);
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                category TEXT NOT NULL,
                limit_amount REAL NOT NULL CHECK (limit_amount > 0),
                period TEXT NOT NULL,
                UNIQUE(user_id, category, period)
            );
            CREATE INDEX IF NOT EXISTS idx_budgets_user_period
                ON budgets(user_id, period);
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT,
                email_verified INTEGER NOT NULL DEFAULT 0,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry
                ON auth_sessions(expires_at);
            CREATE TABLE IF NOT EXISTS auth_action_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
                expires_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_auth_action_tokens_expiry
                ON auth_action_tokens(expires_at);
            CREATE TABLE IF NOT EXISTS auth_rate_limits (
                bucket_hash TEXT PRIMARY KEY,
                attempts INTEGER NOT NULL,
                reset_at INTEGER NOT NULL
            );
            """
        )
        user_columns = {row["name"] for row in await self.fetch_all("PRAGMA table_info(users)")}
        if "email" not in user_columns:
            await self.connection.execute("ALTER TABLE users ADD COLUMN email TEXT")
        if "email_verified" not in user_columns:
            await self.connection.execute(
                "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0"
            )
        await self.connection.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL"
        )
        await self.connection.commit()

    async def fetch_all(self, query: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
        cursor = await self.connection.execute(query, tuple(params))
        rows = await cursor.fetchall()
        await cursor.close()
        return [dict(row) for row in rows]

    async def fetch_one(self, query: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
        cursor = await self.connection.execute(query, tuple(params))
        row = await cursor.fetchone()
        await cursor.close()
        return dict(row) if row is not None else None

    async def write(self, query: str, params: Iterable[Any] = ()) -> int:
        async with self._write_lock:
            try:
                cursor = await self.connection.execute(query, tuple(params))
                await self.connection.commit()
                row_id = cursor.lastrowid
                await cursor.close()
            except Exception:
                await self.connection.rollback()
                raise
        return int(row_id or 0)

    async def claim_rate_limit(self, bucket_hash: str, maximum: int, window_seconds: int) -> bool:
        import time

        now = int(time.time())
        async with self._write_lock:
            await self.connection.execute("BEGIN IMMEDIATE")
            try:
                await self.connection.execute(
                    "DELETE FROM auth_rate_limits WHERE reset_at <= ?", (now,)
                )
                row = await self.fetch_one(
                    "SELECT attempts, reset_at FROM auth_rate_limits WHERE bucket_hash = ?",
                    (bucket_hash,),
                )
                if row is None or row["reset_at"] <= now:
                    await self.connection.execute(
                        """INSERT INTO auth_rate_limits (bucket_hash, attempts, reset_at)
                           VALUES (?, 1, ?)
                           ON CONFLICT(bucket_hash) DO UPDATE SET attempts = 1, reset_at = excluded.reset_at""",
                        (bucket_hash, now + window_seconds),
                    )
                    allowed = True
                elif row["attempts"] >= maximum:
                    allowed = False
                else:
                    await self.connection.execute(
                        "UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE bucket_hash = ?",
                        (bucket_hash,),
                    )
                    allowed = True
                await self.connection.commit()
                return allowed
            except Exception:
                await self.connection.rollback()
                raise

    async def consume_auth_action_token(
        self, token_hash: str, purpose: str, now: str
    ) -> dict[str, Any] | None:
        async with self._write_lock:
            await self.connection.execute("BEGIN IMMEDIATE")
            try:
                row = await self.fetch_one(
                    """SELECT user_id FROM auth_action_tokens
                       WHERE token_hash = ? AND purpose = ? AND expires_at > ?""",
                    (token_hash, purpose, now),
                )
                if row is not None:
                    await self.connection.execute(
                        "DELETE FROM auth_action_tokens WHERE token_hash = ?",
                        (token_hash,),
                    )
                await self.connection.commit()
                return row
            except Exception:
                await self.connection.rollback()
                raise

    async def verify_email_with_token(self, token_hash: str, now: str) -> bool:
        async with self._write_lock:
            await self.connection.execute("BEGIN IMMEDIATE")
            try:
                token = await self.fetch_one(
                    """SELECT user_id FROM auth_action_tokens
                       WHERE token_hash = ? AND purpose = 'verify_email' AND expires_at > ?""",
                    (token_hash, now),
                )
                if token is None:
                    await self.connection.commit()
                    return False
                await self.connection.execute(
                    "UPDATE users SET email_verified = 1 WHERE user_id = ?",
                    (token["user_id"],),
                )
                await self.connection.execute(
                    "DELETE FROM auth_action_tokens WHERE token_hash = ?", (token_hash,)
                )
                await self.connection.commit()
                return True
            except Exception:
                await self.connection.rollback()
                raise

    async def reset_password_with_token(
        self, token_hash: str, password_hash: str, now: str
    ) -> bool:
        async with self._write_lock:
            await self.connection.execute("BEGIN IMMEDIATE")
            try:
                token = await self.fetch_one(
                    """SELECT user_id FROM auth_action_tokens
                       WHERE token_hash = ? AND purpose = 'reset_password' AND expires_at > ?""",
                    (token_hash, now),
                )
                if token is None:
                    await self.connection.commit()
                    return False
                user_id = token["user_id"]
                await self.connection.execute(
                    "UPDATE users SET password_hash = ? WHERE user_id = ?",
                    (password_hash, user_id),
                )
                await self.connection.execute(
                    "DELETE FROM auth_sessions WHERE user_id = ?", (user_id,)
                )
                await self.connection.execute(
                    "DELETE FROM auth_action_tokens WHERE user_id = ? AND purpose = 'reset_password'",
                    (user_id,),
                )
                await self.connection.commit()
                return True
            except Exception:
                await self.connection.rollback()
                raise

    async def close(self) -> None:
        if self._connection is not None:
            await self._connection.close()
            self._connection = None
