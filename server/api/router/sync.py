"""
Fenqian 同步接口 — 接收 Spring Boot (:8080) 推送的实习生数据。

接口：
  POST   /api/sync/bootstrap      全量同步（启动时）
  POST   /api/sync/intern         单条 upsert（创建/修改时）
  DELETE /api/sync/intern/{name}  按姓名删除（打回时）
"""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from fastapi.exceptions import HTTPException
from fastapi import status

from server.api.auth.security import hash_password
from server.store.database import get_db
from server.store.schema.user import User, gen_uuid
from server.store.schema.bill import Bill

DEFAULT_PASSWORD = "123456"

router = APIRouter(prefix="/api/sync", tags=["同步"])

# ---------- Pydantic schemas ----------

class InternSyncPayload(BaseModel):
    name: str
    gender: str
    oldName: Optional[str] = None


# ---------- helpers ----------

async def _upsert_user(db: AsyncSession, name: str, gender: str):
    """插入或更新学生。已存在则只同步 gender，不存在则新建（默认密码 123456）。"""
    result = await db.execute(select(User).where(User.username == name, User.user_identity == "student"))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=gen_uuid(),
            username=name,
            password_hash=hash_password(DEFAULT_PASSWORD),
            user_identity="student",
            gender=gender,
        )
        db.add(user)
    elif user.gender != gender:
        user.gender = gender

    return user


async def _find_student(db: AsyncSession, name: str) -> Optional[User]:
    result = await db.execute(
        select(User).where(User.username == name, User.user_identity == "student")
    )
    return result.scalar_one_or_none()


async def _has_bills(db: AsyncSession, user_id: str) -> bool:
    result = await db.execute(select(Bill).where(Bill.user_id == user_id).limit(1))
    return result.scalar_one_or_none() is not None


# ---------- endpoints ----------

@router.post("/bootstrap")
async def bootstrap(payloads: list[InternSyncPayload], db: AsyncSession = Depends(get_db)):
    """启动时全量同步：upsert 所有推送的学生，清理不在名单中的孤儿（无账单的才删）。"""
    names_in_payload = set()

    for p in payloads:
        await _upsert_user(db, p.name, p.gender)
        names_in_payload.add(p.name)

    # 删除不在推送名单中的学生（只删没有账单记录的）
    all_students = await db.execute(
        select(User).where(User.user_identity == "student")
    )
    for student in all_students.scalars().all():
        if student.username not in names_in_payload:
            if not await _has_bills(db, student.id):
                await db.execute(delete(Bill).where(Bill.user_id == student.id))
                await db.execute(delete(User).where(User.id == student.id))

    await db.commit()
    return {"status": "ok", "synced": len(payloads)}


@router.post("/intern")
async def sync_intern(payload: InternSyncPayload, db: AsyncSession = Depends(get_db)):
    """单条创建/修改。oldName 非空且不同于 name 时，先更新用户名。"""
    old_name = payload.oldName
    new_name = payload.name

    # 改名：把旧名字的用户名更新为新名字
    if old_name and old_name != new_name:
        old_user = await _find_student(db, old_name)
        if old_user is not None:
            # 检查新名字是否已被其他用户占用
            conflict = await db.execute(
                select(User).where(User.username == new_name, User.id != old_user.id)
            )
            if conflict.scalar_one_or_none() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"用户名 {new_name} 已存在"
                )
            old_user.username = new_name
            old_user.gender = payload.gender
            await db.commit()
            return {"status": "ok", "renamed": f"{old_name} -> {new_name}"}

    # 正常 upsert
    await _upsert_user(db, new_name, payload.gender)
    await db.commit()
    return {"status": "ok", "name": new_name}


@router.delete("/intern/{name}")
async def delete_intern(name: str, db: AsyncSession = Depends(get_db)):
    """按姓名删除学生及其账单。"""
    user = await _find_student(db, name)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"学生 {name} 不存在")

    await db.execute(delete(Bill).where(Bill.user_id == user.id))
    await db.execute(delete(User).where(User.id == user.id))
    await db.commit()

    return {"status": "ok", "deleted": name}
