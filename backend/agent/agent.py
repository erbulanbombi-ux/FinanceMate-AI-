from __future__ import annotations

import asyncio
import json
import os

from backend.agent.prompts import SYSTEM_PROMPT
from backend.agent.tools import FinanceTools


class FinanceAgent:
    """Finance agent using Gemini by default, with optional provider overrides."""

    def __init__(
        self,
        tools: FinanceTools,
        *,
        region: str,
        model_id: str,
        provider: str = "gemini",
        provider_api_key: str | None = None,
        provider_model: str = "gemini-3.5-flash",
        provider_base_url: str | None = None,
    ) -> None:
        self.tools = tools
        self.region = region
        self.model_id = model_id
        self.provider = provider
        self.provider_api_key = provider_api_key
        self.provider_model = provider_model
        self.provider_base_url = provider_base_url
        self._client = None

    def _bedrock_client(self):
        if self._client is None:
            import boto3
            self._client = boto3.client("bedrock-runtime", region_name=self.region)
        return self._client

    async def chat(self, user_id: str, message: str) -> dict:
        if self.provider in {"openai", "openrouter", "gemini", "ollama"}:
            return await self._compatible_chat(user_id, message)
        return await self._bedrock_chat(user_id, message)

    async def _compatible_chat(self, user_id: str, message: str) -> dict:
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise RuntimeError("OpenAI-compatible providers require the openai package.") from exc

        if self.provider == "ollama":
            client_options = {
                "api_key": self.provider_api_key or "ollama",
                "base_url": self.provider_base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1"),
            }
        else:
            if not self.provider_api_key:
                raise RuntimeError(f"{self.provider.upper()} API key is not configured.")
            client_options = {"api_key": self.provider_api_key}
            if self.provider == "gemini":
                client_options["base_url"] = "https://generativelanguage.googleapis.com/v1beta/openai/"
            elif self.provider_base_url:
                client_options["base_url"] = self.provider_base_url
        client = AsyncOpenAI(**client_options)
        messages: list[dict] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ]
        openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": item["toolSpec"]["name"],
                    "description": item["toolSpec"]["description"],
                    "parameters": item["toolSpec"]["inputSchema"]["json"],
                },
            }
            for item in self.tools.specifications()
        ]
        tools_used: list[str] = []

        for _ in range(6):
            response = await client.chat.completions.create(
                model=self.provider_model,
                messages=messages,
                tools=openai_tools,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=1200,
            )
            assistant = response.choices[0].message
            calls = assistant.tool_calls or []
            if not calls:
                return {
                    "answer": assistant.content or "I couldn't produce an answer for that request.",
                    "insights": [],
                    "tools_used": tools_used,
                }

            messages.append(assistant.model_dump(exclude_none=True))
            for call in calls:
                if call.function.name not in tools_used:
                    tools_used.append(call.function.name)
                try:
                    arguments = json.loads(call.function.arguments or "{}")
                    result = await self.tools.execute(call.function.name, user_id, arguments)
                    content = json.dumps({"result": result}, ensure_ascii=False, default=str)
                except Exception as exc:
                    content = json.dumps({"error": str(exc)}, ensure_ascii=False)
                messages.append(
                    {"role": "tool", "tool_call_id": call.id, "content": content}
                )
        raise RuntimeError("OpenAI agent reached its tool-call limit before completing the answer")

    async def _bedrock_chat(self, user_id: str, message: str) -> dict:
        messages: list[dict] = [{"role": "user", "content": [{"text": message}]}]
        tools_used: list[str] = []
        for _ in range(6):
            try:
                client = self._bedrock_client()
                response = await asyncio.to_thread(
                    client.converse,
                    modelId=self.model_id,
                    system=[{"text": SYSTEM_PROMPT}],
                    messages=messages,
                    toolConfig={"tools": self.tools.specifications(), "toolChoice": {"auto": {}}},
                    inferenceConfig={"temperature": 0.2, "maxTokens": 1200},
                )
            except ImportError as exc:
                raise RuntimeError("Bedrock support requires boto3. Install the backend requirements.") from exc

            assistant = response["output"]["message"]
            messages.append(assistant)
            calls = [block["toolUse"] for block in assistant.get("content", []) if "toolUse" in block]
            if not calls:
                answer = "\n".join(block.get("text", "") for block in assistant.get("content", []) if block.get("text"))
                return {
                    "answer": answer or "I couldn't produce an answer for that request.",
                    "insights": [],
                    "tools_used": tools_used,
                }

            results = []
            for call in calls:
                if call["name"] not in tools_used:
                    tools_used.append(call["name"])
                try:
                    payload = {"result": await self.tools.execute(call["name"], user_id, call.get("input") or {})}
                except Exception as exc:
                    payload = {"error": str(exc)}
                results.append({"toolResult": {"toolUseId": call["toolUseId"], "content": [{"json": payload}]}})
            messages.append({"role": "user", "content": results})
        raise RuntimeError("Bedrock agent reached its tool-call limit before completing the answer")
