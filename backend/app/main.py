from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import endpoints
import json
import logging
import sys

# 配置日志系统：让所有日志输出到控制台
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # 输出到标准输出（控制台）
    ]
)

# 获取应用日志记录器
logger = logging.getLogger(__name__)

app = FastAPI(title="Legal Document Generation Assistant API")

# Add a custom exception handler to see detailed validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    This handler will catch all 422 validation errors and print
    the detailed error body to the console for debugging.
    """
    # 使用日志记录器输出
    logger.error("--- DETAILED VALIDATION ERROR ---")
    logger.error(json.dumps(exc.errors(), indent=2, ensure_ascii=False))
    logger.error("--- END OF DETAILED ERROR ---")
    
    # Return the default 422 response to the frontend
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1", tags=["v1"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Legal Document Assistant API"}
