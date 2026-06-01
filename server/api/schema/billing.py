from pydantic import BaseModel, Field


class BillAddRequest(BaseModel):
    original_amount: float
    dining_type: str = Field(default="lunch", pattern="^(lunch|dinner)$")


class BillEditRequest(BaseModel):
    original_amount: float
    dining_type: str = Field(default="lunch", pattern="^(lunch|dinner)$")


class BillResponse(BaseModel):
    id: str
    user_id: str
    dining_type: str
    original_amount: float
    created_at: str
    updated_at: str
