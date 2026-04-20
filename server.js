const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api', require('./src/routes/index'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback — 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动
app.listen(config.port, () => {
  console.log(`[video-dashboard] 服务已启动: http://localhost:${config.port}`);
});
