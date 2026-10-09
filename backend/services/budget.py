from __future__ import annotations

from backend.database.database import FinanceDatabase
from backend.database.models import BudgetCreate, BudgetResponse
from backend.services.dates import month_period, month_start, next_month
from backend.services.transactions import TransactionService


class BudgetService:
    def __init__(self, database: FinanceDatabase, transactions: TransactionService) -> None:
        self.database = database
        self.transactions = transactions

    async def save(self, budget: BudgetCreate) -> BudgetResponse:
        period = budget.period or month_period()
        await self.database.write(
            """
            INSERT INTO budgets (user_id, category, limit_amount, period)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, category, period)
            DO UPDATE SET limit_amount = excluded.limit_amount
            """,
            (budget.user_id, budget.category, float(budget.limit_amount), period),
        )
        row = await self.database.fetch_one(
            "SELECT * FROM budgets WHERE user_id = ? AND category = ? AND period = ?",
            (budget.user_id, budget.category, period),
        )
        if row is None:  # pragma: no cover
            raise RuntimeError("Budget was not saved")
        return await self._with_spending(row)

    async def get(self, user_id: str, period: str | None = None) -> list[BudgetResponse]:
        active_period = period or month_period()
        rows = await self.database.fetch_all(
            "SELECT * FROM budgets WHERE user_id = ? AND period = ? ORDER BY category",
            (user_id, active_period),
        )
        return [await self._with_spending(row) for row in rows]

    async def _with_spending(self, row: dict) -> BudgetResponse:
        start = month_start(row["period"])
        end = month_start(next_month(row["period"]))
        transactions = await self.transactions.list(
            row["user_id"], start=start, end=end, limit=10_000
        )
        spent = sum(
            float(item.amount)
            for item in transactions
            if item.type == "expense" and item.category == row["category"]
        )
        limit_amount = float(row["limit_amount"])
        ratio = spent / limit_amount
        status = "exceeded" if ratio > 1 else "warning" if ratio >= 0.8 else "safe"
        return BudgetResponse(
            id=row["id"],
            user_id=row["user_id"],
            category=row["category"],
            limit_amount=limit_amount,
            spent=round(spent, 2),
            remaining=round(limit_amount - spent, 2),
            status=status,
            period=row["period"],
        )
