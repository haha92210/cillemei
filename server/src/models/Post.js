/**
 * 树洞帖子模型
 * 用户匿名倾诉交流
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // 关联用户（匿名但不删除关联）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '发帖用户ID'
  },
  
  // 帖子内容
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    comment: '帖子内容'
  },
  
  // 帖子类型
  category: {
    type: String,
    default: '吐槽',
    enum: ['吐槽', '求助', '分享', '树洞'],
    comment: '帖子类型'
  },
  
  // 帖子标签
  tags: [{
    type: String,
    maxlength: 20,
    comment: '标签'
  }],
  
  // 互动统计
  stats: {
    likes: { type: Number, default: 0, comment: '点赞数' },
    comments: { type: Number, default: 0, comment: '评论数' },
    views: { type: Number, default: 0, comment: '浏览数' }
  },
  
  // 状态
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'hidden', 'deleted', 'reported'],
    comment: '帖子状态'
  },
  
  // 置顶标记
  isPinned: {
    type: Boolean,
    default: false,
    comment: '是否置顶'
  },
  
  // 审核信息
  moderation: {
    reviewedAt: { type: Date, comment: '审核时间' },
    reviewedBy: { type: String, comment: '审核人' },
    reason: { type: String, comment: '处理原因' }
  }
}, {
  timestamps: true,
  collection: 'posts'
});

// 索引
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', postSchema);
