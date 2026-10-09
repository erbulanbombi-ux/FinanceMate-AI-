from __future__ import annotations

from fastapi import APIRouter, Query, Request, status

from backend.database.models import MONTH_PERIOD_PATTERN, BudgetCreate, BudgetResponse

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def save_budget(payload: BudgetCreate, request: Request) -> BudgetResponse:
    return await request.app.state.budgets.save(payload)


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    request: Request,
    user_id: str = Query(default="default", min_length=1, max_length=128),
    period: str | None = Query(default=None, pattern=MONTH_PERIOD_PATTERN),
) -> list[BudgetResponse]:
    return await request.app.state.budgets.get(user_id, period)
