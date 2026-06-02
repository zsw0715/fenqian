from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from server.api.auth.dependencies import get_current_user
from server.api.schema.billing import (
    BillAddRequest,
    BillEditRequest,
    BillResponse,
    PushCouponRequest,
    RecentBillingItem,
    RecentBillingResponse,
)
from server.store.database import get_db
from server.store.schema.bill import Bill
from server.store.schema.user import User

router = APIRouter(prefix="/api/billing", tags=["账单"])


def _bill_response(bill: Bill) -> BillResponse:
    return BillResponse(
        id=bill.id,
        user_id=bill.user_id,
        original_amount=bill.original_amount,
        discount_amount=bill.discount_amount,
        already_paid=bill.already_paid,
        dining_type=bill.dining_type,
        created_at=str(bill.created_at),
        updated_at=str(bill.updated_at),
    )


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
        already_paid=body.already_paid,
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return _bill_response(bill)


@router.get("/recent", response_model=RecentBillingResponse)
async def recent_billings(
    page: int = 0,
    page_size: int = 10,
    date: str = "",
    dining_type: str = "",
    sort_by: str = "created_at_desc",
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
        month, day = map(int, date.split("."))
        target = datetime.now().replace(month=month, day=day).strftime("%Y-%m-%d")
        conditions.append(func.date(Bill.created_at) == target)

    if dining_type:
        conditions.append(Bill.dining_type == dining_type)

    if sort_by == "name_asc":
        order = User.username.asc()
    else:
        order = Bill.created_at.desc()

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
            Bill.discount_amount,
            Bill.already_paid,
            Bill.created_at,
        )
        .join(User, Bill.user_id == User.id)
        .where(*conditions)
        .order_by(order)
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
                discount_amount=r[4],
                already_paid=r[5],
                created_at=r[6].strftime("%Y-%m-%d %H:%M:%S"),
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
    return [_bill_response(b) for b in bills]


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


@router.get("/export_all")
async def export_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.user_identity != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可操作")

    result = await db.execute(
        select(
            Bill.id,
            User.username.label("student_name"),
            Bill.dining_type,
            Bill.original_amount,
            Bill.discount_amount,
            Bill.already_paid,
            Bill.created_at,
        )
        .join(User, Bill.user_id == User.id)
        .where(User.user_identity == "student")
        .order_by(Bill.created_at)
    )
    rows = result.all()
    return {
        "items": [
            {
                "id": r[0],
                "student_name": r[1],
                "dining_type": r[2],
                "original_amount": r[3],
                "discount_amount": r[4],
                "already_paid": r[5],
                "created_at": r[6].strftime("%Y-%m-%d %H:%M:%S"),
            }
            for r in rows
        ]
    }


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
    bill.already_paid = body.already_paid
    await db.commit()
    await db.refresh(bill)

    return _bill_response(bill)


@router.post("/push_coupon")
async def push_coupon(
    body: PushCouponRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )

    month, day = map(int, body.date.split("."))
    target = datetime.now().replace(month=month, day=day).strftime("%Y-%m-%d")

    result = await db.execute(
        select(Bill)
        .join(User, Bill.user_id == User.id)
        .where(
            User.user_identity == "student",
            func.date(Bill.created_at) == target,
            Bill.dining_type == body.dining_type,
        )
    )
    bills = result.scalars().all()

    if not bills:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当天该餐次暂无账单",
        )

    eater_count = len(bills)
    total = sum(b.original_amount for b in bills)

    if total <= 40:
        for b in bills:
            b.discount_amount = round(b.original_amount * 0.4, 2)
        total_discount = sum(b.discount_amount for b in bills)
        await db.commit()
        return {
            "detail": "发放成功",
            "eater_count": eater_count,
            "per_person_discount": round(total_discount, 2),
            "dining_type": body.dining_type,
            "mode": "six_discount",
        }

    pool = 16.0
    active = list(bills)
    for b in bills:
        b.discount_amount = 0.0

    while True:
        per = pool / len(active)
        capped = [b for b in active if b.original_amount <= per]
        if not capped:
            for b in active:
                b.discount_amount = round(b.discount_amount + per, 2)
            break
        for b in capped:
            b.discount_amount = round(b.original_amount, 2)
            pool -= b.original_amount
        active = [b for b in active if b not in capped]

    await db.commit()

    return {
        "detail": "发放成功",
        "eater_count": eater_count,
        "per_person_discount": round(16 / eater_count, 2),
        "dining_type": body.dining_type,
        "mode": "split",
    }
