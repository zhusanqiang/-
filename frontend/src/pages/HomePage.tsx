import React, { useState } from 'react';
import { Upload, Button, Input, Card, Row, Col, message, Typography, Space, Spin, Layout } from 'antd';
import { InboxOutlined, FileTextOutlined, SendOutlined, ReadOutlined, FileProtectOutlined, RobotOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { startWorkflow } from '../api';
import './HomePage.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Header, Content } = Layout;

const HomePage: React.FC = () => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [description, setDescription] = useState('');
    const [selectedScene, setSelectedScene] = useState<string | null>(null);
    const [subScene, setSubScene] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const draggerProps: UploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        beforeUpload: (file) => {
            const isSupported = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'].includes(file.type);
            if (!isSupported) message.error(`${file.name} 文件格式不支持。`);
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) message.error(`${file.name} 文件大小超过10MB。`);
            if (isSupported && isLt10M) setFileList(current => [...current, file]);
            return false;
        },
        onRemove: (file) => {
            setFileList(current => current.filter(item => item.uid !== file.uid));
        },
    };

    // ▼▼▼▼▼ 唯一的修改点就在下面的 handleSubmit 函数中 ▼▼▼▼▼
    const handleSubmit = async () => {
        const finalScene = subScene || selectedScene;
        if (fileList.length === 0 || !description.trim() || !finalScene) {
            message.error('请完成所有必填项。');
            return;
        }
        
        setLoading(true);
        const formData = new FormData();

        // --- 1. 准备文本字段 ---
        formData.append('description', description);
        formData.append('demand_categories', finalScene);
        
        // --- 2. ★★★★★ 核心修改：动态添加 'type' 字段 ★★★★★ ---
        let workflowType = '';
        if (finalScene === 'contract_simple') {
            workflowType = 'single'; // 对应后端的 APP_KEY_SINGLE
        } else if (finalScene === 'contract_complex') {
            workflowType = 'complex'; // 对应后端的 APP_KEY_COMPLEX
        } else if (selectedScene === 'letter') {
            workflowType = 'letter'; // 对应后端的 APP_KEY_LETTER
        } 
        // 以后可以继续扩展
        // else if (selectedScene === 'legal_document') {
        //     workflowType = 'judicial'; 
        // }

        if (!workflowType) {
            message.error('未知的业务场景类型，无法启动任务。');
            setLoading(false);
            return;
        }
        formData.append('type', workflowType); // 将我们计算出的类型添加到表单
        // --- ★★★★★ 修改结束 ★★★★★ ---


        // --- 3. 准备文件字段 ---
        fileList.forEach((file) => {
            const fileToUpload = (file as any).originFileObj || file;
            formData.append('files', fileToUpload);
        });
        
        // --- 4. 打印日志并发送请求 ---
        console.log("最终构造的 FormData 内容如下:");
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
        }

        try {
            const response = await startWorkflow(formData);
            message.success('任务已成功启动！正在为您生成初稿...');
            // 注意：您的路由逻辑似乎是 /result?task_id=...
            // 请确保您的路由配置支持这种 query parameter 的形式
            const finalScene = subScene || selectedScene;
            navigate(`/result?task_id=${response.data.task_id}&doc_type=${finalScene}`);
        } catch (error) {
            message.error('任务启动失败，请检查网络或联系管理员。');
            console.error("API 请求失败:", error);
        } finally {
            setLoading(false);
        }
    };
    // ▲▲▲▲▲ 唯一的修改点就在上面的 handleSubmit 函数中 ▲▲▲▲▲

    return (
        <Layout className="home-layout">
            <Header className="home-header">
                <div className="logo">
                    <RobotOutlined />
                    <span>法律文书生成助手</span>
                </div>
            </Header>
            <Content className="home-content">
                <Spin spinning={loading} tip="正在提交任务..." size="large">
                    <Card className="form-card" bordered={false}>
                        <div className="form-header">
                            <Title level={2}>智能生成，专业可靠</Title>
                            <Paragraph type="secondary">上传资料，选择场景，AI 将为您智能生成专业文书初稿</Paragraph>
                        </div>

                        <div className="form-section">
                            <Title level={5} className="section-title">1. 上传资料并说明需求</Title>
                            <Dragger {...draggerProps} className="upload-dragger">
                                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                <p className="ant-upload-text">点击或拖拽文件到此区域</p>
                                <p className="ant-upload-hint">支持PDF, DOCX, TXT, JPG, PNG格式</p>
                            </Dragger>
                            <TextArea rows={4} placeholder="请在此处详细说明您的需求..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: 16 }}/>
                        </div>

                        <div className="form-section">
                            <Title level={5} className="section-title">2. 选择业务场景</Title>
                            <Row gutter={[16, 16]}>
                                {/* 为了与后端逻辑匹配，我们将 onClick 中的值修改得更明确 */}
                                <Col xs={24} sm={8}><Card hoverable className={`scene-card ${selectedScene === 'contract' ? 'selected' : ''}`} onClick={() => { setSelectedScene('contract'); setSubScene(null); }}><FileTextOutlined /><span>合同类</span></Card></Col>
                                <Col xs={24} sm={8}><Card hoverable className={`scene-card ${selectedScene === 'letter' ? 'selected' : ''}`} onClick={() => { setSelectedScene('letter'); setSubScene('letter'); }}><ReadOutlined /><span>函件类</span></Card></Col>
                                <Col xs={24} sm={8}><Card hoverable className={`scene-card ${selectedScene === 'legal_document' ? 'selected' : ''}`} onClick={() => { setSelectedScene('legal_document'); setSubScene('legal_document'); }}><FileProtectOutlined /><span>司法文书类</span></Card></Col>
                            </Row>
                            {selectedScene === 'contract' && (
                                <Card size="small" className="sub-scene-card">
                                    <p>请选择合同类型：</p>
                                    {/* 这里将 onClick 中的值修改为我们后端期望的 'single' 和 'complex' */}
                                    <Space><Button type={subScene === 'single' ? 'primary' : 'default'} onClick={() => setSubScene('single')}>单一合同</Button><Button type={subScene === 'complex' ? 'primary' : 'default'} onClick={() => setSubScene('complex')}>复杂合同</Button></Space>
                                </Card>
                            )}
                        </div>
                        
                        <Button type="primary" icon={<SendOutlined />} size="large" block className="submit-button" onClick={handleSubmit} disabled={!subScene && !selectedScene || fileList.length === 0 || !description.trim()}>开始生成</Button>
                    </Card>
                </Spin>
            </Content>
        </Layout>
    );
};

export default HomePage;