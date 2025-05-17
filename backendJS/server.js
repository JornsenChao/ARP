// backendJS/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import tasksRouter from './routes/tasksRouter.js';
import resourcesRouter from './routes/resourcesRouter.js';
import precedentsRouter from './routes/precedentsRouter.js';
import notesRouter from './routes/notesRouter.js';

import essentialWorkflowRouter from './routes/essentialWorkflowRouter.js';
import { fileRoutes } from './routes/fileRoutes.js';
// import { RAGRouter } from './routes/RAGRouter.js';
import { conversationRoutes } from './routes/conversationRoutes.js';
import { multiRAGRoutes } from './routes/multiRAGRoutes.js';
import { proRAGRoutes } from './routes/proRAGRoutes.js';
import { sessionRoutes } from './routes/sessionRoutes.js';

dotenv.config();
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 测试用根路由
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from Node/Express backend with RAG function!',
  });
});

// 允许跨域请求
// app.use(cors({ origin: 'http://localhost:3000' }));
const whitelist = [];

// a) 本地开发：默认 http://localhost:3000
whitelist.push('http://localhost:3000');

// b) 线上前端域名：从环境变量读取
if (process.env.FRONTEND_URL) {
  whitelist.push(process.env.FRONTEND_URL);
}

// 你有多个预览域名时，可在这里再 push 其它地址
whitelist.push('https://arp-two.vercel.app');
whitelist.push('https://arp-jornsenchaos-projects.vercel.app');
whitelist.push('arp-git-main-jornsenchaos-projects.vercel.app');

const corsOptions = {
  origin(origin, callback) {
    // Postman / curl 等非浏览器请求 origin = undefined → 放行
    if (!origin || whitelist.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true, // 如果之后用到 cookie / JWT，可保留
};

app.use(cors(corsOptions));
app.use(express.json()); // 解析 application/json 请求体

// ============= 挂载 Reference Workflow 相关路由 =============
// 现在把原先 /tasks /resources /precedents /notes 统一改到 /ref-workflow/...
app.use('/ref-workflow/tasks', tasksRouter);
app.use('/ref-workflow/resources', resourcesRouter);
app.use('/ref-workflow/precedents', precedentsRouter);
app.use('/ref-workflow/notes', notesRouter);

// ============= 挂载 Essential Workflow 相关路由 =============
app.use('/workflow', essentialWorkflowRouter);
app.use('/files', fileRoutes);
// app.use('/RAG', RAGRouter);
app.use('/files', fileRoutes);
app.use('/conversation', conversationRoutes);
app.use('/multiRAG', multiRAGRoutes);
app.use('/proRAG', proRAGRoutes);
app.use('/session', sessionRoutes);

app.get('/', (req, res) => {
  res.send('Server is running. Try /files or /RAG routes.');
});

// 启动服务器
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
