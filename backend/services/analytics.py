from __future__ import annotations

from backend.database.database import FinanceDatabase
from backend.services.dates import month_period, month_start, next_month, previous_month
from backend.services.transactions import TransactionService


class FinancialAnalytics:
    def __init__(self, database: FinanceDatabase, transactions: TransactionService) -> None:
        self.database = database
        self.transactions = transactions

    async def dashboard(self, user_id: str, period: str | None = None) -> dict:
        selected_period = period or month_period()
        start = month_start(selected_period)
        end = month_start(next_month(selected_period))
        selected = await self.transactions.list(user_id, start=start, end=end, limit=10_000)
        balance_row = await self.database.fetch_one(
            """SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
               FROM transactions WHERE user_id = ?""",
            (user_id,),
        )
        income = sum(float(item.amount) for item in selected if item.type == "income")
        expenses = sum(float(item.amount) for item in selected if item.type == "expense")
        balance = float(balance_row["balance"] if balance_row else 0)
        savings = income - expenses
        savings_rate = (savings / income * 100) if income > 0 else 0.0
        by_category: dict[str, float] = {}
        for item in selected:
            if item.type == "expense":
                by_category[item.category] = by_category.get(item.category, 0.0) + float(item.amount)
        categories = sorted(by_category.items(), key=lambda pair: pair[1], reverse=True)

        score = 50.0
        if income > 0:
            score += max(-30.0, min(30.0, savings_rate * 0.5))
        budgets = await self.database.fetch_all(
            "SELECT category, limit_amount FROM budgets WHERE user_id = ? AND period = ?",
            (user_id, selected_period),
        )
        budget_map = {row["category"]: float(row["limit_amount"]) for row in budgets}
        for category, spent in by_category.items():
            limit_amount = budget_map.get(category)
            if limit_amount:
                score += 5 if spent <= limit_amount else -min(10, (spent / limit_amount - 1) * 10)
        if budgets and all(by_category.get(row["category"], 0) <= float(row["limit_amount"]) for row in budgets):
            score += 10

        currency = selected[0].currency if selected else "KZT"
        return {
            "user_id": user_id,
            "period": selected_period,
            "currency": currency,
            "balance": round(balance, 2),
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "savings": round(savings, 2),
            "savings_rate": round(savings_rate, 2),
            "financial_health_score": round(max(0, min(100, score))),
            "top_categories": [
                {"category": category, "amount": round(amount, 2)}
                for category, amount in categories[:5]
            ],
        }

    async def spending_by_month(self, user_id: str, period: str | None = None, months: int = 3) -> list[dict]:
        selected_period = period or month_period()
        end = month_start(next_month(selected_period))
        start_period = selected_period
        for _ in range(max(0, months - 1)):
            start_period = previous_month(start_period)
        start = month_start(start_period)
        transactions = await self.transactions.list(user_id, start=start, end=end, limit=20_000)
        totals: dict[str, float] = {}
        for item in transactions:
            if item.type == "expense":
                key = item.created_at.strftime("%Y-%m")
                totals[key] = totals.get(key, 0.0) + float(item.amount)
        periods = []
        cursor = start
        for _ in range(months):
            key = cursor.strftime("%Y-%m")
            periods.append({"period": key, "expenses": round(totals.get(key, 0.0), 2)})
            cursor = month_start(next_month(key))
        return periods[-months:]
