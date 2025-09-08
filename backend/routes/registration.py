"""
Registration routes for email/password authentication with Auth0.
Handles user registration, email verification, and password reset.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from services.auth0_service import get_auth0_service
from database.mongo_database import MongoDatabase

router = APIRouter(prefix="/auth/register", tags=["registration"])


class RegistrationRequest(BaseModel):
    """Request model for user registration"""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    password_confirmation: str = Field(..., description="Password confirmation")
    first_name: Optional[str] = Field(
        None, min_length=1, max_length=50, description="User's first name"
    )


class RegistrationResponse(BaseModel):
    """Response model for successful registration"""

    success: bool
    message: str
    user_id: str
    email: str
    requires_verification: bool = True


class ResendVerificationRequest(BaseModel):
    """Request model for resending verification email"""

    email: EmailStr = Field(..., description="User's email address")


class LoginRequest(BaseModel):
    """Request model for email/password login"""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class LoginResponse(BaseModel):
    """Response model for successful login"""

    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_info: Optional[Dict[str, Any]] = None


class PasswordResetRequest(BaseModel):
    """Request model for password reset"""

    email: EmailStr = Field(..., description="User's email address")


def get_db():
    """Dependency to get database instance"""
    from main import db

    return db


@router.post("/create", response_model=RegistrationResponse)
async def register_user(
    request: RegistrationRequest, db: MongoDatabase = Depends(get_db)
):
    """
    Register a new user with email and password.

    This endpoint:
    1. Validates the email domain (must be educational)
    2. Validates password strength
    3. Creates user in Auth0
    4. Sends verification email
    5. Creates user record in MongoDB
    """
    auth0_service = get_auth0_service()

    # Validate passwords match
    if request.password != request.password_confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les mots de passe ne correspondent pas",
        )

    # Validate password strength
    is_valid, error_message = auth0_service.validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_message
        )

    # Validate email domain
    if not auth0_service.is_educational_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les emails des domaines éducatifs français sont acceptés (ac-*.fr, education.gouv.fr)",
        )

    try:
        # Create user in Auth0
        auth0_user = await auth0_service.create_user(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
        )

        # Create or update user in MongoDB
        user_data = {
            "sub": auth0_user["user_id"],
            "email": auth0_user["email"],
            "name": request.first_name,
            "provider": "auth0",
            "email_verified": False,
        }

        # Upsert user in database
        user_id = db.upsert_user(user_data)

        return RegistrationResponse(
            success=True,
            message="Inscription réussie! Un email de vérification a été envoyé à votre adresse.",
            user_id=auth0_user["user_id"],
            email=auth0_user["email"],
            requires_verification=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'inscription: {str(e)}",
        )


@router.post("/resend-verification")
async def resend_verification_email(
    request: ResendVerificationRequest, db: MongoDatabase = Depends(get_db)
):
    """
    Resend verification email to a user.

    Note: For security, this endpoint always returns success
    even if the email doesn't exist.
    """
    auth0_service = get_auth0_service()

    # Check if email is educational
    if not auth0_service.is_educational_email(request.email):
        return {
            "success": True,
            "message": "Si un compte existe avec cet email, un nouveau lien de vérification a été envoyé.",
        }

    # Try to find user in database
    user = db.get_user_by_email(request.email)

    if user and user.get("sub"):
        try:
            await auth0_service.send_verification_email(user["sub"])
        except:
            pass  # Silently fail to not reveal user existence

    return {
        "success": True,
        "message": "Si un compte existe avec cet email, un nouveau lien de vérification a été envoyé.",
    }


@router.post("/login", response_model=LoginResponse)
async def login_with_email_password(
    request: LoginRequest, db: MongoDatabase = Depends(get_db)
):
    """
    Authenticate user with email and password.

    Returns JWT tokens for authenticated access.
    """
    auth0_service = get_auth0_service()

    try:
        # Authenticate with Auth0
        auth_result = await auth0_service.login_with_password(
            email=request.email, password=request.password
        )

        # Update user's last login in database
        user = db.get_user_by_email(request.email)
        if user:
            db.update_user_last_login(user["_id"])

        # Extract user info from tokens if available
        user_info = None
        if "id_token" in auth_result:
            # In production, decode the ID token to get user info
            # For now, return basic info from database
            if user:
                user_info = {
                    "user_id": str(user["_id"]),
                    "email": user["email"],
                    "name": user.get("name"),
                    "has_profile": bool(user.get("profile_id")),
                }

        return LoginResponse(
            access_token=auth_result["access_token"],
            token_type=auth_result.get("token_type", "Bearer"),
            expires_in=auth_result.get("expires_in", 86400),
            user_info=user_info,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )


@router.post("/reset-password")
async def request_password_reset(request: PasswordResetRequest):
    """
    Request a password reset email.

    Note: For security, this endpoint always returns success
    even if the email doesn't exist.
    """
    auth0_service = get_auth0_service()

    try:
        await auth0_service.reset_password(request.email)
    except:
        pass  # Silently fail to not reveal user existence

    return {
        "success": True,
        "message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    }


@router.get("/validate-email/{email}")
async def validate_email_domain(email: EmailStr):
    """
    Check if an email domain is allowed for registration.

    This is used for real-time validation in the frontend.
    """
    auth0_service = get_auth0_service()

    is_valid = auth0_service.is_educational_email(email)

    return {
        "email": email,
        "is_valid": is_valid,
        "message": (
            "Email valide"
            if is_valid
            else "Seuls les emails des domaines éducatifs français sont acceptés"
        ),
    }


class PasswordValidationRequest(BaseModel):
    """Request model for password validation"""

    password: str = Field(..., min_length=1, description="Password to validate")


@router.post("/validate-password")
async def validate_password(request: PasswordValidationRequest):
    """
    Validate password strength.

    This is used for real-time validation in the frontend.
    """
    auth0_service = get_auth0_service()

    is_valid, error_message = auth0_service.validate_password_strength(request.password)

    # Calculate password strength score
    score = 0
    if len(request.password) >= 8:
        score += 1
    if len(request.password) >= 12:
        score += 1
    if any(c.isupper() for c in request.password):
        score += 1
    if any(c.islower() for c in request.password):
        score += 1
    if any(c.isdigit() for c in request.password):
        score += 1
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in request.password):
        score += 1

    strength = "weak"
    if score >= 5:
        strength = "strong"
    elif score >= 3:
        strength = "medium"

    return {
        "is_valid": is_valid,
        "strength": strength,
        "score": score,
        "message": error_message if not is_valid else "Mot de passe valide",
    }
