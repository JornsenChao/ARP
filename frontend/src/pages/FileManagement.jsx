import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  Button,
  Modal,
  Input,
  message,
  Upload,
  Space,
  Card,
  Select,
  Form,
} from 'antd';
import { UploadOutlined, CloseOutlined } from '@ant-design/icons';
import ColumnMapper from '../components/ColumnMapper';

// === Chat/QA 相关组件 ===
import RenderQA from '../components/RenderQA';
import ChatComponent from '../components/ChatComponent';

const DOMAIN = 'http://localhost:8000';
const LOCALSTORAGE_PREFIX = 'fileChat_conversation_';

// 新增 docType 选项
const DOC_TYPE_OPTIONS = [
  { label: 'Case Study', value: 'caseStudy' },
  { label: 'Strategy', value: 'strategy' },
  { label: 'Other Resource', value: 'otherResource' },
];

function FileManagement() {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // For upload
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadDocType, setUploadDocType] = useState('otherResource'); // default

  // For edit
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editDocType, setEditDocType] = useState('otherResource');

  // For map columns
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapRecord, setMapRecord] = useState(null);
  // columnSchema => [ { columnName, infoCategory, metaCategory }...]
  const [columnSchema, setColumnSchema] = useState([]);
  const [availableCols, setAvailableCols] = useState([]);

  // 当前聊天文件
  const [activeChatFile, setActiveChatFile] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN}/files/list`);
      setFileList(res.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to fetch file list');
    } finally {
      setLoading(false);
    }
  };

  // ------- Upload -------
  const handleUploadFile = async ({ file }) => {
    try {
      const formData = new FormData();
      uploadTags.forEach((tag) => formData.append('tags', tag));
      // 这里我们也传 docType
      formData.append('docType', uploadDocType);
      formData.append('file', file);

      const res = await axios.post(`${DOMAIN}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.fileKey) {
        message.success('File uploaded');
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
      message.error('Upload failed');
    }
  };

  // ------- Delete -------
  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure to delete file: ${record.fileName}?`))
      return;
    try {
      await axios.delete(`${DOMAIN}/files/${record.fileKey}`);
      message.success('File deleted');
      fetchFiles();
      if (activeChatFile === record.fileKey) setActiveChatFile('');
    } catch (err) {
      console.error(err);
      message.error('Delete failed');
    }
  };

  // ------- Edit -------
  const openEditModal = (record) => {
    setEditRecord(record);
    setEditName(record.fileName);
    setEditTags(record.tags || []);
    setEditDocType(record.docType || 'otherResource');
    setEditModalVisible(true);
  };
  const handleEditOk = async () => {
    try {
      await axios.patch(`${DOMAIN}/files/${editRecord.fileKey}`, {
        newName: editName,
        tags: editTags,
        docType: editDocType,
      });
      message.success('File updated');
      setEditModalVisible(false);
      fetchFiles();
    } catch (err) {
      console.error(err);
      message.error('Update failed');
    }
  };

  // ------- map & build -------
  const openMapModal = async (record) => {
    setMapRecord(record);

    try {
      const res = await axios.get(`${DOMAIN}/files/${record.fileKey}/columns`);
      setAvailableCols(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Failed to get columns');
      setAvailableCols([]);
    }

    // 如果 record.columnSchema 已经有了，就回填
    const existingSchema = record.columnSchema || [];
    setColumnSchema(existingSchema);

    setMapModalVisible(true);
  };

  const handleMapOk = async () => {
    if (!mapRecord) return;
    try {
      // POST /files/:fileKey/mapColumns  body: { columnSchema }
      await axios.post(`${DOMAIN}/files/${mapRecord.fileKey}/mapColumns`, {
        columnSchema,
      });
      message.success('Column map saved');

      // 然后 buildStore
      await axios.post(`${DOMAIN}/files/${mapRecord.fileKey}/buildStore`);
      message.success('Vector store built');
      setMapModalVisible(false);
      fetchFiles();
    } catch (err) {
      console.error(err);
      message.error('Map/Build failed');
    }
  };

  // ------- loadDemo -------
  const loadDemo = async (demoName) => {
    try {
      const res = await axios.get(`${DOMAIN}/files/loadDemo`, {
        params: { demoName },
      });
      if (res.data.fileKey) {
        message.success(res.data.message || 'Demo file loaded');
        await fetchFiles();
        setActiveChatFile(res.data.fileKey);
      }
    } catch (err) {
      console.error(err);
      message.error('Load demo failed');
    }
  };

  // ------- Chat memory -------
  useEffect(() => {
    if (!activeChatFile) {
      setConversation([]);
      return;
    }
    const localKey = LOCALSTORAGE_PREFIX + activeChatFile;
    const savedVal = localStorage.getItem(localKey);
    if (savedVal) {
      setConversation(JSON.parse(savedVal));
    } else {
      setConversation([]);
    }
  }, [activeChatFile]);

  useEffect(() => {
    if (!activeChatFile) return;
    const localKey = LOCALSTORAGE_PREFIX + activeChatFile;
    localStorage.setItem(localKey, JSON.stringify(conversation));
  }, [activeChatFile, conversation]);

  const handleResp = (question, answer) => {
    setConversation((prev) => [...prev, { question, answer }]);
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (tags) =>
        tags?.map((t) => (
          <span key={t} style={{ marginRight: 6 }}>
            {t}
          </span>
        )),
    },
    {
      title: 'docType',
      dataIndex: 'docType',
      render: (val) => val || '',
    },
    {
      title: 'FileType',
      dataIndex: 'fileType',
    },
    {
      title: 'StoreBuilt',
      dataIndex: 'storeBuilt',
      render: (val) => (val ? 'Yes' : 'No'),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (val) => {
        if (!val) return '';
        const dt = new Date(val);
        return dt.toLocaleString();
      },
    },
    {
      title: 'Actions',
      render: (text, record) => (
        <Space>
          <Button onClick={() => openEditModal(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
          {['.csv', '.xlsx', '.xls'].includes(record.fileType) && (
            <Button onClick={() => openMapModal(record)}>Map & Build</Button>
          )}
          {['.pdf', '.txt'].includes(record.fileType) && !record.storeBuilt && (
            <Button
              onClick={async () => {
                try {
                  await axios.post(
                    `${DOMAIN}/files/${record.fileKey}/buildStore`
                  );
                  message.success('Store built');
                  fetchFiles();
                } catch (err) {
                  console.error(err);
                  message.error('Build store failed');
                }
              }}
            >
              BuildStore
            </Button>
          )}
          {record.storeBuilt && (
            <Button
              type="primary"
              onClick={() => {
                setActiveChatFile(record.fileKey);
                message.info(`Now chatting about file: ${record.fileName}`);
              }}
            >
              Chat
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>File Management with Chat</h2>

      <div style={{ marginBottom: 10 }}>
        <Button type="primary" onClick={() => setUploadModalVisible(true)}>
          Upload New File
        </Button>
        <span style={{ marginLeft: 10 }}>Load Demo: </span>
        <Button onClick={() => loadDemo('demo.pdf')} style={{ marginRight: 8 }}>
          Demo PDF
        </Button>
        <Button onClick={() => loadDemo('demo.csv')}>Demo CSV</Button>
      </div>

      <Table
        columns={columns}
        dataSource={fileList}
        rowKey="fileKey"
        loading={loading}
      />

      {/* Upload Modal */}
      <Modal
        title="Upload File"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Tags (comma separated):">
            <Input
              placeholder="e.g. climate, reference"
              onChange={(e) =>
                setUploadTags(e.target.value.split(',').map((t) => t.trim()))
              }
            />
          </Form.Item>
          <Form.Item label="Document Type">
            <Select
              value={uploadDocType}
              onChange={(val) => setUploadDocType(val)}
              style={{ width: 200 }}
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <Upload
          beforeUpload={(file) => {
            handleUploadFile({ file });
            return false; // prevent default
          }}
          multiple={false}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Select file</Button>
        </Upload>
      </Modal>

      {/* Edit modal */}
      <Modal
        title="Edit File"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditOk}
      >
        <Form layout="vertical">
          <Form.Item label="New Name:">
            <Input
              style={{ marginBottom: 10 }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Tags (comma separated):">
            <Input
              value={editTags.join(', ')}
              onChange={(e) =>
                setEditTags(e.target.value.split(',').map((x) => x.trim()))
              }
            />
          </Form.Item>
          <Form.Item label="docType">
            <Select
              value={editDocType}
              onChange={(val) => setEditDocType(val)}
              style={{ width: 200 }}
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Map & Build modal */}
      <Modal
        title="Map Columns & Build Store"
        visible={mapModalVisible}
        onOk={handleMapOk}
        onCancel={() => setMapModalVisible(false)}
        width={800}
      >
        <ColumnMapper
          columns={availableCols}
          columnSchema={columnSchema}
          setColumnSchema={setColumnSchema}
        />
      </Modal>

      {/* 聊天面板 */}
      {activeChatFile && (
        <Card style={{ marginTop: 20, background: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Chat about file: {activeChatFile}</h3>
            <Button
              type="text"
              icon={<CloseOutlined />}
              style={{ color: 'red' }}
              onClick={() => {
                setActiveChatFile('');
              }}
            >
              Close
            </Button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 10 }}>
            <RenderQA conversation={conversation} isLoading={isChatLoading} />

            {/* 这里可以放你的 RenderQA 或其他对话组件 */}
            {/* {conversation.map((each, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <div>
                  <strong>User:</strong> {each.question}
                </div>
                <div>
                  <strong>AI:</strong> {each.answer}
                </div>
              </div>
            ))} */}
            {isChatLoading && <div>Loading...</div>}
          </div>
          {/* 这里也可以放 ChatComponent */}
          {/* <p>(Chat input here... omitted for brevity in this example)</p> */}
          <ChatComponent
            handleResp={handleResp}
            isLoading={isChatLoading}
            setIsLoading={setIsChatLoading}
            activeFile={activeChatFile}
            sessionId={`fileChat-${activeChatFile}`}
          />
        </Card>
      )}
    </div>
  );
}

export default FileManagement;
