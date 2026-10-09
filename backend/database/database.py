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
            """
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

    async def close(self) -> None:
        if self._connection is not None:
            await self._connection.close()
            self._connection = None
