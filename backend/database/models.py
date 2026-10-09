from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MONTH_PERIOD_PATTERN = r"^(?:000[1-9]|00[1-9][0-9]|0[1-9][0-9]{2}|[1-9][0-9]{3})-(?:0[1-9]|1[0-2])$"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class APIModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class TransactionCreate(APIModel):
    """A transaction supplied by the frontend. Amounts are always positive."""

    user_id: str = Field(default="default", min_length=1, max_length=128)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    category: str = Field(min_length=1, max_length=64)
    description: str = Field(default="", max_length=500)
    type: Literal["income", "expense"]
    currency: str = Field(default="KZT", min_length=3, max_length=3)
    created_at: datetime = Field(default_factory=utc_now)

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()


class TransactionResponse(TransactionCreate):
    id: int


class BudgetCreate(APIModel):
    user_id: str = Field(default="default", min_length=1, max_length=128)
    category: str = Field(min_length=1, max_length=64)
    limit_amount: Decimal = Field(
        gt=0,
        max_digits=14,
        decimal_places=2,
        alias="limit",
        serialization_alias="limit",
    )
    period: str | None = Field(default=None, pattern=MONTH_PERIOD_PATTERN)

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return value.strip().lower()


class BudgetResponse(APIModel):
    id: int
    user_id: str
    category: str
    limit_amount: float = Field(serialization_alias="limit")
    spent: float
    remaining: float
    status: Literal["safe", "warning", "exceeded"]
    period: str


class ChatRequest(APIModel):
    user_id: str = Field(default="default", min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=4_000)


class ChatResponse(APIModel):
    answer: str
    insights: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)


class FinanceAnalysisRequest(APIModel):
    monthly_income: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    daily_expenses: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    target_goal: str = Field(min_length=1, max_length=200)
    target_price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    time_frame_months: int = Field(ge=1, le=600)

    @field_validator("target_goal")
    @classmethod
    def normalize_target_goal(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("target_goal must not be blank")
        return value


class SimulationRequest(APIModel):
    user_id: str = Field(default="default", min_length=1, max_length=128)
    purchase: Decimal = Field(gt=0, max_digits=14, decimal_places=2)


class SimulationResponse(APIModel):
    can_afford: bool
    remaining_balance: float
    savings_impact: float
    risk: Literal["low", "medium", "high"]
    recommendation: str
    emergency_buffer: float

