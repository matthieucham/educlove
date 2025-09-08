"""
Auth0 service for handling user registration with email/password
and domain restrictions for educational institutions.
"""

import os
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import secrets
import hashlib
import json
from fastapi import HTTPException, status


class Auth0Service:
    """Service for interacting with Auth0 Management API"""

    # List of allowed educational domains in France
    ALLOWED_DOMAINS = [
        # Académies
        "ac-aix-marseille.fr",
        "ac-amiens.fr",
        "ac-besancon.fr",
        "ac-bordeaux.fr",
        "ac-caen.fr",
        "ac-clermont.fr",
        "ac-corse.fr",
        "ac-creteil.fr",
        "ac-dijon.fr",
        "ac-grenoble.fr",
        "ac-guadeloupe.fr",
        "ac-guyane.fr",
        "ac-lille.fr",
        "ac-limoges.fr",
        "ac-lyon.fr",
        "ac-martinique.fr",
        "ac-mayotte.fr",
        "ac-montpellier.fr",
        "ac-nancy-metz.fr",
        "ac-nantes.fr",
        "ac-nice.fr",
        "ac-normandie.fr",
        "ac-orleans-tours.fr",
        "ac-paris.fr",
        "ac-poitiers.fr",
        "ac-reims.fr",
        "ac-rennes.fr",
        "ac-reunion.fr",
        "ac-rouen.fr",
        "ac-strasbourg.fr",
        "ac-toulouse.fr",
        "ac-versailles.fr",
        # Ministry
        "education.gouv.fr",
        "enseignementsup-recherche.gouv.fr",
    ]

    def __init__(self):
        """Initialize Auth0 service with configuration from environment"""
        self.domain = os.getenv("AUTH0_DOMAIN")
        self.client_id = os.getenv("AUTH0_CLIENT_ID")
        self.client_secret = os.getenv("AUTH0_CLIENT_SECRET")
        self.audience = os.getenv("AUTH0_AUDIENCE", f"https://{self.domain}/api/v2/")
        self.connection = os.getenv(
            "AUTH0_CONNECTION", "Username-Password-Authentication"
        )

        # For development mode
        self.skip_auth0 = os.getenv("SKIP_AUTH0", "false").lower() == "true"

        if not self.skip_auth0 and not all(
            [self.domain, self.client_id, self.client_secret]
        ):
            raise ValueError(
                "Auth0 configuration missing. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, "
                "and AUTH0_CLIENT_SECRET environment variables, or set SKIP_AUTH0=true for development."
            )

        self._management_token = None
        self._token_expires_at = None

    def is_educational_email(self, email: str) -> bool:
        """
        Check if email belongs to an allowed educational domain

        Args:
            email: Email address to validate

        Returns:
            True if email domain is in allowed list, False otherwise
        """
        if not email or "@" not in email:
            return False

        domain = email.lower().split("@")[1]
        return domain in self.ALLOWED_DOMAINS

    def get_management_token(self) -> str:
        """
        Get Auth0 Management API token with caching

        Returns:
            Valid management API token
        """
        if self.skip_auth0:
            return "dev-token"

        # Check if we have a valid cached token
        if self._management_token and self._token_expires_at:
            if datetime.now(timezone.utc) < self._token_expires_at:
                return self._management_token

        # Request new token
        token_url = f"https://{self.domain}/oauth/token"
        token_payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "audience": self.audience,
        }

        response = requests.post(token_url, json=token_payload)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get Auth0 management token: {response.text}",
            )

        data = response.json()
        self._management_token = data["access_token"]
        # Cache token for slightly less than its lifetime
        expires_in = data.get("expires_in", 86400) - 300  # 5 minutes buffer
        self._token_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=expires_in
        )

        return self._management_token

    async def create_user(
        self, email: str, password: str, first_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new user in Auth0 with email/password authentication

        Args:
            email: User's email address
            password: User's password
            first_name: User's first name (optional)

        Returns:
            Created user data from Auth0

        Raises:
            HTTPException: If email domain is not allowed or Auth0 request fails
        """
        # Validate email domain
        if not self.is_educational_email(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seuls les emails des domaines éducatifs français sont acceptés (ac-*.fr, education.gouv.fr)",
            )

        # Development mode - return mock user
        if self.skip_auth0:
            return {
                "user_id": f"auth0|dev_{hashlib.md5(email.encode()).hexdigest()[:8]}",
                "email": email,
                "email_verified": False,
                "name": first_name,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "connection": "dev-connection",
                "identities": [
                    {
                        "connection": "dev-connection",
                        "user_id": f"dev_{hashlib.md5(email.encode()).hexdigest()[:8]}",
                        "provider": "auth0",
                        "isSocial": False,
                    }
                ],
            }

        # Create user in Auth0
        management_token = self.get_management_token()
        create_user_url = f"https://{self.domain}/api/v2/users"

        user_data = {
            "email": email,
            "password": password,
            "connection": self.connection,
            "email_verified": False,  # Require email verification
            "verify_email": True,  # Send verification email
            "user_metadata": {
                "first_name": first_name,
                "registration_date": datetime.now(timezone.utc).isoformat(),
            },
            "app_metadata": {"is_educational": True, "domain": email.split("@")[1]},
        }

        if first_name:
            user_data["name"] = first_name

        headers = {
            "Authorization": f"Bearer {management_token}",
            "Content-Type": "application/json",
        }

        response = requests.post(create_user_url, json=user_data, headers=headers)

        if response.status_code == 409:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte avec cet email existe déjà",
            )
        elif response.status_code != 201:
            error_detail = response.json().get(
                "message", "Erreur lors de la création du compte"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail
            )

        return response.json()

    async def send_verification_email(self, user_id: str) -> bool:
        """
        Send or resend email verification to a user

        Args:
            user_id: Auth0 user ID

        Returns:
            True if email was sent successfully
        """
        if self.skip_auth0:
            return True

        management_token = self.get_management_token()
        verification_url = f"https://{self.domain}/api/v2/jobs/verification-email"

        payload = {"user_id": user_id, "client_id": self.client_id}

        headers = {
            "Authorization": f"Bearer {management_token}",
            "Content-Type": "application/json",
        }

        response = requests.post(verification_url, json=payload, headers=headers)

        if response.status_code not in [201, 202]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible d'envoyer l'email de vérification",
            )

        return True

    async def login_with_password(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email and password

        Args:
            email: User's email
            password: User's password

        Returns:
            Authentication tokens and user info
        """
        # Validate email domain
        if not self.is_educational_email(email):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Email non autorisé"
            )

        # Development mode
        if self.skip_auth0:
            return {
                "access_token": f"dev_token_{hashlib.md5(email.encode()).hexdigest()[:16]}",
                "id_token": f"dev_id_token_{hashlib.md5(email.encode()).hexdigest()[:16]}",
                "token_type": "Bearer",
                "expires_in": 86400,
            }

        # Auth0 authentication
        auth_url = f"https://{self.domain}/oauth/token"

        auth_payload = {
            "grant_type": "password",
            "username": email,
            "password": password,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "audience": self.audience,
            "scope": "openid profile email",
        }

        response = requests.post(auth_url, json=auth_payload)

        if response.status_code == 403:
            # Check if it's email verification issue
            error_data = response.json()
            if "email_verified" in error_data.get("error_description", ""):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Veuillez vérifier votre email avant de vous connecter",
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
            )
        elif response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
            )

        return response.json()

    async def reset_password(self, email: str) -> bool:
        """
        Send password reset email to user

        Args:
            email: User's email address

        Returns:
            True if reset email was sent
        """
        if not self.is_educational_email(email):
            # Don't reveal if email exists or not for security
            return True

        if self.skip_auth0:
            return True

        reset_url = f"https://{self.domain}/dbconnections/change_password"

        payload = {
            "client_id": self.client_id,
            "email": email,
            "connection": self.connection,
        }

        response = requests.post(reset_url, json=payload)

        # Always return True to not reveal if email exists
        return True

    def validate_password_strength(self, password: str) -> tuple[bool, str]:
        """
        Validate password meets security requirements

        Args:
            password: Password to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Le mot de passe doit contenir au moins 8 caractères"

        if not any(c.isupper() for c in password):
            return False, "Le mot de passe doit contenir au moins une majuscule"

        if not any(c.islower() for c in password):
            return False, "Le mot de passe doit contenir au moins une minuscule"

        if not any(c.isdigit() for c in password):
            return False, "Le mot de passe doit contenir au moins un chiffre"

        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Le mot de passe doit contenir au moins un caractère spécial"

        return True, ""


# Singleton instance
_auth0_service = None


def get_auth0_service() -> Auth0Service:
    """Get or create Auth0 service singleton"""
    global _auth0_service
    if _auth0_service is None:
        _auth0_service = Auth0Service()
    return _auth0_service
