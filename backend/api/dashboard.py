from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request

from backend.api.auth import require_current_user
from backend.database.models import MONTH_PERIOD_PATTERN, SimulationRequest

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard")
async def get_dashboard(
    request: Request,
    current_user: dict = Depends(require_current_user),
    period: str | None = Query(default=None, pattern=MONTH_PERIOD_PATTERN),
) -> dict:
    return await request.app.state.analytics.dashboard(current_user["user_id"], period)


@router.get("/api/forecast")
async def get_forecast(
    request: Request,
    current_user: dict = Depends(require_current_user),
    period: str | None = Query(default=None, pattern=MONTH_PERIOD_PATTERN),
) -> dict:
    return await request.app.state.forecasting.forecast(current_user["user_id"], period)


@router.get("/api/insights")
async def get_insights(
    request: Request,
    current_user: dict = Depends(require_current_user),
    period: str | None = Query(default=None, pattern=MONTH_PERIOD_PATTERN),
) -> dict:
    user_id = current_user["user_id"]
    anomalies = await request.app.state.anomalies.detect(user_id, period)
    budgets = await request.app.state.budgets.get(user_id, period)
    insights = [
        f"{row['category']}: spending is {row['increase_percent']}% above its recent average."
        for row in anomalies
    ]
    insights.extend(
        f"{budget.category}: budget {budget.status} ({budget.spent:g} of {budget.limit_amount:g})."
        for budget in budgets
        if budget.status in {"warning", "exceeded"}
    )
    return {"user_id": user_id, "period": period, "insights": insights, "anomalies": anomalies, "budgets": budgets}


@router.post("/api/simulate")
async def simulate_purchase(
    payload: SimulationRequest,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> dict:
    result = await request.app.state.simulation.simulate(
        current_user["user_id"], float(payload.purchase)
    )
    return result.model_dump(mode="json")
