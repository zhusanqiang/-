from pydantic import BaseModel
from typing import Optional, List

# ==============================================================================
#  Request Models (Data sent FROM Frontend TO Backend)
# ==============================================================================

class ChatRequest(BaseModel):
    task_id: str
    message: str

class GenerateFileRequest(BaseModel):
    task_id: str
    content: str
    format: str  # "word" or "pdf"


# ==============================================================================
#  Response Models (Data sent FROM Backend TO Frontend)
# ==============================================================================

class StartWorkflowResponse(BaseModel):
    task_id: str

class TaskStatusResponse(BaseModel):
    status: str
    result: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    updated_content: str

class GenerateFileResponse(BaseModel):
    download_url: str
    