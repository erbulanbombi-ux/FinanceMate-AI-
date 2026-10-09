from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from backend.api.auth import require_current_user
from backend.database.models import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> TransactionResponse:
    owned_payload = payload.model_copy(update={"user_id": current_user["user_id"]})
    return await request.app.state.transactions.create(owned_payload)


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    request: Request,
    current_user: dict = Depends(require_current_user),
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[TransactionResponse]:
    if start and end and start >= end:
        raise HTTPException(status_code=422, detail="start must be earlier than end")
    return await request.app.state.transactions.list(
        current_user["user_id"], start=start, end=end, limit=limit
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> Response:
    deleted = await request.app.state.transactions.delete(current_user["user_id"], transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
