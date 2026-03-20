# 「辞了没」小程序前端联调任务

## 目标
完善小程序页面，调用后端 API 实现完整功能

## 任务1：完善首页（pages/index/index.js）
- 调用 GET /api/fortune/today 获取今日运势
- 调用 GET /api/posts?limit=5 获取热门树洞
- 显示运势卡片和帖子列表
- 实现下拉刷新

## 任务2：完善运势页（pages/fortune/fortune.js）
- 调用 POST /api/fortune/draw 抽签
- 显示运势结果（等级、文案、评分、幸运色）
- 实现分享功能

## 任务3：完善树洞列表页（posts/pages/list/list.js）
- 调用 GET /api/posts 获取帖子列表
- 实现分类筛选
- 实现上拉加载更多
- 实现点赞、我也一样功能

## 任务4：完善计算器页（calculator/pages/index/index.js）
- 创建表单：存款、月支出、城市、家庭情况
- 调用 POST /api/calculator/calculate
- 显示计算结果（风险等级、可支撑月数、建议）

## 任务5：完善倒计时页（countdown/pages/list/list.js）
- 调用 GET /api/countdown 获取倒计时列表
- 实现打卡功能
- 显示徽章

## API 基础地址
const API_BASE = 'http://localhost:3000/api';

## 要求
- 统一封装请求函数
- 错误处理（显示提示）
- 加载状态显示
