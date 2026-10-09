from __future__ import annotations

from backend.database.database import FinanceDatabase
from backend.services.dates import month_period, month_start, next_month, previous_month
from backend.services.transactions import TransactionService


class AnomalyDetectionService:
    def __init__(self, database: FinanceDatabase, transactions: TransactionService) -> None:
        self.database = database
        self.transactions = transactions

    async def detect(self, user_id: str, period: str | None = None) -> list[dict]:
        current_period = period or month_period()
        current_start = month_start(current_period)
        current_end = month_start(next_month(current_period))
        current_rows = await self.transactions.list(user_id, start=current_start, end=current_end, limit=10_000)
        current: dict[str, float] = {}
        for item in current_rows:
            if item.type == "expense":
                current[item.category] = current.get(item.category, 0.0) + float(item.amount)

        prior_periods = []
        cursor = current_period
        for _ in range(3):
            cursor = previous_month(cursor)
            prior_periods.append(cursor)
        historical_start = month_start(prior_periods[-1])
        history_rows = await self.transactions.list(
            user_id, start=historical_start, end=current_start, limit=10_000
        )
        monthly: dict[str, dict[str, float]] = {value: {} for value in prior_periods}
        for item in history_rows:
            key = item.created_at.strftime("%Y-%m")
            if item.type == "expense" and key in monthly:
                monthly[key][item.category] = monthly[key].get(item.category, 0.0) + float(item.amount)

        categories = set(current)
        for month in monthly.values():
            categories.update(month)
        result = []
        for category in sorted(categories):
            values = [month.get(category, 0.0) for month in monthly.values()]
            average = sum(values) / len(values)
            amount = current.get(category, 0.0)
            if average > 0 and amount > average * 1.5:
                result.append({
                    "category": category,
                    "current_spending": round(amount, 2),
                    "average_spending": round(average, 2),
                    "increase_percent": round((amount / average - 1) * 100, 1),
                    "is_anomaly": True,
                    "period": current_period,
                })
        return result
