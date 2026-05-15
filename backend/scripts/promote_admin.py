"""Promote a user to admin (is_admin=True).

One-time backfill helper. Connects via the same db.py used by the FastAPI
backend so it reads MONGO_URL / DB_NAME from backend/.env.

Usage:
    # from the backend/ directory:
    python -m scripts.promote_admin                       # promotes default admin
    python -m scripts.promote_admin user@example.com      # promotes a specific email

The startup hook in server.py also runs this same update for the default
admin on every boot, so manual invocation is normally unnecessary after
deploy. Use this script when you need to promote additional accounts.
"""
import asyncio
import sys
from pathlib import Path

# Make the backend/ directory importable when run as `python scripts/promote_admin.py`
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from db import db  # noqa: E402

DEFAULT_ADMIN_EMAIL = "rgoswami@dommma.com"


async def promote(email: str) -> int:
    email_lower = email.lower().strip()
    user = await db.users.find_one(
        {"email": {"$regex": f"^{email_lower}$", "$options": "i"}},
        {"_id": 0, "id": 1, "email": 1, "is_admin": 1},
    )
    if not user:
        print(f"[promote_admin] No user found with email={email_lower}")
        return 1
    if user.get("is_admin"):
        print(f"[promote_admin] {user.get('email')} is already admin. No change.")
        return 0
    result = await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_admin": True}},
    )
    print(
        f"[promote_admin] Promoted {user.get('email')} (id={user['id']}). "
        f"matched={result.matched_count} modified={result.modified_count}"
    )
    return 0


def main() -> int:
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_ADMIN_EMAIL
    return asyncio.run(promote(email))


if __name__ == "__main__":
    sys.exit(main())
