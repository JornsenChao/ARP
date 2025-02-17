// src/components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary.js
import React, { useState, useEffect } from 'react';
import './ResrcPrecNotesLibrary.css';

function ResrcPrecNotesLibrary({
  isOpen,
  onClose,
  currentStepId = null,
  currentTaskId = null,
}) {
  // isOpen: Boolean, 是否显示面板
  // onClose: Function, 关闭面板的回调

  const [activeTab, setActiveTab] = useState('resources');
  // 也可'precedents'，实现两大区块的切换
  const [query, setQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');
  const [buildingType, setBuildingType] = useState('');
  // ... 其他过滤字段

  const [resources, setResources] = useState([]);
  const [precedents, setPrecedents] = useState([]);
  // 笔记相关
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  // 当组件挂载或查询参数变化时，请求后端
  useEffect(() => {
    if (isOpen && activeTab === 'resources') {
      fetchResources();
    } else if (isOpen && activeTab === 'precedents') {
      fetchPrecedents();
    }
    // eslint-disable-next-line
  }, [isOpen, activeTab, query, hazardFilter, buildingType]);

  const fetchResources = async () => {
    try {
      let url = `http://localhost:8000/resources?query=${encodeURIComponent(
        query
      )}`;
      // 可以把 hazardFilter, buildingType 等也拼到 url 上
      // url += `&hazard=${hazardFilter}&buildingType=${buildingType}`
      const response = await fetch(url);
      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const fetchPrecedents = async () => {
    try {
      let url = `http://localhost:8000/precedents?query=${encodeURIComponent(
        query
      )}`;
      // 同理添加过滤参数
      const response = await fetch(url);
      const data = await response.json();
      setPrecedents(data);
    } catch (err) {
      console.error('Error fetching precedents:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      // 可以自定义查询参数
      // 例如 GET /notes?stepId=xx&taskId=yy
      let url = 'http://localhost:8000/notes';
      const params = [];
      if (currentStepId) params.push(`stepId=${currentStepId}`);
      if (currentTaskId) params.push(`taskId=${currentTaskId}`);
      if (params.length) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };
  // 新增笔记
  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const response = await fetch('http://localhost:8000/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          stepId: currentStepId,
          taskId: currentTaskId,
        }),
      });
      const newNote = await response.json();
      // 加到列表里
      setNotes((prev) => [...prev, newNote]);
      setNoteContent('');
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };
  if (!isOpen) return null; // 如果isOpen=false，不渲染面板

  return (
    <div className="resource-library-overlay">
      <div className="resource-library-panel">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {/* Tabs: 切换"Resources"和"Precedents" */}
        <div className="tabs">
          <button
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button
            className={activeTab === 'precedents' ? 'active' : ''}
            onClick={() => setActiveTab('precedents')}
          >
            Precedents
          </button>
          <button
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </div>

        {/* Filter Panel */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* 示例: 下拉菜单选择Hazard */}
          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
          >
            <option value="">All Hazards</option>
            <option value="flood">Flood</option>
            <option value="earthquake">Earthquake</option>
            <option value="hurricane">Hurricane</option>
          </select>

          {/* 同理可加更多过滤器，如 Building Type 等 */}
        </div>

        {/* Content Area */}
        {activeTab === 'resources' && (
          <div className="resource-list">
            {resources.map((res) => (
              <div key={res.id} className="resource-item">
                <h4>{res.title}</h4>
                <p>{res.description}</p>
                <button onClick={() => handleAttachResource(res)}>
                  Navigate
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'precedents' && (
          <div className="precedent-list">
            {precedents.map((pre) => (
              <div key={pre.id} className="precedent-item">
                <h4>{pre.title}</h4>
                <p>{pre.description}</p>
                <button onClick={() => handleAttachPrecedent(pre)}>
                  Explore
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-container">
            <h4>
              Current Step: {currentStepId ?? 'None'}, Task:{' '}
              {currentTaskId ?? 'None'}
            </h4>
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="notes-item">
                  <p>{note.content}</p>
                  <small>
                    [Step {note.stepId}, Task {note.taskId ?? 'N/A'}] -{' '}
                    {new Date(note.createTime).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
            <div className="note-input">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
              />
              <button onClick={handleCreateNote}>Save Note</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function handleAttachResource(resource) {
    // TODO: 你可以在这里将选中的资源信息发送到调用者（比如WorkflowTaskPage）
    // 最简单的实现：把 resource 通过回调函数传回去
    // 或者用全局状态管理(Redux/Context)给当前任务添加引用
    console.log('Attach resource', resource);
  }

  function handleAttachPrecedent(precedent) {
    // 同理处理先例
    console.log('Attach precedent', precedent);
  }
}

export default ResrcPrecNotesLibrary;
