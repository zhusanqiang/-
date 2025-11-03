FROM python:3.10-slim

# 系统依赖安装保持不变
RUN set -eux; \
    if [ -f "/etc/apt/sources.list" ]; then \
        sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list; \
        sed -i 's|security.debian.org|mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list; \
    else \
        sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources; \
        sed -i 's|security.debian.org|mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update -y; \
    apt-get install -y --no-install-recommends \
        pandoc \
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        libfontconfig1 \
        libcairo2 \
        libgdk-pixbuf-2.0-0; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# =================================================================
# <<< 这是最关键的修复 >>>
# 1. 将本地的 app 目录，整体复制为容器内的 /app/backend_app 目录，形成一个可导入的包
# 2. 将本地的 templates 目录，也复制到 backend_app 包的内部
# 3. 将本地的 fonts 目录，同样复制到 backend_app 包的内部
# =================================================================
COPY ./app /app/backend_app
COPY ./templates /app/backend_app/templates
COPY ./fonts /app/backend_app/fonts

RUN mkdir -p /app/storage/uploads /app/storage/generated
EXPOSE 8000

# 这个 CMD 会被 docker-compose 覆盖，但保持正确是一种好习惯
CMD ["uvicorn", "backend_app.main:app", "--host", "0.0.0.0", "--port", "8000"]