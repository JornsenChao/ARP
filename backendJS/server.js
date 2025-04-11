// backendJS/server.js
const express = require('express');
const cors = require('cors');

// ====== 引入“参考工作流(Reference Workflow)”的路由 ======
const tasksRouter = require('./routes/tasksRouter');
const resourcesRouter = require('./routes/resourcesRouter');
const precedentsRouter = require('./routes/precedentsRouter');
const notesRouter = require('./routes/notesRouter');

// ====== 引入“Essential Workflow”新路由 ======
const essentialWorkflowRouter = require('./routes/essentialWorkflowRouter');

const app = express();

// 允许跨域请求
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // 解析 application/json 请求体

// 测试用根路由
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from Node/Express backend!' });
});

// ============= 挂载 Reference Workflow 相关路由 =============
// 现在把原先 /tasks /resources /precedents /notes 统一改到 /ref-workflow/...
app.use('/ref-workflow/tasks', tasksRouter);
app.use('/ref-workflow/resources', resourcesRouter);
app.use('/ref-workflow/precedents', precedentsRouter);
app.use('/ref-workflow/notes', notesRouter);

// ============= 挂载 Essential Workflow 相关路由 =============
app.use('/workflow', essentialWorkflowRouter);

// 启动服务器
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
