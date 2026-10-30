from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user_model import UserSignupRequest, UserLoginRequest
from datetime import datetime
import uuid

from services.database import get_collection
from utils.jwt_handler import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter()
security = HTTPBearer()



# --- Dependencies ---

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to retrieve the logged-in user's details from the JWT token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Optional: fetch full user details from database
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": payload.get("email")})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    
    # Return user dict without password
    if "password" in user:
        del user["password"]
    if "_id" in user:
        user["_id"] = str(user["_id"])
    return user

# --- Auth Routes ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignupRequest):
    users_collection = get_collection("users")
    
    # Check if user email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password and prepare user document
    hashed_pwd = hash_password(user_data.password)
    user_doc = {
        "user_id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password": hashed_pwd,
        "role": user_data.role,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await users_collection.insert_one(user_doc)
    
    # Remove password for response
    del user_doc["password"]
    if "_id" in user_doc:
        user_doc["_id"] = str(user_doc["_id"])
        
    return {
        "success": True,
        "message": "User registered successfully!",
        "user": user_doc
    }

@router.post("/login")
async def login(credentials: UserLoginRequest):
    users_collection = get_collection("users")
    
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Verify hashed password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Generate JWT token
    token_data = {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user
    }
