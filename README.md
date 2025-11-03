# 法律文书生成助手 (Legal Document Generation Assistant)

这是一个全栈Web应用，旨在帮助用户根据上传的资料和选择的场景，自动生成专业的法律文书。

## 技术栈

- **前端:** React, TypeScript, Vite, Ant Design
- **后端:** Python, FastAPI
- **AI引擎:** Dify 工作流
- **数据库/缓存:** Redis
- **部署:** Docker, Docker Compose

## 项目启动指南

### 1. 先决条件

- [Docker](https://www.docker.com/get-started) 和 [Docker Compose](https://docs.docker.com/compose/install/) 已安装在您的本地计算机上。
- [Node.js](https://nodejs.org/) 和 npm/yarn (用于前端开发)。

### 2. 配置

1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd legal_document_assistant
    ```

2.  **创建并配置环境变量文件**
    在项目根目录创建一个名为 `.env` 的文件。复制 `.env.example` (如果提供) 或以下内容，并**填入您自己的 Dify 配置**。

    ```env
    # Dify API Configuration (请替换为您自己的Dify信息)
    DIFY_API_URL=https://api.dify.ai/v1
    DIFY_API_KEY=your_dify_api_key_here
    DIFY_APP_ID=your_dify_app_id_here

    # Redis Configuration
    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_DB=0

    # Frontend Configuration (重要：用于本地开发时)
    VITE_API_BASE_URL=http://localhost:8000/api/v1
    ```

3.  **Dify 工作流配置**
    请确保您的Dify工作流的“开始”节点变量与后端代码的映射一致。
    - 后端 `endpoints.py` 中 `dify_inputs` 字典的键 (`demand_categories`, `reasons`) 必须与Dify工作流开始节点中定义的变量名完全匹配。
    - 上传的文件会作为文件输入传递给工作流。

### 3. 运行应用 (使用Docker Compose)

这是最推荐的运行方式，它会自动构建和启动所有服务。

```bash
docker-compose up --build
```
####  前端应用 将在 http://localhost:8080 上可用
####  后端API 将在 http://localhost:8000 上可用 (您可以在 http://localhost:8000/docs 查看Swagger UI)
