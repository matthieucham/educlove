"""
Debug script to test search criteria retrieval
"""

from database.mongo_database import MongoDatabase
from datetime import datetime, timezone, timedelta

# Initialize database
db = MongoDatabase()
db.connect()

# Test user email
test_email = "marie.dupont@educnat.gouv.fr"

# First, let's check if the user exists in the database
print(f"\n1. Checking if user exists with email: {test_email}")
users = list(db.db.users.find({"email": test_email}))
print(f"Found {len(users)} users with this email")
for user in users:
    print(f"  - User ID: {user['_id']}")
    print(f"  - Sub: {user.get('sub')}")
    print(f"  - Email: {user.get('email')}")
    print(f"  - Name: {user.get('name')}")

# Check what's in the search_criteria collection
print(f"\n2. Checking search_criteria collection:")
all_criteria = list(db.db.search_criteria.find())
print(f"Found {len(all_criteria)} search criteria documents")
for criteria in all_criteria:
    print(f"  - Criteria ID: {criteria['_id']}")
    print(f"  - User ID: {criteria.get('user_id')}")
    print(f"  - Gender: {criteria.get('gender')}")
    print(f"  - Updated at: {criteria.get('updated_at')}")

# Now let's simulate what happens in the API endpoint
if users:
    user = users[0]
    user_sub = user.get("sub")

    print(f"\n3. Testing get_user_by_sub with sub: {user_sub}")
    found_user = db.get_user_by_sub(user_sub)
    if found_user:
        print(f"  - Found user: {found_user['_id']}")

        print(f"\n4. Testing get_search_criteria with user_id: {found_user['_id']}")
        criteria = db.get_search_criteria(found_user["_id"])
        if criteria:
            print(f"  - Found criteria: {criteria}")
        else:
            print(f"  - No criteria found for user_id: {found_user['_id']}")
    else:
        print(f"  - User not found by sub: {user_sub}")

# Check if there's a mismatch in user_id format
print(f"\n5. Checking for user_id format mismatches:")
for criteria in all_criteria:
    user_id_in_criteria = criteria.get("user_id")
    print(
        f"  - Criteria has user_id: {user_id_in_criteria} (type: {type(user_id_in_criteria)})"
    )

    # Try to find the user with this ID
    if user_id_in_criteria:
        # Check if it's stored as string
        user_by_string = db.db.users.find_one({"_id": user_id_in_criteria})
        if user_by_string:
            print(f"    - Found user with string ID match")

        # Check if it's stored as ObjectId
        try:
            from bson import ObjectId

            user_by_objectid = db.db.users.find_one(
                {"_id": ObjectId(user_id_in_criteria)}
            )
            if user_by_objectid:
                print(f"    - Found user with ObjectId match")
        except:
            pass

db.disconnect()
