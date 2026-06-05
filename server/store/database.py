from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from server.store.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    import logging
    import traceback
    log = logging.getLogger("uvicorn.error")

    db_name = settings.database_url.rsplit("/", 1)[-1].split("?")[0]
    base_url = settings.database_url.rsplit("/", 1)[0]

    log.info(f"正在连接数据库: {base_url}, 目标库: {db_name}")

    try:
        log.info("步骤1: 创建 init_engine 并确保数据库存在...")
        init_engine = create_async_engine(base_url, echo=settings.database_echo)
        async with init_engine.begin() as conn:
            await conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` DEFAULT CHARACTER SET utf8mb4"))
        await init_engine.dispose()
        log.info("步骤1 完成")

        log.info("步骤2: 使用 engine 创建表结构...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        log.info("步骤2 完成，数据库初始化成功")
    except Exception as e:
        log.warning(f"数据库连接失败，应用将启动但不含数据库——请检查 MySQL 3306 是否就绪。错误: {e}")
        log.warning(f"详细堆栈: {traceback.format_exc()}")


async def close_db():
    try:
        await engine.dispose()
    except Exception:
        pass
