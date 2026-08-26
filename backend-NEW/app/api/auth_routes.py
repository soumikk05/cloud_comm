from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import create_access_token
from app.config import AUTH_USERS

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class TokenRequest(BaseModel):
    username: str
    password: str
    role: str

@router.post("/token")
def token(request: TokenRequest):
    if request.role not in {"officer", "supervisor", "admin", "auditor"} or AUTH_USERS.get(request.username) != request.password:
        raise HTTPException(401, "Invalid credentials or role")
    return {"access_token": create_access_token(request.username, request.role), "token_type": "bearer", "role": request.role}
