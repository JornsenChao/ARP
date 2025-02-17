// src/components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary.js
import React, { useState, useEffect } from 'react';
import './ResrcPrecNotesLibrary.css';

/**
 * 右侧面板，内部分成3个子面板：Resources、Precedents、Notes。
 * 同时显示，无需Tab切换。
 */
function ResrcPrecNotesLibrary({
  isOpen,
  onClose,
  currentStepId = null,
  currentTaskId = null,
}) {
  // -----------------------
  // State: 筛选/查询相关
  // -----------------------
  const [query, setQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');
  const [buildingType, setBuildingType] = useState('');

  // -----------------------
  // 三大库数据
  // -----------------------
  const [resources, setResources] = useState([]);
  const [precedents, setPrecedents] = useState([]);
  const [notes, setNotes] = useState([]);

  // -----------------------
  // Notes输入框
  // -----------------------
  const [noteContent, setNoteContent] = useState('');

  // -----------------------
  // 一次性获取 Resources / Precedents / Notes
  // -----------------------
  useEffect(() => {
    if (!isOpen) return; // 面板关闭时不抓取

    // 并行抓取
    fetchResources();
    fetchPrecedents();
    fetchNotes();
    // eslint-disable-next-line
  }, [isOpen, query, hazardFilter, buildingType, currentStepId, currentTaskId]);

  // -----------------------
  // Fetch Resources
  // -----------------------
  const fetchResources = async () => {
    try {
      let url = `http://localhost:8000/resources?query=${encodeURIComponent(
        query
      )}`;
      // 如果需要 hazardFilter / buildingType 也拼接，可自行添加
      //   url += `&hazard=${hazardFilter}&buildingType=${buildingType}`
      const response = await fetch(url);
      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  // -----------------------
  // Fetch Precedents
  // -----------------------
  const fetchPrecedents = async () => {
    try {
      let url = `http://localhost:8000/precedents?query=${encodeURIComponent(
        query
      )}`;
      // 同理可以添加 hazardFilter 等
      const response = await fetch(url);
      const data = await response.json();
      setPrecedents(data);
    } catch (err) {
      console.error('Error fetching precedents:', err);
    }
  };

  // -----------------------
  // Fetch Notes
  // -----------------------
  const fetchNotes = async () => {
    try {
      // 根据当前 stepId/taskId 过滤
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

  // -----------------------
  // Create Note
  // -----------------------
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
      // 将新笔记插入到数组末尾
      setNotes((prev) => [...prev, newNote]);
      setNoteContent('');
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  // 如果面板关闭则不渲染
  if (!isOpen) return null;

  // -----------------------
  // Resource / Precedent 的“Attach”按钮演示
  // -----------------------
  function handleAttachResource(resource) {
    console.log('Attach this resource to current step and task', resource);
    // TODO: 你可以将选中的资源信息传递到父组件
    // 或者在全局状态中记录，这里只是示例
  }

  function handleAttachPrecedent(precedent) {
    console.log('Attach precedent', precedent);
  }

  // -----------------------
  // 渲染
  // -----------------------
  return (
    <div className="resrc-prec-notes-overlay">
      <div className="resrc-prec-notes-panel">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {/* 全局筛选器 (让Resource和Precedent共用) */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search Resource/Precedent..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
          >
            <option value="">All Hazards</option>
            <option value="flood">Flood</option>
            <option value="earthquake">Earthquake</option>
            <option value="hurricane">Hurricane</option>
          </select>
          {/* 如果需要 buildingType */}
          {/* <select
            value={buildingType}
            onChange={(e) => setBuildingType(e.target.value)}
          >
            <option value="">Any Building Type</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select> */}
        </div>

        {/* 3列布局 */}
        <div className="library-panels-container">
          {/* ------------------ RESOURCE SUBPANEL ------------------ */}
          <div className="subpanel resource-subpanel">
            <h3>Resources</h3>
            <div className="resource-list">
              {resources.map((res) => (
                <div key={res.id} className="resource-item">
                  <h4>{res.title}</h4>
                  <p>{res.description}</p>
                  <button onClick={() => handleAttachResource(res)}>
                    Attach
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ------------------ PRECEDENT SUBPANEL ------------------ */}
          <div className="subpanel precedent-subpanel">
            <h3>Precedents</h3>
            <div className="precedent-list">
              {precedents.map((pre) => (
                <div key={pre.id} className="precedent-item">
                  <h4>{pre.title}</h4>
                  <p>{pre.description}</p>
                  <button onClick={() => handleAttachPrecedent(pre)}>
                    Attach
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ------------------ NOTES SUBPANEL ------------------ */}
          <div className="subpanel notes-subpanel">
            <h3>Notes</h3>
            <p>
              Current Step: {currentStepId ?? 'None'}, Task:{' '}
              {currentTaskId ?? 'None'}
            </p>
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
        </div>
      </div>
    </div>
  );
}

export default ResrcPrecNotesLibrary;
