"""JWT and password utilities for the Eventory multisite backend."""

import logging
import warnings
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        env_prefix = "BACKEND_"


settings = Settings()

_DEFAULT_SECRET = "change-me-in-production-use-a-long-random-string"
if settings.secret_key == _DEFAULT_SECRET:
    warnings.warn(
        "BACKEND_SECRET_KEY is set to the default value. "
        "Change it before deploying to production.",
        stacklevel=1,
    )
    logging.getLogger(__name__).warning(
        "BACKEND_SECRET_KEY is using the insecure default value."
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[str]:
    """Return the username embedded in *token*, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload.get("sub")
    except JWTError:
        return None
