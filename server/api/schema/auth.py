from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_identity: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    user_identity: str = Field(default="student", pattern="^(student|mentor)$")
    gender: str = Field(default="male", pattern="^(male|female)$")


class RegisterResponse(BaseModel):
    id: str
    username: str
    user_identity: str
    gender: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    user_identity: str
    gender: str = Field(default="male", pattern="^(male|female)$")

    model_config = {"from_attributes": True}


class StudentItem(BaseModel):
    id: str
    name: str
    gender: str
    user_identity: str


class UpdateStudentRequest(BaseModel):
    student_id: str
    username: Optional[str] = None
    gender: Optional[str] = Field(default=None, pattern="^(male|female)$")
    password: Optional[str] = None


class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[StudentItem]
