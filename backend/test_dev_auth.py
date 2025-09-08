"""
Test suite for development authentication endpoints.
"""

import pytest


class TestDevAuthentication:
    """Test suite for development authentication endpoints."""

    def test_dev_login(self, client):
        """Test development login endpoint."""
        response = client.post(
            "/auth/dev/login",
            json={"email": "test@example.com", "password": "password123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"

    def test_dev_register(self, client):
        """Test development registration endpoint."""
        import random

        email = f"newuser{random.randint(1000, 9999)}@test.com"

        response = client.post(
            "/auth/dev/register",
            json={"email": email, "password": "password123", "name": "New User"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["name"] == "New User"

    def test_dev_login_with_wrong_password(self, client):
        """Test dev login with wrong password for existing user."""
        import random

        # First register a user
        email = f"testuser{random.randint(1000, 9999)}@test.com"
        client.post(
            "/auth/dev/register",
            json={"email": email, "password": "correctpassword", "name": "Test User"},
        )

        # Try to login with wrong password
        response = client.post(
            "/auth/dev/login", json={"email": email, "password": "wrongpassword"}
        )

        # Should fail
        assert response.status_code == 401

    def test_dev_users_list(self, client):
        """Test listing development users."""
        response = client.get("/auth/dev/users")

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        # Should have at least the pre-populated test users
        assert len(data["users"]) >= 3
