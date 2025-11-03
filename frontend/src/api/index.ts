// frontend/src/api/index.ts (完整最终版)

import axios from 'axios';

// 创建一个axios实例，方便统一配置
const apiClient = axios.create({
  baseURL: '/api/v1', // 你的API基础路径
  headers: {
    'Content-Type': 'application/json',
  }
});

// 1. 获取任务状态 (保持不变)
export const getTaskStatus = (taskId: string) => {
  return apiClient.get(`/task/${taskId}`);
};

// 2. [最终优化] 发送修改意见
//    为 payload 添加了必需的 'type' 字段
export const sendModificationRequest = (
  taskId: string, 
  payload: { 
    original_content: string; 
    modification_suggestion: string;
    type: string; // 后端需要此字段来确定使用哪个修改工作流
  }
) => {
  return apiClient.post(`/workflow/modify`, {
    task_id: taskId,
    ...payload
  });
};

// 3. 生成文件 (保持不变)
export const generateFile = (
  taskId: string,
  payload: { content: string; format: 'word' | 'pdf'; doc_type?: string; }
) => {
  return apiClient.post(`/file/generate`, {
    task_id: taskId,
    ...payload
  });
};

// 4. 启动工作流的函数 (保持不变)
export const startWorkflow = (formData: FormData) => {
    return axios.post('/api/v1/workflow/start', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// 5. 原始的 sendChatMessage 函数 (如果您的 ChatWindow.tsx 直接调用它，则保留)
//    在当前的 ResultPage 逻辑中，它已被 sendModificationRequest 替代
export const sendChatMessage = (taskId: string, message: string) => {
    return apiClient.post(`/chat`, { task_id: taskId, message });
};