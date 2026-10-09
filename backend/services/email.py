from __future__ import annotations

import asyncio
import os
import smtplib
import ssl
from email.message import EmailMessage


class EmailService:
    def __init__(self) -> None:
        self.host = os.getenv("SMTP_HOST", "").strip()
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("SMTP_USERNAME", "").strip()
        self.password = os.getenv("SMTP_PASSWORD", "")
        self.sender = os.getenv("SMTP_FROM_EMAIL", self.username).strip()
        self.use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() == "true"
        self.verification_url = os.getenv(
            "EMAIL_VERIFICATION_URL", "http://127.0.0.1:5173/verify-email"
        ).strip()
        self.reset_url = os.getenv(
            "PASSWORD_RESET_URL", "http://127.0.0.1:5173/reset-password"
        ).strip()

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.sender and self.username and self.password)

    async def send_verification(self, recipient: str, link: str) -> None:
        await asyncio.to_thread(
            self._send_sync,
            recipient,
            "Verify your FinMate email",
            f"Open this one-time link to verify your email address:\n\n{link}\n\nThis link expires in 24 hours.",
        )

    async def send_password_reset(self, recipient: str, link: str) -> None:
        await asyncio.to_thread(
            self._send_sync,
            recipient,
            "Reset your FinMate password",
            f"Open this one-time link to reset your password:\n\n{link}\n\nThis link expires in 15 minutes. If you did not request a reset, ignore this email.",
        )

    def verification_link(self, token: str) -> str:
        return f"{self.verification_url.split('#', maxsplit=1)[0]}#token={token}"

    def reset_link(self, token: str) -> str:
        return f"{self.reset_url.split('#', maxsplit=1)[0]}#token={token}"

    def _send_sync(self, recipient: str, subject: str, body: str) -> None:
        if not self.is_configured:
            raise RuntimeError("SMTP email delivery is not configured")
        message = EmailMessage()
        message["From"] = self.sender
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)
        context = ssl.create_default_context()
        if self.use_ssl:
            with smtplib.SMTP_SSL(self.host, self.port, timeout=10, context=context) as server:
                if self.username:
                    server.login(self.username, self.password)
                server.send_message(message)
            return
        with smtplib.SMTP(self.host, self.port, timeout=10) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            if self.username:
                server.login(self.username, self.password)
            server.send_message(message)