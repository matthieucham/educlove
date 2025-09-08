"""
Authentication module for validating JWT tokens from external identity providers.
This module is designed to be pluggable and work with various providers like
Auth0, Firebase, AWS Cognito, Google OAuth, etc.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import os
from datetime import datetime, timezone
from models import User

# Try to load environment variables
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    # dotenv not available, will use system environment variables
    pass

# Conditional import for jose
try:
    from jose import jwt, JWTError
except ImportError:
    # Fallback for development when jose is not available
    import json
    import base64

    class JWTError(Exception):
        pass

    class jwt:
        @staticmethod
        def get_unverified_claims(token: str) -> Dict[str, Any]:
            """Simple JWT decode without verification for development"""
            try:
                # Split the JWT token
                parts = token.split(".")
                if len(parts) != 3:
                    raise JWTError("Invalid token format")

                # Decode the payload (second part)
                payload = parts[1]
                # Add padding if needed
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += "=" * padding

                # Decode base64
                decoded = base64.urlsafe_b64decode(payload)
                return json.loads(decoded)
            except Exception as e:
                raise JWTError(f"Failed to decode token: {str(e)}")

        @staticmethod
        def decode(token: str, key: str, algorithms: list, **kwargs) -> Dict[str, Any]:
            """Simple decode for development - just returns unverified claims"""
            return jwt.get_unverified_claims(token)

        @staticmethod
        def encode(claims: dict, key: str, algorithm: str) -> str:
            """Simple encode for development"""
            # Create a simple JWT-like token
            header = (
                base64.urlsafe_b64encode(
                    json.dumps({"alg": algorithm, "typ": "JWT"}).encode()
                )
                .decode()
                .rstrip("=")
            )
            payload = (
                base64.urlsafe_b64encode(json.dumps(claims, default=str).encode())
                .decode()
                .rstrip("=")
            )
            signature = "development-signature"
            return f"{header}.{payload}.{signature}"


# Security scheme for JWT Bearer tokens
security = HTTPBearer()


class AuthConfig:
    """Configuration for external identity provider"""

    def __init__(self):
        # These should be set as environment variables
        # Example for Auth0: https://YOUR_DOMAIN/.well-known/jwks.json
        # Example for Firebase: https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
        self.jwks_uri = os.getenv("JWKS_URI", "")
        self.issuer = os.getenv("JWT_ISSUER", "")
        self.audience = os.getenv("JWT_AUDIENCE", "")
        self.algorithm = os.getenv("JWT_ALGORITHM", "RS256")

        # For development/testing - can use HS256 with a secret
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-for-dev")
        self.skip_verification = (
            os.getenv("SKIP_JWT_VERIFICATION", "false").lower() == "true"
        )


auth_config = AuthConfig()


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate JWT token from external provider.

    In production, this should:
    1. Fetch public keys from JWKS endpoint
    2. Validate token signature
    3. Check issuer and audience claims
    4. Verify expiration

    For development, it can use a simpler validation or skip it entirely.
    """
    if auth_config.skip_verification:
        # Development mode - decode without verification
        # WARNING: Never use this in production!
        try:
            return jwt.get_unverified_claims(token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format"
            )

    try:
        # Production mode - full verification
        if auth_config.algorithm == "HS256":
            # Symmetric key (for simple providers or development)
            payload = jwt.decode(
                token,
                auth_config.jwt_secret,
                algorithms=[auth_config.algorithm],
                audience=auth_config.audience if auth_config.audience else None,
                issuer=auth_config.issuer if auth_config.issuer else None,
            )
        else:
            # Asymmetric key (RS256, etc.) - would need to fetch public key from JWKS
            # This is a simplified version - in production, use python-jose with JWKS
            # or a library like PyJWT with jwks-client
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="JWKS validation not implemented. Set SKIP_JWT_VERIFICATION=true for development.",
            )

        return payload

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=None,  # Will be injected by FastAPI
) -> User:
    """
    Extract and validate the current user from JWT token.

    This function:
    1. Validates the JWT token
    2. Extracts user information from token claims
    3. Creates or updates user in MongoDB
    4. Returns the User object
    """
    token = credentials.credentials

    # Decode and validate token
    token_data = decode_token(token)

    # Extract user information from token claims
    # Different providers use different claim names
    user_data = {
        "sub": token_data.get("sub")
        or token_data.get("uid")
        or token_data.get("user_id"),
        "email": token_data.get("email") or token_data.get("email_verified"),
        "name": token_data.get("name")
        or token_data.get("given_name", "") + " " + token_data.get("family_name", ""),
        "picture": token_data.get("picture") or token_data.get("avatar_url"),
        "provider": token_data.get("iss", "").split("/")[-1] or "unknown",
    }

    if not user_data["sub"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user identifier",
        )

    # Create User object
    # For OAuth providers (Google, etc.), email is already verified
    # For Auth0 password users, email_verified will be set separately
    is_oauth_provider = user_data["provider"] in [
        "google",
        "google-oauth2",
        "microsoft",
        "github",
    ]

    user = User(
        sub=user_data["sub"],
        email=user_data["email"] or f"{user_data['sub']}@unknown.com",
        name=user_data["name"],
        picture=user_data["picture"],
        provider=user_data["provider"],
        email_verified=is_oauth_provider,  # OAuth providers have verified emails
        profile_completed=False,  # Will be preserved if already exists in DB
        last_login=datetime.now(timezone.utc),
    )

    # Note: The actual database update will be handled in the main.py
    # when we have access to the database instance

    return user


class OptionalAuth:
    """
    Optional authentication dependency.
    Returns None if no valid token is provided.
    """

    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(
            HTTPBearer(auto_error=False)
        ),
    ) -> Optional[User]:
        if not credentials:
            return None

        try:
            return await get_current_user(credentials)
        except HTTPException:
            return None


# Export for use as dependency
optional_auth = OptionalAuth()
