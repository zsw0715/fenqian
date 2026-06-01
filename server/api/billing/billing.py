from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from server.api.auth.dependencies import get_current_user
from server.api.schema.billing import BillAddRequest, BillEditRequest, BillResponse, RecentBillingItem, RecentBillingResponse
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
        dining_type=body.dining_type,
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)

    return BillResponse(
        id=bill.id,
        user_id=bill.user_id,
        original_amount=bill.original_amount,
        dining_type=bill.dining_type,
        created_at=str(bill.created_at),
        updated_at=str(bill.updated_at),
    )


@router.get("/recent", response_model=RecentBillingResponse)
async def recent_billings(
    page: int = 0,
    page_size: int = 10,
    date: str = "",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可查看",
        )

    conditions = [User.user_identity == "student"]

    if date:
        from datetime import datetime
        month, day = map(int, date.split("."))
        target = datetime.now().replace(month=month, day=day).strftime("%Y-%m-%d")
        conditions.append(func.date(Bill.created_at) == target)

    base = (
        select(Bill)
        .join(User, Bill.user_id == User.id)
        .where(*conditions)
    )

    total_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = total_result.scalar()

    result = await db.execute(
        select(
            Bill.id,
            User.username.label("student_name"),
            Bill.dining_type,
            Bill.original_amount,
            Bill.created_at,
        )
        .join(User, Bill.user_id == User.id)
        .where(*conditions)
        .order_by(desc(Bill.created_at))
        .offset(page * page_size)
        .limit(page_size)
    )
    rows = result.all()
    return RecentBillingResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            RecentBillingItem(
                id=r[0],
                student_name=r[1],
                dining_type=r[2],
                original_amount=r[3],
                created_at=r[4].strftime("%Y-%m-%d %H:%M:%S"),
            )
            for r in rows
        ],
    )


@router.get("/list_by_username", response_model=list[BillResponse])
async def list_bills(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Bill)
        .where(Bill.user_id == current_user.id)
        .order_by(desc(Bill.created_at))
    )
    bills = result.scalars().all()
    return [
        BillResponse(
            id=b.id,
            user_id=b.user_id,
            dining_type=b.dining_type,
            original_amount=b.original_amount,
            created_at=str(b.created_at),
            updated_at=str(b.updated_at),
        )
        for b in bills
    ]


@router.get("/dates")
async def bill_dates(
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.date(Bill.created_at).label("date"))
        .distinct()
        .order_by(func.date(Bill.created_at).desc())
    )
    dates = [row[0] for row in result.all()]
    return [
        {"value": d.strftime("%m.%d"), "label": f"{d.month}月{d.day}日"}
        for d in dates
    ]


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
    bill.dining_type = body.dining_type
    await db.commit()
    await db.refresh(bill)

    return BillResponse(
        id=bill.id,
        user_id=bill.user_id,
        original_amount=bill.original_amount,
        dining_type=bill.dining_type,
        created_at=str(bill.created_at),
        updated_at=str(bill.updated_at),
    )
