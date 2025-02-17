// backendJS/data/notesData.js

// 用一个数组来模拟数据库存储
// 每条笔记包含：id, content, stepId, taskId, createTime 等
// 也可根据需求继续扩展
const notesData = [
  {
    id: 1,
    content: 'This building needs higher flood protection.',
    stepId: 3,
    taskId: null,
    createTime: '2025-02-12T08:30:00Z',
  },
  {
    id: 2,
    content:
      'Check energy dependency. Looking at spaulding rehabilitation hospital by P+W',
    stepId: 4,
    taskId: 401,
    createTime: '2025-02-12T09:10:00Z',
  },
  {
    id: 3,
    content: 'Tell Yongqin about research plan v1',
    stepId: 4,
    taskId: 401,
    createTime: '2025-02-12T10:10:00Z',
  },
];

module.exports = notesData;
