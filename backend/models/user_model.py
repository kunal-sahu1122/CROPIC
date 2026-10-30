from pydantic import BaseModel, EmailStr, Field
from typing import Literal

class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Full name of the user")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    role: Literal["farmer", "officer"] = Field(..., description="Role of the user: farmer or officer")

class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")
