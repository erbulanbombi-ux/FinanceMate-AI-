from __future__ import annotations

import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status

from backend.database.models import (
    AuthCredentials,
    EmailRequest,
    LoginCredentials,
    PasswordResetRequest,
    TokenRequest,
)
from backend.services.auth import AuthRateLimited

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["authentication"])
SESSION_COOKIE = "finmate_session"


def _set_session_cookie(response: Response, session: dict) -> dict:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session["access_token"],
        max_age=session["expires_in"],
        httponly=True,
        secure=os.getenv("SESSION_COOKIE_SECURE", "false").strip().lower() == "true",
        samesite="strict",
        path="/api",
    )
    response.headers["Cache-Control"] = "no-store"
    return {"user": session["user"], "expires_in": session["expires_in"]}


async def require_trusted_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin not in request.app.state.allowed_origins:
        raise HTTPException(status_code=403, detail="Request origin is not allowed")


async def require_current_user(
    request: Request,
) -> dict:
    cookie_token = request.cookies.get(SESSION_COOKIE)
    token = cookie_token
    if cookie_token and request.method not in {"GET", "HEAD", "OPTIONS"}:
        await require_trusted_origin(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to access this resource",
        )
    user = await request.app.state.auth.authenticate(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    request.state.auth_token = token
    request.state.auth_cookie = bool(cookie_token)
    return user


@router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_trusted_origin)],
)
async def register(
    payload: AuthCredentials,
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    try:
        result = await request.app.state.auth.register(
            payload.username,
            payload.email,
            payload.password,
            request.client.host if request.client else "unknown",
        )
    except AuthRateLimited as exc:
        raise HTTPException(status_code=429, detail=str(exc), headers={"Retry-After": "3600"}) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        return {"message": "If the account can be created, a verification email will be sent."}
    background_tasks.add_task(
        request.app.state.email.send_verification,
        result["recipient"],
        result["verification_link"],
    )
    return {"message": result["message"]}


@router.post("/verify-email", dependencies=[Depends(require_trusted_origin)])
async def verify_email(payload: TokenRequest, request: Request) -> dict:
    try:
        verified = await request.app.state.auth.verify_email(
            payload.token, request.client.host if request.client else "unknown"
        )
    except AuthRateLimited as exc:
        raise HTTPException(status_code=429, detail=str(exc), headers={"Retry-After": "3600"}) from exc
    if not verified:
        raise HTTPException(status_code=400, detail="Verification link is invalid or expired")
    return {"message": "Email verified. You can now sign in."}


@router.post(
    "/resend-verification",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_trusted_origin)],
)
async def resend_verification(
    payload: EmailRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    if request.app.state.email.is_configured:
        result = await request.app.state.auth.resend_verification(
            payload.email, request.client.host if request.client else "unknown"
        )
        if result:
            background_tasks.add_task(
                request.app.state.email.send_verification, result["recipient"], result["link"]
            )
    return {"message": "If the account needs verification, an email will be sent."}


@router.post("/login", dependencies=[Depends(require_trusted_origin)])
async def login(
    payload: LoginCredentials,
    request: Request,
    response: Response,
) -> dict:
    try:
        result = await request.app.state.auth.login(
            payload.username,
            payload.password,
            request.client.host if request.client else "unknown",
        )
    except AuthRateLimited as exc:
        raise HTTPException(
            status_code=429,
            detail=str(exc),
            headers={"Retry-After": "900"},
        ) from exc
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return _set_session_cookie(response, result)


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_trusted_origin)],
)
async def forgot_password(
    payload: EmailRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    if request.app.state.email.is_configured:
        try:
            result = await request.app.state.auth.request_password_reset(
                payload.email, request.client.host if request.client else "unknown"
            )
            if result:
                background_tasks.add_task(
                    request.app.state.email.send_password_reset,
                    result["recipient"],
                    result["link"],
                )
        except AuthRateLimited:
            pass
        except Exception:
            logger.exception("Password reset request could not be processed")
    return {"message": "If a verified account exists for this email, reset instructions will be sent."}


@router.post("/reset-password", dependencies=[Depends(require_trusted_origin)])
async def reset_password(
    payload: PasswordResetRequest,
    request: Request,
    response: Response,
) -> dict:
    try:
        changed = await request.app.state.auth.reset_password(
            payload.token,
            payload.password,
            request.client.host if request.client else "unknown",
        )
    except AuthRateLimited as exc:
        raise HTTPException(status_code=429, detail=str(exc), headers={"Retry-After": "3600"}) from exc
    if not changed:
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired")
    response.delete_cookie(SESSION_COOKIE, path="/api", samesite="strict")
    response.headers["Cache-Control"] = "no-store"
    return {"message": "Password changed. Sign in again with your new password."}


@router.get("/me")
async def get_current_account(user: dict = Depends(require_current_user)) -> dict:
    return user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_current_user)],
)
async def logout(request: Request, response: Response) -> None:
    await request.app.state.auth.logout(request.state.auth_token)
    response.delete_cookie(SESSION_COOKIE, path="/api", samesite="strict")
    response.headers["Cache-Control"] = "no-store"
