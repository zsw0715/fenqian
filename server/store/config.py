from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+asyncmy://root:root@127.0.0.1:3306/fenqian"
    database_echo: bool = False

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
