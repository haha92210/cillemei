# 辞了没 - 职场人决策助手小程序

> "想辞职，但还没辞职，那你就是辞了没。"

## 项目概述

「辞了没」是一款面向职场人的趣味小程序，帮助那些想辞职但还没辞职的用户做出更理性的决策。

## 核心功能

- 🎯 **每日运势** - 抽签获取今日职场运势和建议
- 🧮 **离职计算器** - 多维度评估离职风险和最佳时机
- ⏰ **倒计时** - 记录重要日子（年终奖、离职日等）
- 🌳 **树洞** - 匿名社区，倾诉和交流

## 技术栈

### 后端
- Node.js 18+
- Express.js
- MongoDB 6+ + Mongoose
- 其他: dotenv, cors

### 前端
- 微信小程序
- 基础库 2.30+

## 项目结构

```
cillemei/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── models/        # MongoDB 数据模型
│   │   │   ├── User.js
│   │   │   ├── Fortune.js
│   │   │   ├── Post.js
│   │   │   ├── Calculator.js
│   │   │   └── Countdown.js
│   │   ├── routes/        # API 路由
│   │   │   ├── fortune.js
│   │   │   ├── posts.js
│   │   │   ├── calculator.js
│   │   │   └── countdown.js
│   │   ├── controllers/   # 控制器（待实现）
│   │   └── utils/         # 工具函数（待实现）
│   ├── app.js             # 主入口
│   ├── package.json
│   └── .env.example       # 环境变量示例
│
├── miniprogram/           # 微信小程序
│   ├── pages/             # 页面
│   │   ├── index/         # 首页
│   │   ├── fortune/       # 运势页
│   │   └── profile/       # 个人中心
│   ├── posts/             # 树洞模块
│   │   └── pages/
│   ├── calculator/        # 计算器模块
│   │   └── pages/
│   ├── countdown/         # 倒计时模块
│   │   └── pages/
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   └── project.config.json
│
└── README.md
```

## 快速开始

### 后端启动

```bash
cd server
npm install
# 复制环境变量文件并修改
 cp .env.example .env
# 启动开发服务器
npm run dev
```

后端默认运行在 `http://localhost:3000`

### 小程序开发

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 在详情设置中勾选"不校验合法域名"
3. 修改 `app.js` 中的 `apiBaseUrl` 为你的后端地址

## API 接口

### 运势 (Fortune)
- `GET /api/fortune/today?userId=` - 获取今日运势
- `POST /api/fortune/draw` - 抽取运势
- `GET /api/fortune/history` - 运势历史

### 树洞 (Posts)
- `GET /api/posts` - 帖子列表
- `GET /api/posts/:id` - 帖子详情
- `POST /api/posts` - 发布帖子
- `POST /api/posts/:id/like` - 点赞

### 计算器 (Calculator)
- `POST /api/calculator/calculate` - 计算风险评估
- `GET /api/calculator/history` - 计算历史
- `GET /api/calculator/meta/questions` - 问题配置

### 倒计时 (Countdown)
- `GET /api/countdown` - 倒计时列表
- `POST /api/countdown` - 创建倒计时
- `PUT /api/countdown/:id` - 更新倒计时
- `DELETE /api/countdown/:id` - 删除倒计时

## 数据模型

### User
- 用户基本信息、微信登录
- 统计信息、设置

### Fortune
- 每日抽签记录
- 运势详情、评分维度
- 用户分享状态

### Post
- 匿名帖子内容
- 分类、标签、互动统计
- 审核状态

### Calculator
- 用户输入参数
- 计算结果、风险评估
- 历史记录

### Countdown
- 倒计时事件
- 目标日期、提醒设置
- 样式自定义

## 开发计划

### Day1 ✅
- [x] 项目目录结构
- [x] 后端项目初始化
- [x] MongoDB 数据模型设计
- [x] 基础路由创建
- [x] 小程序项目初始化
- [x] 首页框架

### Day2
- [ ] 微信登录集成
- [ ] 运势抽签完整功能
- [ ] 树洞发布和列表

### Day3
- [ ] 离职计算器完整功能
- [ ] 倒计时管理
- [ ] 个人中心

### Day4
- [ ] UI 优化
- [ ] 测试和 Bug 修复
- [ ] 部署准备

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## License

MIT License

---

Made with ❤️ by 辞了没团队
