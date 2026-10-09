from __future__ import annotations

import math

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.auth import require_current_user
from backend.database.models import ChatRequest, ChatResponse, FinanceAnalysisRequest

router = APIRouter(prefix="/api", tags=["AI agent"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> ChatResponse:
    try:
        user_id = current_user["user_id"]
        result = await request.app.state.agent.chat(user_id, payload.message)
    except Exception as exc:
        # Keep provider credentials and raw error details out of the frontend response.
        if getattr(exc, "status_code", None) == 402 and request.app.state.agent.provider == "gemini":
            detail = "Gemini API credits are depleted. Check billing in Google AI Studio."
        elif isinstance(exc, RuntimeError) and "API key is not configured." in str(exc):
            detail = str(exc)
        else:
            detail = f"AI provider request failed: {type(exc).__name__}"
        raise HTTPException(status_code=502, detail=detail) from exc
    insights = []
    try:
        anomalies = await request.app.state.anomalies.detect(user_id)
        insights.extend(
            f"{row['category']} +{row['increase_percent']}% vs. recent average"
            for row in anomalies
        )
    except Exception:
        pass
    return ChatResponse(
        answer=result["answer"],
        insights=insights,
        tools_used=result.get("tools_used", []),
    )


@router.post("/analyze-finance")
async def analyze_finance(
    payload: FinanceAnalysisRequest,
    request: Request,
    current_user: dict = Depends(require_current_user),
) -> dict:
    daily_target_savings = math.ceil(
        payload.target_price / (payload.time_frame_months * 30)
    )
    message = (
        "Create concise, practical savings advice for this financial goal. "
        "Use the provided income and expenses, mention the target daily savings amount, "
        "and answer in the same language as the goal if possible.\n"
        f"Monthly income: {payload.monthly_income}\n"
        f"Daily expenses: {payload.daily_expenses}\n"
        f"Goal: {payload.target_goal}\n"
        f"Goal price: {payload.target_price}\n"
        f"Time frame: {payload.time_frame_months} months\n"
        f"Daily target savings: {daily_target_savings}"
    )
    try:
        result = await request.app.state.agent.chat(current_user["user_id"], message)
    except Exception as exc:
        if getattr(exc, "status_code", None) == 402 and request.app.state.agent.provider == "gemini":
            detail = "Gemini API credits are depleted. Check billing in Google AI Studio."
        elif isinstance(exc, RuntimeError) and "API key is not configured." in str(exc):
            detail = str(exc)
        else:
            detail = f"AI provider request failed: {type(exc).__name__}"
        raise HTTPException(status_code=502, detail=detail) from exc

    return {
        "status": "success",
        "daily_target_savings": daily_target_savings,
        "ai_advice": result["answer"],
    }
