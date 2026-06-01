from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+asyncmy://root:root@127.0.0.1:3306/fenqian"
    database_echo: bool = False

    secret_key: str = "change-me-in-production"   # 会被 .env 自动覆盖。so 这个不是真正的密钥
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
