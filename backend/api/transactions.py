from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Request, Response, status

from backend.database.models import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(payload: TransactionCreate, request: Request) -> TransactionResponse:
    return await request.app.state.transactions.create(payload)


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    request: Request,
    user_id: str = Query(default="default", min_length=1, max_length=128),
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[TransactionResponse]:
    if start and end and start >= end:
        raise HTTPException(status_code=422, detail="start must be earlier than end")
    return await request.app.state.transactions.list(
        user_id, start=start, end=end, limit=limit
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    request: Request,
    user_id: str = Query(default="default", min_length=1, max_length=128),
) -> Response:
    deleted = await request.app.state.transactions.delete(user_id, transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
