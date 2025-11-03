// frontend/src/pages/ResultPage.tsx (完整最终版)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout, message, Row, Col, Card, Typography, Button, Space, Modal, Input, Spin } from 'antd';
import { 
    DownloadOutlined, 
    MailOutlined, 
    WechatOutlined, 
    FilePdfOutlined, 
    FileWordOutlined, 
    CopyOutlined, 
    RobotOutlined,
    MessageOutlined
} from '@ant-design/icons';
// 导入更新后的API函数
import { getTaskStatus, sendModificationRequest, generateFile } from '../api';
import FileDisplay from '../components/FileDisplay';
import ChatWindow from '../components/ChatWindow';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import './ResultPage.css';

const { Content, Header } = Layout;
const { Paragraph } = Typography;
const { TextArea } = Input;

const cleanAndFormatForMarkdown = (rawText: string): string => {
    if (!rawText || rawText === 'None') return "";
    let cleanedText = String(rawText)
        .replace(/<think>[\s\S]*?<\/think>/gs, '')
        .replace(/<think>[\s\S]*$/g, '');
    cleanedText = cleanedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleanedText;
};

const extractFinalContract = (cleanedText: string): string => {
    if (!cleanedText) return "";
    const startMarker = "【审查通过稿】";
    const endMarker = "【主要修改说明】";
    const startIndex = cleanedText.indexOf(startMarker);
    if (startIndex === -1) return cleanedText;
    const endIndex = cleanedText.indexOf(endMarker, startIndex);
    let contractText = (endIndex !== -1)
        ? cleanedText.substring(startIndex + startMarker.length, endIndex)
        : cleanedText.substring(startIndex + startMarker.length);
    return contractText.trim();
};

const ResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const taskId = searchParams.get('task_id');
    const docType = searchParams.get('doc_type'); 

    const [documentContent, setDocumentContent] = useState('');
    const [finalContent, setFinalContent] = useState('');
    const [status, setStatus] = useState('pending');
    const [isLoading, setIsLoading] = useState(true); 
    const [isChatting, setIsChatting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    
    const pollingIntervalRef = useRef<number | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const pollStatus = useCallback(async () => {
        if (!taskId) return;
        try {
            const response = await getTaskStatus(taskId);
            const { status: newStatus, result } = response.data;
            const rawResult = result || ''; 
            
            setStatus(newStatus);
            
            // 后端已确保返回纯净数据流，前端直接处理即可
            const cleanedAndFormattedText = cleanAndFormatForMarkdown(rawResult);
            const contractText = extractFinalContract(cleanedAndFormattedText);

            setDocumentContent(cleanedAndFormattedText);
            if (contractText) setFinalContent(contractText);

            if (rawResult || newStatus === 'completed' || newStatus === 'failed') setIsLoading(false);

            if (newStatus === 'completed' || newStatus === 'failed') {
                stopPolling();
                setIsChatting(false); 
                if (newStatus === 'failed') {
                    message.error(`任务处理失败: ${cleanAndFormatForMarkdown(result) || '未知错误'}`);
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
            message.error('轮询任务状态失败。');
            stopPolling();
            setIsLoading(false);
            setIsChatting(false);
        }
    }, [taskId, stopPolling]);
    
    useEffect(() => {
        if (!taskId) {
            message.error('无效的任务ID，正在返回首页...');
            navigate('/');
            return;
        }
        pollStatus();
        stopPolling(); 
        if (status === 'pending' || status === 'processing') {
            const interval = 2000;
            pollingIntervalRef.current = window.setInterval(pollStatus, interval);
        }
        return () => stopPolling();
    }, [taskId, navigate, status, pollStatus, stopPolling]);

    const handleChatSubmit = async (modificationSuggestion: string) => {
        if (!taskId) return;
        if (!finalContent.trim()) {
            message.error('当前没有可供修改的文稿内容。');
            return;
        }
        // [核心优化] 检查 docType 是否存在，这是后端必需的
        if (!docType) {
            message.error('无法确定当前文档类型，无法提交修改。');
            return;
        }

        setIsChatting(true);
        setIsLoading(true);
        try {
            // [核心优化] 将 docType 一同发送给后端
            await sendModificationRequest(taskId, {
                original_content: finalContent,
                modification_suggestion: modificationSuggestion,
                type: docType // 将从URL获取的文档类型传递过去
            });
            setStatus('processing');
            pollStatus(); // 立即轮询获取新结果
            if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = window.setInterval(pollStatus, 2000);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || '发送修改意见失败。';
            message.error(errorMsg);
            console.error("Send modification error:", error);
            setIsChatting(false);
            setIsLoading(false);
        }
    };
    
    const handleGenerateFile = async (format: 'word' | 'pdf') => {
        if (!finalContent.trim() || !taskId) {
            message.warning("没有可供生成的合同正文内容。");
            return;
        }
        if (format === 'word' && !docType) {
            message.error('无法确定文档类型，无法生成Word文件。');
            return;
        }
        setIsGenerating(true);
        setDownloadUrl('');
        try {
            const response = await generateFile(taskId, {
                content: finalContent,
                format: format,
                doc_type: docType || undefined
            });
            const url = response.data.download_url;
            setDownloadUrl(url); 
            const fullUrl = `${window.location.protocol}//${window.location.host}${url}`;
            Modal.success({
              title: '文件生成成功！',
              content: (
                <div>
                  <p>您的文件已准备就绪，可以下载或分享。</p>
                  <Input readOnly value={fullUrl} addonAfter={<CopyOutlined onClick={() => { navigator.clipboard.writeText(fullUrl); message.success('链接已复制！'); }}/>}/>
                </div>
              ),
              okText: "知道了"
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || '文件生成失败。';
            message.error(errorMsg);
            console.error("Generate file error:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleShare = (platform: 'feishu' | 'wechat') => {
        if (!downloadUrl) {
            message.warning('请先生成文件以获取分享链接。');
            return;
        }
        const fullUrl = `${window.location.protocol}//${window.location.host}${downloadUrl}`;
        navigator.clipboard.writeText(fullUrl);
        message.success(`下载链接已复制，请在${platform === 'feishu' ? '飞书' : '微信'}中粘贴发送。`);
    };

    const handleEmailShare = () => {
        if (!downloadUrl) {
            message.warning('请先生成文件以获取分享链接。');
            return;
        }
        const fullUrl = `${window.location.protocol}//${window.location.host}${downloadUrl}`;
        const subject = "分享法律文书文件";
        const body = `您好，\n\n这是为您生成的法律文书文件，请通过以下链接下载：\n${fullUrl}\n\n祝好！`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (status === 'failed' && isLoading) {
        return (
             <div style={{ textAlign: 'center', paddingTop: '100px', background: 'var(--bg-color)', height: '100vh' }}>
                <Typography.Title level={3}>任务处理失败</Typography.Title>
                <Paragraph>抱歉，AI在处理您的请求时遇到了问题。</Paragraph>
                <Button type="primary" onClick={() => navigate('/')}>返回首页</Button>
            </div>
        );
    }

    return (
        <Layout className="result-layout">
            <Header className="result-header">
                <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                    <RobotOutlined /> <span>法律文书生成助手</span>
                </div>
                <div><Button onClick={() => navigate('/')}>创建新任务</Button></div>
            </Header>
            <Content className="result-content">
                <div className="content-grid">
                    <div className="file-display-pane">
                        {isLoading ? <LoadingPlaceholder /> : <FileDisplay content={documentContent} />}
                    </div>
                    <div className="control-pane">
                        <div className="control-pane-scrollable">
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <ChatWindow isSending={isChatting} onSendMessage={handleChatSubmit} />
                                <Card title="确认与生成文件" size="small">
                                    <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                                        请确认或编辑以下合同正文，然后生成文件。
                                    </Paragraph>
                                    <TextArea 
                                        rows={8} 
                                        value={finalContent} 
                                        onChange={(e) => setFinalContent(e.target.value)} 
                                        placeholder="AI生成的最终文稿将在此处显示，您可直接编辑。"
                                    />
                                    <Spin spinning={isGenerating} tip="文件生成中...">
                                        <Row gutter={16} style={{ marginTop: 16 }}>
                                            <Col span={12}><Button icon={<FileWordOutlined />} block onClick={() => handleGenerateFile('word')}>生成 Word</Button></Col>
                                            <Col span={12}><Button icon={<FilePdfOutlined />} block onClick={() => handleGenerateFile('pdf')}>生成 PDF</Button></Col>
                                        </Row>
                                    </Spin>
                                </Card>
                                <Card title="文件交付" size="small">
                                    <Button type="primary" icon={<DownloadOutlined />} disabled={!downloadUrl} block href={downloadUrl} download>直接下载</Button>
                                    <Paragraph style={{ textAlign: 'center', margin: '16px 0', color: 'var(--text-color-light)' }}>或分享至</Paragraph>
                                    <Row gutter={16}>
                                        <Col span={8}><Button icon={<MessageOutlined />} block onClick={() => handleShare('feishu')}>飞书</Button></Col>
                                        <Col span={8}><Button icon={<WechatOutlined />} block onClick={() => handleShare('wechat')}>微信</Button></Col>
                                        <Col span={8}><Button icon={<MailOutlined />} block onClick={handleEmailShare}>邮件</Button></Col>
                                    </Row>
                                </Card>
                            </Space>
                        </div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default ResultPage;