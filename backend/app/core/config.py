# backend/app/core/config.py (Final Corrected Version)

import os
from pydantic_settings import BaseSettings
from typing import Optional

# 正确计算项目的根目录 (在容器内是 /app)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    # Dify API Keys
    DIFY_API_URL: str
    DIFY_APP_KEY_SINGLE: str
    DIFY_APP_KEY_COMPLEX: str
    DIFY_APP_KEY_LETTER: str
    DIFY_APP_KEY_MODIFY_SINGLE: str
    DIFY_APP_KEY_MODIFY_COMPLEX: str
    DIFY_APP_KEY_MODIFY_LETTER: str

    # =================================================================
    # <<< 核心修复点 >>>
    # 补上 Redis 相关的配置项定义
    # =================================================================
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB: int

    # Directory Paths
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "storage/uploads")
    GENERATED_DIR: str = os.path.join(BASE_DIR, "storage/generated")
    TEMPLATES_DIR: str = os.path.join(BASE_DIR, "templates")
    FONTS_DIR: str = os.path.join(BASE_DIR, "fonts")
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()

# --- Helper functions to get API keys ---

_app_keys = {
    "single": settings.DIFY_APP_KEY_SINGLE,
    "complex": settings.DIFY_APP_KEY_COMPLEX,
    "letter": settings.DIFY_APP_KEY_LETTER,
}

_modify_app_keys = {
    "single": settings.DIFY_APP_KEY_MODIFY_SINGLE,
    "complex": settings.DIFY_APP_KEY_MODIFY_COMPLEX,
    "letter": settings.DIFY_APP_KEY_MODIFY_LETTER,
}

def get_app_key(type: str) -> Optional[str]:
    return _app_keys.get(type)

def get_modify_app_key(type: str) -> Optional[str]:
    return _modify_app_keys.get(type)