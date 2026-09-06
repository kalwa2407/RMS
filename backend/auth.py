from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SECRET_KEY = "persian_darbar_secret_key_2025_very_secure"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

import hashlib

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def _decode_payload(credentials: HTTPAuthorizationCredentials) -> dict:
    """Internal: decode JWT and return full payload dict."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid authentication credentials")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid authentication credentials")


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Generic — returns sub. Kept for backward compatibility with all admin routes."""
    return _decode_payload(credentials)["sub"]


def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify token has role=admin. Returns username."""
    payload = _decode_payload(credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return payload["sub"]


def verify_captain_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify token has role=captain. Returns captain_id."""
    payload = _decode_payload(credentials)
    if payload.get("role") != "captain":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Captain access required")
    return payload["sub"]


def verify_delivery_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify token has role=delivery. Returns phone."""
    payload = _decode_payload(credentials)
    if payload.get("role") != "delivery":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Delivery partner access required")
    return payload["sub"]


def verify_kitchen_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify token has role=kitchen. Returns staff_id."""
    payload = _decode_payload(credentials)
    if payload.get("role") != "kitchen":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Kitchen staff access required")
    return payload["sub"]
