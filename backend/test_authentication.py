"""
Test suite for authentication endpoints and JWT token handling.
"""

import pytest
from conftest import TEST_USER_ID, TEST_EMAIL, TEST_NAME


class TestAuthentication:
    """Test suite for authentication endpoints."""

    def test_auth_me_endpoint_success(self, client, auth_headers, app_with_mock_db):
        """Test successful authentication via /auth/me endpoint."""
        # Configure the mock for this test
        mock_db = app_with_mock_db.mock_db
        mock_db.upsert_user.return_value = TEST_USER_ID
        mock_db.get_user_by_id.return_value = {
            "sub": TEST_USER_ID,
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "provider": "test-provider",
            "profile_id": None,
        }

        # Make request
        response = client.get("/auth/me", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == TEST_USER_ID
        assert data["email"] == TEST_EMAIL
        assert data["name"] == TEST_NAME
        assert data["has_profile"] == False
        assert data["profile_id"] is None

        # Verify database was called
        mock_db.upsert_user.assert_called()
        mock_db.get_user_by_id.assert_called_with(TEST_USER_ID)

    def test_auth_me_without_token(self, client):
        """Test /auth/me endpoint without authentication token."""
        response = client.get("/auth/me")
        assert response.status_code == 403

    def test_auth_me_with_invalid_token(self, client):
        """Test /auth/me endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401

    def test_auth_me_with_profile(self, client, auth_headers, app_with_mock_db):
        """Test /auth/me endpoint when user has a profile."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.upsert_user.return_value = TEST_USER_ID
        mock_db.get_user_by_id.return_value = {
            "sub": TEST_USER_ID,
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "provider": "test-provider",
            "profile_id": "profile-123",
        }

        # Make request
        response = client.get("/auth/me", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["has_profile"] == True
        assert data["profile_id"] == "profile-123"


class TestJWTTokens:
    """Test suite for JWT token handling."""

    def test_token_creation(self):
        """Test JWT token creation."""
        from jose import jwt

        payload = {
            "sub": TEST_USER_ID,
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "iss": "test-provider",
        }

        secret = "test-secret"
        token = jwt.encode(payload, secret, algorithm="HS256")

        # Verify token can be decoded
        decoded = jwt.decode(token, secret, algorithms=["HS256"])

        assert decoded["sub"] == TEST_USER_ID
        assert decoded["email"] == TEST_EMAIL
        assert decoded["name"] == TEST_NAME

    def test_token_with_missing_fields(self):
        """Test token validation with missing required fields."""
        from jose import jwt

        # Token without 'sub' field
        payload = {
            "email": TEST_EMAIL,
            "name": TEST_NAME,
        }

        secret = "test-secret"
        token = jwt.encode(payload, secret, algorithm="HS256")
        decoded = jwt.decode(token, secret, algorithms=["HS256"])

        # Token decodes successfully but 'sub' field is missing
        assert "sub" not in decoded
        assert decoded["email"] == TEST_EMAIL
