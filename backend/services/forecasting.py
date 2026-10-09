from __future__ import annotations

from backend.database.database import FinanceDatabase
from backend.services.dates import month_period, next_month, previous_month
from backend.services.transactions import TransactionService


class ForecastingService:
    def __init__(self, database: FinanceDatabase, transactions: TransactionService) -> None:
        self.database = database
        self.transactions = transactions

    async def forecast(self, user_id: str, period: str | None = None) -> dict:
        selected = period or month_period()
        months: list[dict[str, float]] = []
        cursor = selected
        for _ in range(3):
            cursor = previous_month(cursor)
            rows = await self.transactions.list_for_period(user_id, cursor)
            months.append({
                "income": sum(float(item.amount) for item in rows if item.type == "income"),
                "expenses": sum(float(item.amount) for item in rows if item.type == "expense"),
                "has_data": 1.0 if rows else 0.0,
            })
        observed_months = [item for item in months if item["has_data"]]
        avg_expenses = (
            sum(item["expenses"] for item in observed_months) / len(observed_months)
            if observed_months else 0.0
        )
        avg_income = (
            sum(item["income"] for item in observed_months) / len(observed_months)
            if observed_months else 0.0
        )
        observations = sum(item["has_data"] for item in months)
        confidence = min(0.82, 0.27 * observations)
        return {
            "user_id": user_id,
            "period": next_month(selected),
            "next_month_expenses": round(avg_expenses, 2),
            "next_month_income": round(avg_income, 2),
            "next_month_savings": round(avg_income - avg_expenses, 2),
            "confidence": round(confidence, 2),
            "method": "average of up to 3 previous calendar months",
        }
