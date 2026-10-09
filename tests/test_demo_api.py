import asyncio
import unittest
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.dashboard import router as dashboard_router


class DemoDashboardApiTests(unittest.TestCase):
    def test_dashboard_is_available_without_login(self):
        class FakeAnalytics:
            async def dashboard(self, user_id, period):
                return {"user_id": user_id, "period": period, "balance": 0}

        app = FastAPI()
        app.state.analytics = FakeAnalytics()
        app.include_router(dashboard_router)

        with TestClient(app) as client:
            response = client.get("/api/dashboard")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user_id"], "default")


if __name__ == "__main__":
    unittest.main()