from __future__ import annotations

import math

from backend.database.models import SimulationResponse
from backend.services.analytics import FinancialAnalytics
from backend.services.forecasting import ForecastingService


class PurchaseSimulationService:
    def __init__(self, analytics: FinancialAnalytics, forecasting: ForecastingService) -> None:
        self.analytics = analytics
        self.forecasting = forecasting

    async def simulate(self, user_id: str, purchase: float) -> SimulationResponse:
        dashboard = await self.analytics.dashboard(user_id)
        forecast = await self.forecasting.forecast(user_id)
        balance = float(dashboard["balance"])
        remaining = balance - purchase
        emergency_buffer = max(float(forecast["next_month_expenses"]), 0.0)
        monthly_savings = float(forecast["next_month_savings"])
        if remaining < 0 or remaining < emergency_buffer:
            risk = "high"
        elif remaining < emergency_buffer * 2:
            risk = "medium"
        else:
            risk = "low"

        if remaining < 0:
            shortfall = -remaining
            if monthly_savings > 0:
                wait_days = max(1, math.ceil(shortfall / monthly_savings * 30))
                recommendation = f"Wait approximately {wait_days} days while maintaining your current savings pace."
            else:
                recommendation = "This purchase exceeds your current balance; review your budget before proceeding."
        elif remaining < emergency_buffer:
            recommendation = "You can pay for it, but it would leave less than one forecasted month of expenses as a buffer."
        else:
            recommendation = "The purchase fits your current balance and leaves at least one forecasted month of expenses."
        return SimulationResponse(
            can_afford=balance >= purchase,
            remaining_balance=round(remaining, 2),
            savings_impact=round(-purchase, 2),
            risk=risk,
            recommendation=recommendation,
            emergency_buffer=round(emergency_buffer, 2),
        )
