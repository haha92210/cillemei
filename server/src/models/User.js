/**
 * 用户模型
 * 存储小程序用户信息
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 微信登录相关
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: '微信用户唯一标识'
  },
  unionid: {
    type: String,
    sparse: true,
    comment: '微信开放平台统一标识'
  },
  
  // 用户信息
  nickName: {
    type: String,
    default: '',
    comment: '昵称'
  },
  avatarUrl: {
    type: String,
    default: '',
    comment: '头像URL'
  },
  gender: {
    type: Number,
    default: 0,
    enum: [0, 1, 2],
    comment: '性别: 0-未知 1-男 2-女'
  },
  
  // 统计信息
  stats: {
    fortuneCount: { type: Number, default: 0, comment: '抽签次数' },
    postCount: { type: Number, default: 0, comment: '发帖数' },
    calculatorCount: { type: Number, default: 0, comment: '计算器使用次数' },
    lastLoginAt: { type: Date, default: Date.now, comment: '最后登录时间' }
  },
  
  // 用户设置
  settings: {
    notifications: { type: Boolean, default: true, comment: '是否接收通知' },
    theme: { type: String, default: 'light', enum: ['light', 'dark'], comment: '主题' }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// 索引
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.lastLoginAt': -1 });

module.exports = mongoose.model('User', userSchema);
