# 「辞了没」Phase 2 开发任务

## 目标
完善 API 业务逻辑，集成核心算法

## 任务1：完善运势 API
文件：server/src/routes/fortune.js
修改内容：
- 引入 fortuneAlgorithm.js
- POST /api/fortune/draw 使用算法生成运势
- 根据日期+用户ID生成一致的运势
- 返回完整的运势数据（等级、文案、评分、幸运色等）

## 任务2：完善计算器 API
文件：server/src/routes/calculator.js
修改内容：
- 引入 calculatorLogic.js
- POST /api/calculator 调用算法计算
- 返回风险评级、可支撑月数、建议
- 保存计算记录到数据库

## 任务3：完善树洞 API
文件：server/src/routes/posts.js
添加接口：
- POST /api/posts/:id/comments - 添加评论
- DELETE /api/posts/:id/comments/:commentId - 删除评论
- POST /api/posts/:id/like - 点赞
- POST /api/posts/:id/unlike - 取消点赞
- POST /api/posts/:id/same - "我也一样"
- GET /api/posts/hot - 热榜（按点赞数排序）

## 任务4：完善倒计时 API
文件：server/src/routes/countdown.js
添加接口：
- POST /api/countdown/:id/checkin - 每日打卡
- GET /api/countdown/:id/stats - 获取统计
- 计算连续打卡天数
- 检查是否获得徽章

## 要求
- 所有接口测试通过
- 错误处理完善
- 返回数据格式统一
