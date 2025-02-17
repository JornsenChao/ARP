// backendJS/server.js

const express = require('express');
const cors = require('cors');

// 路由文件
const tasksRouter = require('./routes/tasksRouter');
const resourcesRouter = require('./routes/resourcesRouter');
const precedentsRouter = require('./routes/precedentsRouter');

const app = express();

// 允许跨域请求
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // 解析 application/json 请求体

// 测试用根路由
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from Node/Express backend!' });
});

// 注册各业务路由
app.use('/tasks', tasksRouter);
app.use('/resources', resourcesRouter);
app.use('/precedents', precedentsRouter);

// 启动服务器
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
