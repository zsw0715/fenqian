import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.store.database import Base


def gen_uuid():
    return uuid.uuid4().hex


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[str] = mapped_column(CHAR(32), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(CHAR(32), ForeignKey("users.id"), nullable=False)
    original_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    splits: Mapped[list["BillSplit"]] = relationship(back_populates="bill", cascade="all, delete-orphan")


class BillSplit(Base):
    __tablename__ = "bill_splits"

    id: Mapped[str] = mapped_column(CHAR(32), primary_key=True, default=gen_uuid)
    bill_id: Mapped[str] = mapped_column(CHAR(32), ForeignKey("bills.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(CHAR(32), ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    bill: Mapped["Bill"] = relationship(back_populates="splits")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])


from server.store.schema.user import User  # noqa: E402
