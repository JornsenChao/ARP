// backendJS/main.js

const express = require('express');
const cors = require('cors');

const app = express();

// 允许跨域请求
app.use(cors());

// 如果后续需要解析 JSON body，可开启：
// app.use(express.json());

// 静态示例数据：任务、资源和先例
const tasks_data = [
  {
    id: 1,
    title: 'Risk Identification',
    description: 'Identify potential risks in the project.',
  },
  {
    id: 2,
    title: 'Risk Assessment',
    description: 'Evaluate the probability and impact of risks.',
  },
  {
    id: 3,
    title: 'Strategy Formulation',
    description: 'Develop strategies to mitigate identified risks.',
  },
];

const resources_data = [
  { id: 1, title: 'Flood Risk Data', description: 'Data on flood risks.' },
  {
    id: 2,
    title: 'Earthquake Safety Guidelines',
    description: 'Guidelines for building earthquake resilient structures.',
  },
  {
    id: 3,
    title: 'Climate Change Impact Report',
    description: 'Report on climate change impacts in coastal areas.',
  },
];

const precedents_data = [
  {
    id: 0,
    title: 'Build your own search filter',
    description: 'Drag these filter field to your workflow',
  },
  { id: 1, title: 'By Project Type', description: 'Healthcare' },
  {
    id: 2,
    title: 'By Project Stage',
    description: 'RFP/Pursuit, Conceptual Design, Design Development',
  },
  {
    id: 3,
    title: 'By Project Hazard',
    description: 'Earthquake, Flood, Wildfire',
  },
  {
    id: 4,
    title: 'By Project Geolocation',
    description: 'Pacific North West, South East',
  },
];

// 根路径
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from Node Express' });
});

// 列出所有任务
app.get('/tasks', (req, res) => {
  res.json(tasks_data);
});

// 获取单个任务详情
app.get('/tasks/:task_id', (req, res) => {
  const task_id = parseInt(req.params.task_id, 10);
  const task = tasks_data.find((t) => t.id === task_id);
  if (!task) {
    return res.status(404).json({ detail: 'Task not found' });
  }
  res.json(task);
});

// 返回静态资源数据（暂不处理 query 参数）
app.get('/resources', (req, res) => {
  // 如果需要处理 ?query=xxx，请在这里做筛选
  // const query = req.query.query;
  // ...
  res.json(resources_data);
});

// 返回静态先例数据（暂不处理 query 参数）
app.get('/precedents', (req, res) => {
  // 同理可处理 ?query=xxx 做筛选
  res.json(precedents_data);
});

// 启动服务器
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Node server listening on port ${PORT}`);
});
