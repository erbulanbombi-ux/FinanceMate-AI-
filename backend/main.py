from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.agent.agent import FinanceAgent
from backend.agent.tools import FinanceTools
from backend.api.auth import router as auth_router
from backend.api.budget import router as budget_router
from backend.api.chat import router as chat_router
from backend.api.dashboard import router as dashboard_router
from backend.api.transactions import router as transactions_router
from backend.database.database import FinanceDatabase
from backend.services.analytics import FinancialAnalytics
from backend.services.anomaly_detection import AnomalyDetectionService
from backend.services.auth import AuthService
from backend.services.email import EmailService
from backend.services.budget import BudgetService
from backend.services.forecasting import ForecastingService
from backend.services.simulation import PurchaseSimulationService
from backend.services.transactions import TransactionService

load_dotenv(Path(__file__).resolve().parent / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database = FinanceDatabase(Path(os.getenv("FINANCE_DATABASE_PATH", "data/finance.db")))
    await database.initialize()
    email = EmailService()
    auth = AuthService(database, email)
    transactions = TransactionService(database)
    analytics = FinancialAnalytics(database, transactions)
    budgets = BudgetService(database, transactions)
    anomalies = AnomalyDetectionService(database, transactions)
    forecasting = ForecastingService(database, transactions)
    simulation = PurchaseSimulationService(analytics, forecasting)
    tools = FinanceTools(transactions, budgets, analytics, anomalies, forecasting, simulation)
    provider = os.getenv("AI_PROVIDER", "ollama").strip().lower()
    if provider == "gemini":
        provider_api_key = os.getenv("GEMINI_API_KEY")
        provider_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        provider_base_url = None
    elif provider == "openrouter":
        provider_api_key = os.getenv("OPENROUTER_API_KEY")
        provider_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        provider_base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    elif provider == "openai":
        provider_api_key = os.getenv("OPENAI_API_KEY") or "ollama"
        provider_model = os.getenv("OPENAI_MODEL", "llama3.2:latest")
        provider_base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
    elif provider == "ollama":
        provider_api_key = os.getenv("OLLAMA_API_KEY", "ollama")
        provider_model = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
        provider_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
    else:
        provider_api_key = None
        provider_model = ""
        provider_base_url = None

    if provider in {"gemini", "openai"} and not provider_api_key:
        provider = "ollama"
        provider_api_key = os.getenv("OLLAMA_API_KEY", "ollama")
        provider_model = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
        provider_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
    agent = FinanceAgent(
        tools,
        region=os.getenv("AWS_REGION", "us-east-1"),
        model_id=os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"),
        provider=provider,
        provider_api_key=provider_api_key,
        provider_model=provider_model,
        provider_base_url=provider_base_url,
    )
    app.state.database = database
    app.state.auth = auth
    app.state.email = email
    app.state.transactions = transactions
    app.state.analytics = analytics
    app.state.budgets = budgets
    app.state.anomalies = anomalies
    app.state.forecasting = forecasting
    app.state.simulation = simulation
    app.state.agent = agent
    try:
        yield
    finally:
        await database.close()


app = FastAPI(
    title="FinMate Finance API",
    description="Personal finance analytics and a tool-using AI assistant powered by OpenAI, OpenRouter, Gemini, or Amazon Bedrock.",
    version="1.0.0",
    lifespan=lifespan,
)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:8001",
    ).split(",")
    if origin.strip()
]
app.state.allowed_origins = allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(transactions_router)
app.include_router(budget_router)
app.include_router(dashboard_router)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
