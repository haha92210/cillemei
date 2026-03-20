# 「辞了没」小程序 - Day1 开发任务

## 项目概述
开发一个面向职场人的趣味小程序，帮助想辞职但还没辞职的用户。

## 今日目标（Day1）
完成项目基础架构搭建和数据库设计

## 具体任务

### 1. 创建项目目录结构
```
cillemei/
├── server/                 # 后端
│   ├── src/
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API路由
│   │   ├── controllers/   # 控制器
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── app.js
├── miniprogram/           # 微信小程序
│   ├── pages/
│   ├── components/
│   └── app.json
└── README.md
```

### 2. 初始化后端项目
- 初始化 Node.js 项目
- 安装依赖：express, mongoose, dotenv, cors
- 创建基础 Express 应用

### 3. 设计 MongoDB 数据模型
创建以下模型文件：
- `models/User.js` - 用户表
- `models/Fortune.js` - 运势记录表
- `models/Post.js` - 树洞帖子表
- `models/Calculator.js` - 计算器记录表
- `models/Countdown.js` - 倒计时表

参考 PRD 中的数据模型设计

### 4. 配置数据库连接
- 使用 MongoDB Atlas 或本地 MongoDB
- 创建 .env 配置文件
- 测试数据库连接

### 5. 创建基础路由
- `routes/fortune.js` - 运势相关 API
- `routes/posts.js` - 树洞帖子 API
- `routes/calculator.js` - 计算器 API
- `routes/countdown.js` - 倒计时 API

### 6. 初始化小程序项目
- 创建小程序基础结构
- 配置 app.json
- 创建首页框架

## 技术要求
- Node.js 18+
- MongoDB 6+
- 微信小程序基础库 2.30+

## 输出要求
1. 完成所有文件创建
2. 确保后端可以正常启动
3. 数据库模型完整
4. 提交到 GitHub

## 参考文档
PRD 位置：~/.openclaw/workspace/【11】项目文档/辞了没/PRD_v1.0.md
