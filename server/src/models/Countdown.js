/**
 * 倒计时模型
 * 记录用户重要日期倒计时
 */

const mongoose = require('mongoose');

// 打卡记录子文档
const checkInSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    comment: '打卡日期 YYYY-MM-DD'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    comment: '打卡时间'
  },
  note: {
    type: String,
    maxlength: 200,
    comment: '打卡备注'
  }
}, { _id: false });

const countdownSchema = new mongoose.Schema({
  // 关联用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '用户ID'
  },
  
  // 倒计时标题
  title: {
    type: String,
    required: true,
    maxlength: 50,
    comment: '倒计时标题'
  },
  
  // 倒计时类型
  type: {
    type: String,
    default: 'resignation',
    enum: ['resignation', 'bonus', 'promotion', 'holiday', 'custom'],
    comment: '类型: 离职、年终奖、晋升、假期、自定义'
  },
  
  // 目标日期
  targetDate: {
    type: Date,
    required: true,
    comment: '目标日期'
  },
  
  // 目标时间（可选）
  targetTime: {
    type: String,
    default: '18:00',
    comment: '目标时间 HH:MM'
  },
  
  // 描述
  description: {
    type: String,
    maxlength: 200,
    comment: '描述'
  },
  
  // 提醒设置
  reminder: {
    enabled: { type: Boolean, default: true, comment: '是否开启提醒' },
    daysBefore: { 
      type: [Number], 
      default: [7, 3, 1],
      comment: '提前几天提醒'
    }
  },
  
  // 样式设置
  style: {
    backgroundColor: { type: String, default: '#f5f5f5', comment: '背景色' },
    textColor: { type: String, default: '#333333', comment: '文字颜色' },
    icon: { type: String, default: '⏰', comment: '图标' }
  },
  
  // 状态
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled'],
    comment: '状态'
  },
  
  // 完成时间
  completedAt: {
    type: Date,
    comment: '完成时间'
  },
  
  // 排序权重
  order: {
    type: Number,
    default: 0,
    comment: '排序权重'
  },
  
  // 打卡记录
  checkInHistory: {
    type: [checkInSchema],
    default: [],
    comment: '打卡历史'
  },
  
  // 连续打卡天数
  streak: {
    type: Number,
    default: 0,
    comment: '连续打卡天数'
  },
  
  // 徽章列表
  badges: [{
    id: { type: String, comment: '徽章ID' },
    name: { type: String, comment: '徽章名称' },
    icon: { type: String, comment: '徽章图标' },
    desc: { type: String, comment: '徽章描述' },
    earnedAt: { type: Date, default: Date.now, comment: '获得时间' }
  }]
}, {
  timestamps: true,
  collection: 'countdowns'
});

// 索引
countdownSchema.index({ userId: 1, status: 1 });
countdownSchema.index({ targetDate: 1 });
countdownSchema.index({ order: -1 });

module.exports = mongoose.model('Countdown', countdownSchema);
