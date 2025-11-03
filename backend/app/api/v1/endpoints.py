# backend/app/api/v1/endpoints.py (Final, Unified Chatflow Version)

import os
import aiofiles
import uuid
import logging
from typing import List, Optional, Tuple
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from app.services.dify_client import DifyClient
from .schemas import StartWorkflowResponse, TaskStatusResponse, GenerateFileResponse, ChatRequest
from app.services.task_manager import task_manager
from app.services.file_service import file_service
from app.core.config import settings, get_app_key, get_modify_app_key 

logger = logging.getLogger(__name__)
router = APIRouter()
user_id = "legal-doc-assistant-user"

class GenerateFileRequestWithDocType(BaseModel):
    content: str; format: str; doc_type: Optional[str] = None

class WorkflowModifyRequest(BaseModel):
    task_id: str; original_content: str; modification_suggestion: str; type: str

def _run_chat_workflow_task(
    task_id: str, app_key: str, dify_inputs: dict, query: str, user_id: str,
    saved_files: List[Tuple[str, str]], file_variable_name: str
):
    """
    The one and only background task runner, now exclusively for Chatflows.
    """
    dify_client = DifyClient(api_key=app_key, base_url=settings.DIFY_API_URL)
    try:
        task_manager.update_task(task_id, {"status": "processing", "result": ""})
        
        if saved_files:
            uploaded_files_list = []
            for file_path, original_filename in saved_files:
                file_id = dify_client.upload_file(file_path, original_filename, user_id)
                uploaded_files_list.append({"type": "document", "transfer_method": "local_file", "upload_file_id": file_id})
            if uploaded_files_list:
                dify_inputs[file_variable_name] = uploaded_files_list
        
        full_result = ""
        for text_chunk in dify_client.stream_chat_workflow(inputs=dify_inputs, query=query, user_id=user_id):
            full_result += text_chunk
            task_manager.update_task(task_id, {"result": full_result})
            
        task_manager.update_task(task_id, {"status": "completed"})
        logger.info(f"Chatflow background task successfully completed for task_id: {task_id}")

    except Exception as e:
        logger.error(f"Chatflow background task failed for task_id: {task_id}", exc_info=True)
        task_manager.update_task(task_id, {"status": "failed", "result": f"工作流执行失败: {str(e)}"})

@router.post("/workflow/start", response_model=StartWorkflowResponse, summary="Start a new document generation workflow")
async def start_workflow(background_tasks: BackgroundTasks, files: List[UploadFile] = File([]), demand_categories: str = Form(...), description: str = Form(...), type: str = Form(...)):
    task_id = task_manager.create_task()
    main_doc_type = demand_categories.split(' - ')[0]
    task_manager.update_task(task_id, {"doc_type": main_doc_type})
    
    app_key = get_app_key(type)
    if not app_key: raise HTTPException(status_code=400, detail=f"未找到类型 '{type}' 对应的 App Key")
    
    dify_inputs = {}
    query = description # For all Chatflows, the main text input is the query
    
    # Determine the correct variable name for file uploads based on type
    file_variable_name = "contract_related_materials"
    if type == 'letter':
        file_variable_name = "related_materials"
        # For letter chatflow, pass 'demand' in inputs if needed, otherwise it's just query
        dify_inputs["demand"] = description
    else: # single, complex
        dify_inputs["demand_categories"] = demand_categories
    
    saved_files = []
    if files:
        upload_dir = settings.UPLOAD_DIR; os.makedirs(upload_dir, exist_ok=True)
        for file in files:
            if not file.filename: continue
            safe_filename = f"{uuid.uuid4()}_{os.path.basename(file.filename)}"
            file_path = os.path.join(upload_dir, safe_filename)
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read(); await out_file.write(content)
            saved_files.append((file_path, file.filename))

    background_tasks.add_task(_run_chat_workflow_task, task_id, app_key, dify_inputs, query, user_id, saved_files, file_variable_name)
    return StartWorkflowResponse(task_id=task_id)

@router.post("/workflow/modify", status_code=202, summary="Start a document modification workflow")
async def modify_workflow(request: WorkflowModifyRequest, background_tasks: BackgroundTasks):
    if not task_manager.get_task(request.task_id): raise HTTPException(status_code=404, detail="任务未找到")
    
    api_key = get_modify_app_key(request.type)
    if not api_key: raise HTTPException(status_code=400, detail=f"未找到类型 '{request.type}' 对应的修改工作流 App Key")

    # [Crucial Fix] Map modification request to Chatflow structure
    # The user's suggestion becomes the main 'query'
    # The original content goes into the 'inputs' dictionary
    query = request.modification_suggestion
    dify_inputs = {"original_content": request.original_content}
    
    # All modification workflows are now Chatflows and don't involve file uploads
    background_tasks.add_task(_run_chat_workflow_task, request.task_id, api_key, dify_inputs, query, user_id, [], "")
    return {"message": "修改请求已接收"}

# --- (Other endpoints remain unchanged) ---
@router.get("/task/{task_id}", response_model=TaskStatusResponse, summary="Get the status of a workflow task")
async def get_task_status(task_id: str):
    task = task_manager.get_task(task_id);
    if not task: raise HTTPException(status_code=404, detail="任务未找到")
    return TaskStatusResponse(**task)

@router.post("/file/generate", response_model=GenerateFileResponse, summary="Generate a DOCX or PDF file from content")
async def generate_file(request: GenerateFileRequestWithDocType):
    if request.format not in ["word", "pdf"]: raise HTTPException(status_code=400, detail="Invalid file format")
    try:
        if request.format == "word":
            if not request.doc_type: raise HTTPException(status_code=400, detail="doc_type is required for Word generation")
            filename = file_service.generate_docx(request.content, request.doc_type)
        else: filename = file_service.generate_pdf(request.content)
        download_url = f"/api/v1/file/download/{filename}"
        return GenerateFileResponse(download_url=download_url)
    except FileNotFoundError as e:
        logger.error(f"Template file not found during file generation: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"File generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File generation failed: {str(e)}")

@router.get("/file/download/{filename}", summary="Download a generated file")
async def download_file(filename: str):
    file_path = os.path.join(settings.GENERATED_DIR, filename)
    if not os.path.isfile(file_path): raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type='application/octet-stream', filename=filename)

@router.post("/chat", summary="Continue conversation in a workflow (not implemented)")
async def chat_interaction(request: ChatRequest, background_tasks: BackgroundTasks):
    raise HTTPException(status_code=501, detail="This feature is not currently implemented")