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


security_optional = HTTPBearer(auto_error=False)


def verify_customer_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Firebase ID token or internal JWT for customer. Returns user dict."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer authentication required")
    token = credentials.credentials
    
    # 1. Try Firebase Admin ID Token verification
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            decoded = fb_auth.verify_id_token(token)
            return {
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "name": decoded.get("name", "Customer"),
                "picture": decoded.get("picture")
            }
    except Exception:
        pass
    
    # 2. Try internal JWT decode
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub"):
            return {
                "uid": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name", "Customer"),
                "picture": payload.get("picture")
            }
    except Exception:
        pass
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid customer token")


def get_optional_customer(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)) -> Optional[dict]:
    """Optional customer token verifier for guest/authenticated hybrid routes."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials
    
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            decoded = fb_auth.verify_id_token(token)
            return {
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "name": decoded.get("name", "Customer"),
                "picture": decoded.get("picture")
            }
    except Exception:
        pass

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub"):
            return {
                "uid": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name", "Customer"),
                "picture": payload.get("picture")
            }
    except Exception:
        pass

    return None

