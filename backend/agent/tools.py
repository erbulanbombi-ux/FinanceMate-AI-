from __future__ import annotations

from typing import Any, Awaitable, Callable

from backend.services.analytics import FinancialAnalytics
from backend.services.anomaly_detection import AnomalyDetectionService
from backend.services.budget import BudgetService
from backend.services.forecasting import ForecastingService
from backend.services.simulation import PurchaseSimulationService
from backend.services.transactions import TransactionService

ToolHandler = Callable[[str, dict[str, Any]], Awaitable[Any]]


class FinanceTools:
    def __init__(
        self,
        transactions: TransactionService,
        budgets: BudgetService,
        analytics: FinancialAnalytics,
        anomalies: AnomalyDetectionService,
        forecasting: ForecastingService,
        simulation: PurchaseSimulationService,
    ) -> None:
        self.handlers: dict[str, ToolHandler] = {
            "get_balance": self.get_balance,
            "get_transactions": self.get_transactions,
            "get_budget": self.get_budget,
            "analyze_spending": self.analyze_spending,
            "detect_anomalies": self.detect_anomalies,
            "forecast_cashflow": self.forecast_cashflow,
            "simulate_purchase": self.simulate_purchase,
        }
        self._transactions = transactions
        self._budgets = budgets
        self._analytics = analytics
        self._anomalies = anomalies
        self._forecasting = forecasting
        self._simulation = simulation

    @staticmethod
    def specifications() -> list[dict]:
        definitions = [
            ("get_balance", "Get the user's balance and current-month financial summary.", {"type": "object", "properties": {}}),
            ("get_transactions", "Get recent transactions for the user.", {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 100}}}),
            ("get_budget", "Get category budgets, spending, and remaining amounts.", {"type": "object", "properties": {}}),
            ("analyze_spending", "Summarize current-month spending by category.", {"type": "object", "properties": {}}),
            ("detect_anomalies", "Find categories spending over 1.5 times their prior-three-month average.", {"type": "object", "properties": {}}),
            ("forecast_cashflow", "Forecast next month's income, expenses, and savings.", {"type": "object", "properties": {}}),
            ("simulate_purchase", "Simulate affordability and buffer impact for a proposed purchase.", {"type": "object", "properties": {"purchase": {"type": "number", "exclusiveMinimum": 0}}}),
        ]
        return [{"toolSpec": {"name": name, "description": description, "inputSchema": {"json": schema}}} for name, description, schema in definitions]

    async def execute(self, name: str, user_id: str, arguments: dict[str, Any]) -> Any:
        handler = self.handlers.get(name)
        if handler is None:
            raise ValueError(f"Unsupported finance tool: {name}")
        return await handler(user_id, arguments)

    async def get_balance(self, user_id: str, _: dict[str, Any]) -> dict:
        return await self._analytics.dashboard(user_id)

    async def get_transactions(self, user_id: str, args: dict[str, Any]) -> list[dict]:
        rows = await self._transactions.list(user_id, limit=max(1, min(100, int(args.get("limit", 20)))))
        return [item.model_dump(mode="json") for item in rows]

    async def get_budget(self, user_id: str, _: dict[str, Any]) -> list[dict]:
        rows = await self._budgets.get(user_id)
        return [item.model_dump(mode="json", by_alias=True) for item in rows]

    async def analyze_spending(self, user_id: str, _: dict[str, Any]) -> dict:
        return await self._analytics.dashboard(user_id)

    async def detect_anomalies(self, user_id: str, _: dict[str, Any]) -> list[dict]:
        return await self._anomalies.detect(user_id)

    async def forecast_cashflow(self, user_id: str, _: dict[str, Any]) -> dict:
        return await self._forecasting.forecast(user_id)

    async def simulate_purchase(self, user_id: str, args: dict[str, Any]) -> dict:
        result = await self._simulation.simulate(user_id, float(args["purchase"]))
        return result.model_dump(mode="json")
