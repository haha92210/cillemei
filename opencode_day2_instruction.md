# 「辞了没」小程序 - Day2 开发任务

## 今日目标
完成核心业务功能开发：运势算法、树洞社区、计算器逻辑、倒计时功能

## 具体任务

### 1. 完善运势算法（server/src/utils/fortuneAlgorithm.js）
创建运势生成算法：
- 基于日期+用户ID的伪随机算法
- 运势库：100+条文案，分类：宜提离职/宜苟住/宜准备/宜摸鱼
- 运势等级：上上签/上签/中上签/中签/中下签/下签
- 包含：事业运、财运、人际关系、辞职指数评分
- 幸运色、幸运数字生成

### 2. 完善树洞社区功能

#### 2.1 完善 Post 模型（server/src/models/Post.js）
添加字段：
- comments: 评论数组（userId, content, createdAt, likes）
- category: 分类（吐槽/求助/分享/其他）
- mood: 心情emoji
- isPinned: 是否置顶
- status: 状态（active/deleted）

#### 2.2 完善 posts 路由（server/src/routes/posts.js）
添加接口：
- POST /api/posts/:id/comments - 添加评论
- DELETE /api/posts/:id/comments/:commentId - 删除评论
- POST /api/posts/:id/like - 点赞
- POST /api/posts/:id/same - "我也一样"
- GET /api/posts/hot - 热榜（按点赞数排序）

### 3. 完善计算器逻辑（server/src/utils/calculatorLogic.js）
创建离职风险评估算法：
- 输入：存款、月薪、月支出、城市、家庭情况
- 计算：可支撑月数 = 存款 / (月支出 × 城市系数 × 家庭系数)
- 城市系数：一线1.2，二线1.0，三线0.8
- 家庭系数：单身1.0，已婚1.3，有娃1.8
- 风险等级：安全(>6月)/警戒(3-6月)/危险(<3月)
- 输出：风险评级 + 建议文案

### 4. 完善倒计时功能

#### 4.1 完善 Countdown 模型（server/src/models/Countdown.js）
添加字段：
- checkInHistory: 打卡历史数组
- badges: 获得的徽章数组
- streak: 连续打卡天数

#### 4.2 完善 countdown 路由（server/src/routes/countdown.js）
添加接口：
- POST /api/countdown/:id/checkin - 每日打卡
- GET /api/countdown/:id/stats - 获取统计（连续天数、总天数）
- GET /api/countdown/badges - 获取徽章列表

### 5. 完善小程序前端页面

#### 5.1 完善运势页面（miniprogram/pages/fortune/）
- fortune.wxml：运势展示、抽签按钮、分享按钮
- fortune.js：调用后端 API、生成分享图片
- fortune.wxss：运势卡片样式

#### 5.2 创建树洞列表页（miniprogram/posts/pages/list/）
- list.wxml：帖子列表、标签筛选、发布按钮
- list.js：获取帖子、下拉刷新、上拉加载
- list.wxss：列表样式

#### 5.3 创建树洞详情页（miniprogram/posts/pages/detail/）
- detail.wxml：帖子内容、评论列表、评论输入框
- detail.js：获取详情、发表评论、点赞
- detail.wxss：详情页样式

#### 5.4 创建计算器页面（miniprogram/calculator/pages/index/）
- index.wxml：输入表单、计算按钮、结果展示
- index.js：表单验证、调用 API、展示结果
- index.wxss：计算器样式

#### 5.5 创建倒计时页面（miniprogram/countdown/pages/list/ 和 edit/）
- list：倒计时列表、打卡按钮
- edit：创建/编辑倒计时

### 6. 更新 app.json
添加所有新页面路径到 pages 数组

## 技术要求
- 后端：Node.js + Express + MongoDB
- 前端：微信小程序原生
- 代码规范：统一错误处理、添加注释

## 输出要求
1. 所有业务逻辑完整
2. API 接口可正常调用
3. 小程序页面可正常显示
4. 提交到 GitHub

## 参考
- Day1 已完成代码在 ~/cillemei
- GitHub: https://github.com/haha92210/cillemei
