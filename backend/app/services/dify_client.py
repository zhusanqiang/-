# backend/app/services/dify_client.py (Final Perfect Version - Corrected)

import requests
import json
import logging
from typing import Generator, Dict, Any
import mimetypes

logger = logging.getLogger(__name__)

class DifyClient:
    def __init__(self, api_key: str, base_url: str):
        if not api_key or not base_url:
            raise ValueError("Dify API key and base URL are required.")
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.base_headers = { "Authorization": f"Bearer {self.api_key}" }

    def _stream_dify_api(self, url: str, payload: Dict[str, Any]) -> Generator[Dict, None, None]:
        """A private helper method to handle all Dify streaming requests and errors."""
        try:
            with requests.post(url, headers={**self.base_headers, "Content-Type": "application/json"}, json=payload, stream=True, timeout=600) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    decoded_line = line.decode('utf-8')
                    if not decoded_line.startswith('data:'):
                        continue
                    data_str = decoded_line[len('data:'):].strip()
                    if not data_str:
                        continue
                    try:
                        yield json.loads(data_str)
                    except json.JSONDecodeError:
                        logger.warning(f"Could not decode JSON from Dify stream: {data_str}")
        except requests.exceptions.HTTPError as e:
            logger.error(f"Dify API HTTP Error. Status: {e.response.status_code}. Body: {e.response.text}", exc_info=True)
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Dify connection failed: {e}", exc_info=True)
            raise

    def stream_chat_workflow(self, inputs: Dict[str, Any], query: str, user_id: str) -> Generator[str, None, None]:
        """
        The one and only streaming function, specifically for Chatflows (/chat-messages).
        It now correctly handles the 'message' event to prevent content duplication.
        """
        url = f"{self.base_url}/v1/chat-messages"
        payload = { "inputs": inputs, "query": query, "response_mode": "streaming", "user": user_id }
        
        for chunk in self._stream_dify_api(url, payload):
            event = chunk.get("event")
            text_chunk = None

            # =================================================================
            # <<< 核心修复点 >>>
            # 1. 主要从 'message' 事件流中获取文本块。
            # 2. 'workflow_finished' 事件只作为结束信号，不再从中提取内容，以避免重复。
            # =================================================================
            if event == "message":
                text_chunk = chunk.get("answer", "")
            
            # (保留 agent_message_chunk 作为对其他工作流类型的兼容)
            elif event == "agent_message_chunk":
                text_chunk = chunk.get("data", {}).get("answer", "")

            # 只有当 text_chunk 不是 None 时才传递它
            if text_chunk is not None:
                yield str(text_chunk)

            # 当遇到这些结束事件中的任何一个时，就终止循环
            if event in ["agent_message_end", "workflow_finished", "message_end"]:
                break
            elif event == "error":
                raise RuntimeError(f"Dify Chatflow error: {chunk}")

    def upload_file(self, file_path: str, file_name: str, user_id: str) -> str:
        """
        Uploads a file to Dify and returns the file ID.
        (This function is correct and remains unchanged).
        """
        url = f"{self.base_url}/v1/files/upload"
        content_type, _ = mimetypes.guess_type(file_name)
        if content_type is None:
            content_type = 'application/octet-stream'
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (file_name, f, content_type)}
                data = {'user': user_id}
                response = requests.post(url, headers=self.base_headers, data=data, files=files, timeout=60)
                response.raise_for_status()
                response_data = response.json()
                file_id = response_data.get("id")
                if not file_id:
                    raise ValueError("Dify upload API did not return a file ID.")
                return file_id
        except Exception as e:
            logger.error(f"Failed to upload file '{file_name}' to Dify: {e}", exc_info=True)
            raise