from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.api.auth.dependencies import get_current_user
from server.api.schema.billing import BillAddRequest, BillEditRequest, BillResponse
from server.store.database import get_db
from server.store.schema.bill import Bill
from server.store.schema.user import User

router = APIRouter(prefix="/api/billing", tags=["账单"])


@router.post("/add", response_model=BillResponse)
async def add_bill(
    body: BillAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bill = Bill(
        user_id=current_user.id,
        original_amount=body.original_amount,
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)

    return BillResponse(
        id=bill.id,
        user_id=bill.user_id,
        original_amount=bill.original_amount,
        created_at=str(bill.created_at),
        updated_at=str(bill.updated_at),
    )


@router.delete("/delete")
async def delete_bill(
    bill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if bill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账单不存在",
        )

    if bill.user_id != current_user.id and current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅本人或管理员可删除",
        )

    await db.delete(bill)
    await db.commit()
    return {"detail": "删除成功"}


@router.put("/edit", response_model=BillResponse)
async def edit_bill(
    bill_id: str,
    body: BillEditRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Bill).where(Bill.id == bill_id))
    bill = result.scalar_one_or_none()
    if bill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账单不存在",
        )

    if bill.user_id != current_user.id and current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅本人或管理员可修改",
        )

    bill.original_amount = body.original_amount
    await db.commit()
    await db.refresh(bill)

    return BillResponse(
        id=bill.id,
        user_id=bill.user_id,
        original_amount=bill.original_amount,
        created_at=str(bill.created_at),
        updated_at=str(bill.updated_at),
    )
