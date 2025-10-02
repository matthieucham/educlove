"""
Conversation routes for the EducLove API.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from auth import get_current_user
from models import User
from typing import TYPE_CHECKING, Optional, List, Dict, Any
from pydantic import BaseModel, Field
import logging

if TYPE_CHECKING:
    from database.mongo_database import MongoDatabase

router = APIRouter(prefix="/conversations", tags=["conversations"])
logger = logging.getLogger(__name__)


class SendMessageRequest(BaseModel):
    """Request model for sending a message"""

    message: str = Field(
        ..., min_length=1, max_length=1000, description="Message content to send"
    )


def get_db():
    """Dependency to get database instance."""
    from main import db

    return db


@router.get("/match/{match_id}")
def get_conversation(
    match_id: str,
    limit: Optional[int] = Query(
        None, ge=1, le=200, description="Limit number of messages"
    ),
    skip: Optional[int] = Query(None, ge=0, description="Skip messages for pagination"),
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get conversation messages for a specific match.

    Args:
        match_id: The ID of the match
        limit: Optional limit on number of messages to return
        skip: Optional number of messages to skip (for pagination)
        current_user: The authenticated user
        db: Database connection

    Returns:
        List of messages in the conversation
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view conversations",
        )

    profile_id = user["profile_id"]

    # Verify the user is part of this match
    matches = db.get_matches_for_profile(profile_id)
    match_ids = [m["_id"] for m in matches]

    if match_id not in match_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this conversation",
        )

    # Get the conversation messages
    messages = db.get_conversation(match_id, limit, skip)

    return {"match_id": match_id, "messages": messages, "total": len(messages)}


@router.post("/match/{match_id}/send")
def send_message(
    match_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Send a message in a conversation.

    Args:
        match_id: The ID of the match
        request: The message content
        current_user: The authenticated user
        db: Database connection

    Returns:
        Success status
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to send messages",
        )

    profile_id = user["profile_id"]

    # Get the user's profile to get their name
    profile = db.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Verify the user is part of this match and it's accepted
    matches = db.get_accepted_matches(profile_id)
    match_ids = [m["_id"] for m in matches]

    if match_id not in match_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only send messages in accepted matches",
        )

    # Send the message
    sender_name = profile.get("first_name", "Unknown")
    success = db.send_message(match_id, profile_id, sender_name, request.message)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message",
        )

    return {"success": True, "message": "Message sent successfully"}


@router.get("/match/{match_id}/summary")
def get_conversation_summary(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get a summary of a conversation.

    Args:
        match_id: The ID of the match
        current_user: The authenticated user
        db: Database connection

    Returns:
        Conversation summary including message count and last message
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view conversations",
        )

    profile_id = user["profile_id"]

    # Verify the user is part of this match
    matches = db.get_matches_for_profile(profile_id)
    match_ids = [m["_id"] for m in matches]

    if match_id not in match_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this conversation",
        )

    # Get the conversation summary
    summary = db.get_conversation_summary(match_id)

    return summary


@router.get("/my-conversations")
def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get all conversations for the current user's accepted matches.

    Args:
        current_user: The authenticated user
        db: Database connection

    Returns:
        List of conversation summaries with match information
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view conversations",
        )

    profile_id = user["profile_id"]

    # Get all accepted matches
    matches = db.get_accepted_matches(profile_id)

    # Get conversation summaries for all matches
    match_ids = [m["_id"] for m in matches]
    conversation_summaries = db.get_conversations_for_matches(match_ids)

    # Enrich with match and profile information
    enriched_conversations = []
    for match in matches:
        match_id = match["_id"]

        # Determine which profile to fetch (the other person's profile)
        if match["initiator_profile_id"] == profile_id:
            other_profile_id = match["target_profile_id"]
        else:
            other_profile_id = match["initiator_profile_id"]

        # Get the other person's profile
        other_profile = db.get_profile(other_profile_id)

        if other_profile:
            conversation_summary = conversation_summaries.get(match_id, {})
            enriched_conversation = {
                "match_id": match_id,
                "profile": other_profile,
                "conversation": conversation_summary,
                "created_at": match["created_at"],
                "updated_at": match["updated_at"],
            }
            enriched_conversations.append(enriched_conversation)

    # Sort by last message date (most recent first)
    enriched_conversations.sort(
        key=lambda x: x["conversation"].get("updated_at") or x["created_at"],
        reverse=True,
    )

    return {
        "conversations": enriched_conversations,
        "total": len(enriched_conversations),
    }


@router.get("/match/{match_id}/latest")
def get_latest_messages(
    match_id: str,
    count: int = Query(
        50, ge=1, le=200, description="Number of latest messages to retrieve"
    ),
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get the latest N messages from a conversation.

    Args:
        match_id: The ID of the match
        count: Number of latest messages to retrieve (default: 50)
        current_user: The authenticated user
        db: Database connection

    Returns:
        List of latest messages in chronological order
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view conversations",
        )

    profile_id = user["profile_id"]

    # Verify the user is part of this match
    matches = db.get_matches_for_profile(profile_id)
    match_ids = [m["_id"] for m in matches]

    if match_id not in match_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this conversation",
        )

    # Get the latest messages
    messages = db.conversations_repo.get_latest_messages(match_id, count)

    return {"match_id": match_id, "messages": messages, "count": len(messages)}
