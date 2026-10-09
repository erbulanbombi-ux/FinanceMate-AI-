import asyncio
import unittest

from backend.agent.agent import FinanceAgent


class DummyTools:
    def specifications(self):
        return []

    async def execute(self, *args, **kwargs):
        return {}


class AiProviderTests(unittest.TestCase):
    def test_ollama_uses_openai_compatible_path(self):
        agent = FinanceAgent(
            DummyTools(),
            region="us-east-1",
            model_id="placeholder",
            provider="ollama",
            provider_api_key="ollama",
            provider_model="llama3.2",
        )

        called = {"value": False}

        async def fake_compatible_chat(user_id, message):
            called["value"] = True
            return {"answer": "ok", "insights": [], "tools_used": []}

        agent._compatible_chat = fake_compatible_chat

        async def run():
            return await agent.chat("user-1", "hello")

        result = asyncio.run(run())
        self.assertTrue(called["value"])
        self.assertEqual(result["answer"], "ok")

    def test_openrouter_uses_openai_compatible_path(self):
        agent = FinanceAgent(
            DummyTools(),
            region="us-east-1",
            model_id="placeholder",
            provider="openrouter",
            provider_api_key="test-key",
            provider_model="openai/gpt-4o-mini",
            provider_base_url="https://openrouter.ai/api/v1",
        )

        called = {"value": False}

        async def fake_compatible_chat(user_id, message):
            called["value"] = True
            return {"answer": "ok", "insights": [], "tools_used": []}

        agent._compatible_chat = fake_compatible_chat

        async def run():
            return await agent.chat("user-1", "hello")

        result = asyncio.run(run())
        self.assertTrue(called["value"])
        self.assertEqual(result["answer"], "ok")


if __name__ == "__main__":
    unittest.main()
