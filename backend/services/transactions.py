from __future__ import annotations

from datetime import datetime, timezone

from backend.database.database import FinanceDatabase
from backend.database.models import TransactionCreate, TransactionResponse
from backend.services.dates import month_start, next_month


class TransactionService:
    def __init__(self, database: FinanceDatabase) -> None:
        self.database = database

    @staticmethod
    def _serialize(row: dict) -> TransactionResponse:
        created_at = datetime.fromisoformat(row["created_at"])
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return TransactionResponse(
            id=row["id"],
            user_id=row["user_id"],
            amount=row["amount"],
            category=row["category"],
            description=row["description"],
            type=row["type"],
            currency=row["currency"],
            created_at=created_at,
        )

    async def create(self, item: TransactionCreate) -> TransactionResponse:
        created_at = item.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        row_id = await self.database.write(
            """
            INSERT INTO transactions
            (user_id, amount, category, description, type, currency, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item.user_id,
                float(item.amount),
                item.category,
                item.description.strip(),
                item.type,
                item.currency,
                created_at.astimezone(timezone.utc).isoformat(),
            ),
        )
        created = await self.database.fetch_one("SELECT * FROM transactions WHERE id = ?", (row_id,))
        if created is None:  # pragma: no cover - protects against a failed database driver
            raise RuntimeError("Transaction was not created")
        return self._serialize(created)

    async def list(
        self,
        user_id: str,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 100,
    ) -> list[TransactionResponse]:
        clauses = ["user_id = ?"]
        params: list[object] = [user_id]
        if start is not None:
            clauses.append("created_at >= ?")
            params.append(start.astimezone(timezone.utc).isoformat())
        if end is not None:
            clauses.append("created_at < ?")
            params.append(end.astimezone(timezone.utc).isoformat())
        params.append(limit)
        rows = await self.database.fetch_all(
            f"SELECT * FROM transactions WHERE {' AND '.join(clauses)} ORDER BY created_at DESC, id DESC LIMIT ?",
            params,
        )
        return [self._serialize(row) for row in rows]

    async def list_for_period(self, user_id: str, period: str) -> list[TransactionResponse]:
        return await self.list(
            user_id,
            start=month_start(period),
            end=month_start(next_month(period)),
            limit=10_000,
        )

    async def delete(self, user_id: str, transaction_id: int) -> bool:
        existing = await self.database.fetch_one(
            "SELECT id FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id)
        )
        if existing is None:
            return False
        await self.database.write(
            "DELETE FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id)
        )
        return True
