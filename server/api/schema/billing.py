from pydantic import BaseModel


class BillAddRequest(BaseModel):
    original_amount: float


class BillEditRequest(BaseModel):
    original_amount: float


class BillResponse(BaseModel):
    id: str
    user_id: str
    original_amount: float
    created_at: str
    updated_at: str
