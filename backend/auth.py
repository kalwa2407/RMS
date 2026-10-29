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


import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def _ensure_firebase_app():
    """Ensure firebase_admin is initialized before verifying customer tokens."""
    try:
        import firebase_admin
        if firebase_admin._apps:
            return True

        from firebase_admin import credentials

        # 1. Environment JSON string
        cred_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if cred_env:
            try:
                import json
                cred_dict = json.loads(cred_env)
                firebase_admin.initialize_app(credentials.Certificate(cred_dict))
                return True
            except Exception as e:
                logger.warning(f"Failed to init Firebase from env json: {e}")

        # 2. File path
        cred_path = os.environ.get("FIREBASE_CREDENTIALS", "firebase_credentials.json")
        cred_file = Path(__file__).parent / cred_path
        if cred_file.exists():
            try:
                firebase_admin.initialize_app(credentials.Certificate(str(cred_file)))
                return True
            except Exception as e:
                logger.warning(f"Failed to init Firebase from file {cred_file}: {e}")

        # 3. Default GCP / Project ID
        project_id = os.environ.get("FIREBASE_PROJECT_ID", "tasteofhindustanrms")
        try:
            firebase_admin.initialize_app(options={"projectId": project_id})
            return True
        except Exception as e:
            logger.warning(f"Failed to init Firebase with projectId: {e}")

    except Exception as e:
        logger.warning(f"Error checking firebase_admin: {e}")

    return False


def _verify_token_claims(token: str) -> Optional[dict]:
    """Helper to verify Firebase token or Google ID token or internal JWT."""
    # 1. Try Firebase Admin SDK
    try:
        _ensure_firebase_app()
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            decoded = fb_auth.verify_id_token(token, clock_skew_seconds=10)
            phone_num = decoded.get("phone_number") or decoded.get("phone") or ""
            if phone_num.startswith("+91"):
                phone_num = phone_num[3:]
            return {
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "name": decoded.get("name", "Customer"),
                "picture": decoded.get("picture"),
                "phone": phone_num
            }
    except Exception as e:
        logger.debug(f"Firebase Admin verify_id_token failed: {e}")

    # 2. Try direct Google OAuth2 token verification (does not require service account credentials)
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        project_id = os.environ.get("FIREBASE_PROJECT_ID", "tasteofhindustanrms")
        req = google_requests.Request()
        decoded = google_id_token.verify_firebase_token(token, req, audience=project_id)
        if decoded:
            phone_num = decoded.get("phone_number") or decoded.get("phone") or ""
            if phone_num.startswith("+91"):
                phone_num = phone_num[3:]
            return {
                "uid": decoded.get("user_id") or decoded.get("sub"),
                "email": decoded.get("email"),
                "name": decoded.get("name", "Customer"),
                "picture": decoded.get("picture"),
                "phone": phone_num
            }
    except Exception as e:
        logger.debug(f"Google ID token direct verification failed: {e}")

    # 3. Try internal JWT decode
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub"):
            return {
                "uid": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name", "Customer"),
                "picture": payload.get("picture"),
                "phone": payload.get("phone", "")
            }
    except Exception:
        pass

    # 4. Apple Review & QA Test Token Bypass (Guideline 4.8 Compliance)
    if token and (
        token.startswith("apple_reviewer") or 
        token.startswith("apple_patron") or 
        token == "apple_jwt_session_token" or
        token == "apple_reviewer_jwt_token_demo"
    ):
        return {
            "uid": "apple_reviewer_demo",
            "email": "reviewer@privaterelay.appleid.com",
            "name": "Apple Patron",
            "picture": "",
            "phone": "9820144782"
        }

    return None


security_optional = HTTPBearer(auto_error=False)


def verify_customer_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Firebase ID token or internal JWT for customer. Returns user dict."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer authentication required")
    
    user = _verify_token_claims(credentials.credentials)
    if user:
        return user
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid customer token")


def get_optional_customer(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)) -> Optional[dict]:
    """Optional customer token verifier for guest/authenticated hybrid routes."""
    if not credentials or not credentials.credentials:
        return None
    return _verify_token_claims(credentials.credentials)


