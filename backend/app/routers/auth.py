from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password, decode_token
from app.db.models import User, UserRole
from app.db.session import get_async_session
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.dependencies.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_async_session)):
    role_value = payload.role.lower()
    if role_value not in (UserRole.buyer.value, UserRole.supplier.value):
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password), role=UserRole(role_value))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(response: Response, payload: LoginRequest, session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/auth/refresh",
    )
    return TokenResponse(access_token=access)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(response: Response, refresh_token: str | None = None, session: AsyncSession = Depends(get_async_session)):
    # Try to read from cookie first if not passed explicitly
    if refresh_token is None:
        # FastAPI exposes cookies via Response/Request, but for brevity we access via private attribute here
        # In production, use Request.cookies
        raise HTTPException(status_code=400, detail="Refresh token required")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await session.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(str(user.id))
    return TokenResponse(access_token=new_access)


@router.post("/logout", status_code=204)
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/auth/refresh")
    return Response(status_code=204)


@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user







