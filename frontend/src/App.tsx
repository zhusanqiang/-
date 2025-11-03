// frontend/src/App.tsx (Final Debugging Version - Fixes the build error)

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Upload as AntdUpload, message, Spin, Alert, Tooltip } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
// [调试] 暂时注释掉未使用的 ReactMarkdown，以通过生产构建
// import ReactMarkdown from 'react-markdown'; 
import {
  InboxOutlined, FileTextOutlined, MailOutlined, AuditOutlined, FileOutlined,
  ApartmentOutlined, WechatOutlined, MailTwoTone, BookOutlined
} from '@ant-design/icons';

const { TextArea } = Input;

// --- Prop Types ---
interface SelectDocumentTypeProps { onSelectionChange: (main: string | null, sub: string | null) => void; }
interface DemandDescriptionProps { onDemandChange: (demand: string) => void; }
interface UploadFilesProps { onFileListChange: (files: UploadFile[]) => void; fileList: UploadFile[]; }
interface ResultViewProps {
  taskId: string;
  docSelection: { main: string | null; sub: string | null };
  onBack: () => void;
}

// --- SelectDocumentType Component (No Changes Needed) ---
const SelectDocumentType: React.FC<SelectDocumentTypeProps> = ({ onSelectionChange }) => {
    const [selectedMain, setSelectedMain] = useState<string | null>(null);
    const [selectedSub, setSelectedSub] = useState<string | null>(null);

    const handleMainClick = (key: string) => {
        const newMain = key === selectedMain ? null : key;
        setSelectedMain(newMain);
        setSelectedSub(null);
        const finalSub = (newMain === '函件类' || newMain === '司法文书类') ? newMain : null;
        onSelectionChange(newMain, finalSub);
    };

    const handleSubClick = (key: string) => {
        const newSub = key === selectedSub ? null : key;
        setSelectedSub(newSub);
        onSelectionChange(selectedMain, newSub);
    };
    
    const buttonStyle: React.CSSProperties = { flex: 1, height: '90px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'background-color 0.3s, color 0.3s' };
    const descriptionStyle: React.CSSProperties = { marginTop: '4px', fontSize: '12px', fontWeight: 'normal', whiteSpace: 'normal' };
    const getDescriptionStyle = (isSelected: boolean): React.CSSProperties => ({ ...descriptionStyle, color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#666' });
    const getButtonStyle = (key: string, type: 'main' | 'sub', color: string): React.CSSProperties => { const isSelected = type === 'main' ? selectedMain === key : selectedSub === key; let baseStyle: React.CSSProperties = { ...buttonStyle }; baseStyle.border = `2px solid ${color}`; baseStyle.color = isSelected ? '#fff' : color; baseStyle.backgroundColor = isSelected ? color : 'transparent'; baseStyle.boxShadow = isSelected ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'; return baseStyle; };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <Button style={getButtonStyle('合同类', 'main', '#40a9ff')} onClick={() => handleMainClick('合同类')}><div><FileTextOutlined /> 合同类<p style={getDescriptionStyle(selectedMain === '合同类')}>由双方或多方签署的<br />具有约束力的法律文件。</p></div></Button>
            <Button style={getButtonStyle('函件类', 'main', '#b7eb8f')} onClick={() => handleMainClick('函件类')}><div><MailOutlined /> 函件类<p style={getDescriptionStyle(selectedMain === '函件类')}>包括各类函件、证明、授权等<br />单方法律文件。</p></div></Button>
            <Button style={getButtonStyle('司法文书类', 'main', '#d3adf7')} onClick={() => handleMainClick('司法文书类')}><div><AuditOutlined /> 司法文书类<p style={getDescriptionStyle(selectedMain === '司法文书类')}>指起诉状、答辩状、<br />仲裁申请书等。</p></div></Button>
        </div>
        {selectedMain === '合同类' && (
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <Button style={getButtonStyle('单一合同', 'sub', '#2db7f5')} onClick={() => handleSubClick('单一合同')}><div><FileOutlined /> 单一合同<p style={getDescriptionStyle(selectedSub === '单一合同')}>能够通过一份合同约定清楚权利义务。</p></div></Button>
              <Button style={getButtonStyle('复杂合同', 'sub', '#ffc53d')} onClick={() => handleSubClick('复杂合同')}><div><ApartmentOutlined /> 复杂合同<p style={getDescriptionStyle(selectedSub === '复杂合同')}>需要一揽子协议确定权利义务。</p></div></Button>
          </div>
        )}
      </div>
    );
};

// --- Other Components (No Changes Needed) ---
const DemandDescription: React.FC<DemandDescriptionProps> = ({ onDemandChange }) => ( <div> <h3>2. 详细需求说明</h3> <TextArea rows={6} placeholder="请输入与法律文书相关的需求..." onChange={(e) => onDemandChange(e.target.value)} autoSize={{ minRows: 6, maxRows: 10 }} /> </div> );
const UploadFiles: React.FC<UploadFilesProps> = ({ onFileListChange, fileList }) => ( <div> <h3>3. 上传相关资料 (可选)</h3> <AntdUpload.Dragger multiple={true} beforeUpload={() => false} onChange={(info) => onFileListChange(info.fileList)} fileList={fileList} accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"> <p className="ant-upload-drag-icon"><InboxOutlined /></p> <p className="ant-upload-text">点击或拖拽文件到此区域</p> <p className="ant-upload-hint">支持 PDF, DOCX, TXT, JPG, PNG (单个文件 &lt; 10MB)</p> </AntdUpload.Dragger> </div> );

// [调试] 暂时注释掉未使用的函数，以通过生产构建
/*
const cleanFinalAIResponse = (rawText: string): string => {
    if (!rawText || rawText === 'None') return '';
    let cleanedText = String(rawText)
        .replace(/<think>[\s\S]*?<\/think>/gs, '')
        .replace(/<think>[\s\S]*$/g, '')
        .replace(/PROCEED\[.*?\]/g, '')
        .replace(/\t/g, '  ')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/(?<!\n)\n(?!\n)/g, '  \n');
    return cleanedText.trim();
};
*/

// --- ResultView Component (The Final, Perfected Version) ---
const ResultView: React.FC<ResultViewProps> = ({ taskId, docSelection, onBack }) => {
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');
    const [formalContent, setFormalContent] = useState('');
    const [modificationSuggestion, setModificationSuggestion] = useState('');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

    const startPolling = () => {
        stopPolling();
        pollTaskStatus();
        intervalRef.current = setInterval(pollTaskStatus, 2000);
    };
      
    useEffect(() => { startPolling(); return () => stopPolling(); }, [taskId]);

    /**
     * [调试修改] 直接显示原始结果，不进行清理
     */
    const pollTaskStatus = async () => {
        try {
            const response = await axios.get(`/api/v1/task/${taskId}`);
            const task = response.data;
            const currentStatus = task.status;
            
            if (currentStatus === 'completed') {
                const rawResult = task.result || "Dify返回了空内容。"; 
                setFormalContent(rawResult);
                setStatus('completed');
                stopPolling(); 
            } else if (currentStatus === 'failed') {
                const rawError = task.result || 'An unknown error occurred.';
                setError(rawError);
                setStatus('failed');
                stopPolling();
            } else {
                setStatus('processing');
            }
        } catch (err: any) { 
            const errorMsg = `获取任务状态失败: ${err.response?.data?.detail || err.message}`;
            setError(errorMsg); 
            stopPolling(); 
            setStatus('failed'); 
        }
    };

    // ... The rest of the ResultView component remains unchanged
    const handleGenerateFile = async (format: 'word' | 'pdf') => {
      if (!formalContent.trim()) { return message.error('请在“正式内容选定框”中输入内容！'); }
      if (format === 'word' && !docSelection.main) { return message.error('无法确定文档类型，无法选择Word模板。'); }
      try {
        message.loading({ content: `正在生成 ${format.toUpperCase()} 文件...`, key: 'gen_file', duration: 15 });
        const payload = { content: formalContent, format: format, doc_type: format === 'word' ? docSelection.main : undefined };
        const response = await axios.post('/api/v1/file/generate', payload);
        const downloadUrl = response.data.download_url;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success({ content: '文件已开始下载！', key: 'gen_file', duration: 3 });
      } catch (err: any) { message.error({ content: `文件生成失败: ${err.response?.data?.detail || err.message}`, key: 'gen_file', duration: 5 }); }
    };

    const handleShare = (platform: 'wechat' | 'feishu' | 'email') => { 
        if (!formalContent.trim()) { return message.error('请在“正式内容选定框”中输入内容！'); } 
        const shareText = `法律文书助手生成文件概要：\n\n"${formalContent.substring(0, 100)}..."`; 
        if (platform === 'email') { 
            window.open(`mailto:?subject=分享法律文书&body=${encodeURIComponent(shareText)}`); 
        } else { 
            navigator.clipboard.writeText(shareText).then(() => { 
                message.success(`内容已复制到剪贴板，可在 ${platform === 'wechat' ? '微信' : '飞书'} 中分享！`); 
            }); 
        } 
    };
    
    const handleSubmitForModification = async () => {
        if (!modificationSuggestion.trim()) { return message.error('请输入修改意见！'); }
        if (!formalContent.trim()) { return message.error('“正式内容选定框”为空。'); }

        const finalSelection = docSelection.sub || docSelection.main;
        let clientType: string | null = null;
        if (finalSelection === '单一合同') { clientType = 'single'; }
        else if (finalSelection === '复杂合同') { clientType = 'complex'; }
        else if (finalSelection === '函件类') { clientType = 'letter'; }
        
        if (!clientType) { return message.error('无法确定当前文书类型，无法提交修改。'); }

        stopPolling(); setStatus('processing'); setError(''); setFormalContent('');
        
        try {
            await axios.post('/api/v1/workflow/modify', {
                task_id: taskId, 
                original_content: formalContent, 
                modification_suggestion: modificationSuggestion,
                type: clientType
            }); 
            startPolling(); 
            setModificationSuggestion(''); 
        } catch (err: any) { 
            const errorMsg = `提交修改请求失败: ${err.response?.data?.detail || err.message}`; 
            setError(errorMsg); 
            setStatus('failed'); 
            message.error(errorMsg); 
        } 
    };
  
    return (
        <div style={{ border: '1px solid #40a9ff', borderRadius: '8px', padding: '20px', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Button onClick={onBack} style={{ alignSelf: 'flex-start' }}>&larr; 返回修改</Button>
          <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <h3>生成结果</h3>
              <div className="markdown-body" style={{ border: '1px solid #e8e8e8', padding: '10px 15px', borderRadius: '4px', minHeight: '300px', backgroundColor: '#f9f9f9', overflowY: 'auto', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {status === 'processing' && (
                  <div style={{ color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Spin size="large" /> 
                    <span>文书生成中，请耐心等待...</span>
                  </div>
                )}
                {status === 'completed' && <pre style={{whiteSpace: 'pre-wrap', width: '100%', fontFamily: 'monospace'}}>{formalContent}</pre>}
                {status === 'failed' && <Alert message="处理失败" description={error} type="error" showIcon />}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3>修改意见</h3>
              <TextArea rows={10} placeholder="请输入修改意见..." value={modificationSuggestion} onChange={(e) => setModificationSuggestion(e.target.value)} style={{ flexGrow: 1 }} disabled={status === 'processing'} />
              <Button type="primary" onClick={handleSubmitForModification} disabled={!modificationSuggestion.trim() || status === 'processing'} loading={status === 'processing'}>提交 AI 修改</Button>
            </div>
          </div>
          <div>
            <h3>正式内容选定框</h3>
            <TextArea rows={10} value={formalContent} onChange={(e) => setFormalContent(e.target.value)} placeholder="在此修改或确认最终内容。" disabled={status !== 'completed'} />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="primary" onClick={() => handleGenerateFile('word')} disabled={status !== 'completed' || !formalContent.trim()}>生成 Word</Button>
                <Button onClick={() => handleGenerateFile('pdf')} disabled={status !== 'completed' || !formalContent.trim()}>生成 PDF</Button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Tooltip title="复制到微信分享"><Button icon={<WechatOutlined />} onClick={() => handleShare('wechat')} disabled={status !== 'completed' || !formalContent.trim()}>微信</Button></Tooltip>
                <Tooltip title="复制到飞书分享"><Button icon={<BookOutlined />} onClick={() => handleShare('feishu')} disabled={status !== 'completed' || !formalContent.trim()}>飞书</Button></Tooltip>
                <Tooltip title="通过Email分享"><Button icon={<MailTwoTone />} onClick={() => handleShare('email')} disabled={status !== 'completed' || !formalContent.trim()}>Email</Button></Tooltip>
              </div>
            </div>
          </div>
        </div>
      );
};
    
// --- App Component (Main Logic - No Changes Needed) ---
const App: React.FC = () => {
    // ... no changes in this part
    const [view, setView] = useState<'form' | 'result'>('form');
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [docSelection, setDocSelection] = useState<{ main: string | null; sub: string | null }>({ main: null, sub: null });
    const [demand, setDemand] = useState<string>('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
  
    const handleGenerateDraft = async () => {
      const finalSelection = docSelection.sub || docSelection.main;
      if (!finalSelection) { return message.error('请选择一个具体的文书场景！'); }
      if (!demand.trim()) { return message.error('请输入需求说明！'); }

      let clientType: string | null = null;
      if (finalSelection === '单一合同') {
          clientType = 'single';
      } else if (finalSelection === '复杂合同') {
          clientType = 'complex';
      } else if (finalSelection === '函件类') {
          clientType = 'letter';
      } else if (finalSelection === '司法文书类') {
          message.info('司法文书类功能正在开发中，敬请期待！');
          return;
      }

      if (!clientType) { return message.error('无法匹配到有效的客户端类型！'); }
      
      setLoading(true); setError('');
      
      const formData = new FormData();
      formData.append('demand_categories', `${docSelection.main}${docSelection.sub && docSelection.sub !== docSelection.main ? ` - ${docSelection.sub}` : ''}`);
      formData.append('description', demand);
      formData.append('type', clientType);
      fileList.forEach(file => { if (file.originFileObj) { formData.append('files', file.originFileObj as Blob, file.name); } });
      
      try {
        const response = await axios.post('/api/v1/workflow/start', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (response.data?.task_id) { setCurrentTaskId(response.data.task_id); setView('result'); } 
        else { setError('未能从后端获取有效任务ID。'); }
      } catch (err: any) { setError(`文书生成失败: ${err.response?.data?.detail || err.message}`); } 
      finally { setLoading(false); }
    };
    
    if (view === 'result' && currentTaskId) {
      return (
        <div className="container" style={{maxWidth: '1200px', margin: '2rem auto'}}>
           <h1 style={{textAlign: 'center'}}>法律文书生成助手</h1>
           <ResultView taskId={currentTaskId} docSelection={docSelection} onBack={() => { setView('form'); setCurrentTaskId(null); }} />
        </div>
      );
    }
  
    return (
      <div className="container" style={{maxWidth: '800px', margin: '2rem auto'}}>
        <h1 style={{textAlign: 'center'}}>法律文书生成助手</h1>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3>1. 选择文书场景</h3>
          <SelectDocumentType onSelectionChange={(main, sub) => setDocSelection({ main, sub })} />
        </div>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <DemandDescription onDemandChange={setDemand} />
        </div>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <UploadFiles onFileListChange={setFileList} fileList={fileList} />
        </div>
        <div style={{ padding: '20px' }}>
          <Button type="primary" style={{ width: '100%', height: '50px', fontSize: '18px' }} onClick={handleGenerateDraft} disabled={loading}>
            {loading ? <Spin /> : '🚀 立即生成文书初稿'}
          </Button>
        </div>
        {error && <Alert message="生成出错" description={error} type="error" showIcon style={{marginTop: '20px'}} />}
      </div>
    );
};
  
export default App;