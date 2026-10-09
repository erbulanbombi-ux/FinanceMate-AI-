from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, status

from backend.api.auth import require_current_user
from backend.database.models import MONTH_PERIOD_PATTERN, BudgetCreate, BudgetResponse

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def save_budget(
    payload: BudgetCreate,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> BudgetResponse:
    owned_payload = payload.model_copy(update={"user_id": current_user["user_id"]})
    return await request.app.state.budgets.save(owned_payload)


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    request: Request,
    current_user: dict = Depends(require_current_user),
    period: str | None = Query(default=None, pattern=MONTH_PERIOD_PATTERN),
) -> list[BudgetResponse]:
    return await request.app.state.budgets.get(current_user["user_id"], period)
