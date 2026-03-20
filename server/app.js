/**
 * 辞了没小程序 - 后端主入口
 * Day1 基础架构
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cillemei';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 连接成功');
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error.message);
});

// 路由引入
const fortuneRoutes = require('./src/routes/fortune');
const postsRoutes = require('./src/routes/posts');
const calculatorRoutes = require('./src/routes/calculator');
const countdownRoutes = require('./src/routes/countdown');

// 路由注册
app.use('/api/fortune', fortuneRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/countdown', countdownRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '辞了没服务器运行中',
    timestamp: new Date().toISOString()
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    name: '辞了没小程序 API',
    version: '1.0.0',
    endpoints: {
      fortune: '/api/fortune',
      posts: '/api/posts',
      calculator: '/api/calculator',
      countdown: '/api/countdown'
    }
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📦 环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
