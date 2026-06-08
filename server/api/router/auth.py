from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from server.api.auth.dependencies import get_current_user
from server.api.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from server.api.schema.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    StudentItem,
    StudentListResponse,
    UpdateStudentRequest,
    UserResponse,
)
from server.store.database import get_db
from server.store.schema.user import User, gen_uuid
from server.store.schema.bill import Bill

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名已存在",
        )

    user = User(
        id=gen_uuid(),
        username=body.username,
        password_hash=hash_password(body.password),
        user_identity=body.user_identity,
        gender=body.gender,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return RegisterResponse(
        id=user.id,
        username=user.username,
        user_identity=user.user_identity,
        gender=user.gender,
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    token_data = {"sub": user.id, "username": user.username, "user_identity": user.user_identity}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(access_token=access_token, refresh_token=refresh_token, user_identity=user.user_identity)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="refresh token 无效或已过期",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请使用 refresh token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的凭据",
        )

    token_data = {"sub": user_id, "username": payload.get("username"), "user_identity": payload.get("user_identity")}
    access_token = create_access_token(token_data)

    return RefreshResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        user_identity=current_user.user_identity,
        gender=current_user.gender,
    )


@router.get("/list_all_students", response_model=StudentListResponse)
async def list_students(
    page: int = 0,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可查看",
        )

    total_result = await db.execute(
        select(func.count(User.id)).where(User.user_identity == "student")
    )
    total = total_result.scalar()

    result = await db.execute(
        select(User)
        .where(User.user_identity == "student")
        .order_by(User.created_at.desc(), User.id)
        .offset(page * page_size)
        .limit(page_size)
    )
    students = result.scalars().all()

    return StudentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            StudentItem(
                id=s.id,
                name=s.username,
                gender=s.gender,
                user_identity=s.user_identity,
            )
            for s in students
        ],
    )


@router.delete("/delete_student")
async def delete_student(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.user_identity != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )

    student = await db.execute(select(User).where(User.id == student_id, User.user_identity == "student"))
    student = student.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="学生不存在")

    await db.execute(delete(Bill).where(Bill.user_id == student_id))
    await db.execute(delete(User).where(User.id == student_id))
    await db.commit()

    return {"detail": f"已删除学生 {student.username}"}


@router.put("/update_student")
async def update_student(
    body: UpdateStudentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # if current_user.user_identity != "mentor":
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可操作")

    result = await db.execute(select(User).where(User.id == body.student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="学生不存在")

    if body.username:
        existing = await db.execute(select(User).where(User.username == body.username, User.id != body.student_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
        student.username = body.username

    if body.gender:
        student.gender = body.gender

    if body.password:
        student.password_hash = hash_password(body.password)

    await db.commit()
    await db.refresh(student)

    return {"detail": f"已更新学生 {student.username}"}
