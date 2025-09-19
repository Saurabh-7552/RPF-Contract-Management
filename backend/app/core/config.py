import os
from pydantic import BaseModel


class Settings(BaseModel):
    secret_key: str = os.getenv("SECRET_KEY", "change-this-in-production")
    access_token_expires_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    refresh_token_expires_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    database_url: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:verma2017@localhost:5432/rfp_contracts")


settings = Settings()







