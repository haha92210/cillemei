/**
 * 树洞帖子模型
 * 用户匿名倾诉交流
 */

const mongoose = require('mongoose');

// 评论子文档Schema
const commentSchema = new mongoose.Schema({
  // 评论ID
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  // 评论用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    comment: '评论用户ID'
  },
  // 评论内容
  content: {
    type: String,
    required: true,
    maxlength: 500,
    comment: '评论内容'
  },
  // 点赞数
  likes: {
    type: Number,
    default: 0,
    comment: '点赞数'
  },
  // 回复的评论ID（用于二级回复）
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    comment: '回复的评论ID'
  },
  // 回复的用户名
  replyToName: {
    type: String,
    default: null,
    comment: '回复的用户名'
  },
  // 状态
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'deleted', 'reported'],
    comment: '评论状态'
  }
}, {
  timestamps: true
});

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
    enum: ['吐槽', '求助', '分享', '树洞', '其他'],
    comment: '帖子类型'
  },
  
  // 心情emoji
  mood: {
    type: String,
    default: '😐',
    comment: '心情emoji'
  },
  
  // 帖子标签
  tags: [{
    type: String,
    maxlength: 20,
    comment: '标签'
  }],
  
  // 评论列表
  comments: [commentSchema],
  
  // 互动统计
  stats: {
    likes: { type: Number, default: 0, comment: '点赞数' },
    comments: { type: Number, default: 0, comment: '评论数' },
    views: { type: Number, default: 0, comment: '浏览数' },
    sameHere: { type: Number, default: 0, comment: '我也一样数' }
  },
  
  // 点赞用户列表（用于防止重复点赞）
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: '点赞用户ID'
  }],
  
  // "我也一样"用户列表
  sameHereBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: '点我也一样的用户ID'
  }],
  
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
  
  // 热门标记
  isHot: {
    type: Boolean,
    default: false,
    comment: '是否热门'
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
postSchema.index({ isHot: -1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'stats.likes': -1 });
postSchema.index({ 'comments.createdAt': -1 });

// 虚拟字段：评论数量
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.filter(c => c.status === 'active').length : 0;
});

// 实例方法：添加评论
postSchema.methods.addComment = function(userId, content, replyTo = null, replyToName = null) {
  const comment = {
    userId,
    content: content.trim(),
    replyTo,
    replyToName,
    status: 'active'
  };
  this.comments.push(comment);
  this.stats.comments = this.comments.filter(c => c.status === 'active').length;
  return this.save();
};

// 实例方法：删除评论
postSchema.methods.deleteComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('评论不存在');
  }
  if (comment.userId.toString() !== userId.toString()) {
    throw new Error('无权删除此评论');
  }
  comment.status = 'deleted';
  this.stats.comments = this.comments.filter(c => c.status === 'active').length;
  return this.save();
};

// 实例方法：点赞
postSchema.methods.like = function(userId) {
  const userIdStr = userId.toString();
  if (!this.likedBy.includes(userIdStr)) {
    this.likedBy.push(userId);
    this.stats.likes += 1;
  }
  return this.save();
};

// 实例方法：取消点赞
postSchema.methods.unlike = function(userId) {
  const userIdStr = userId.toString();
  const index = this.likedBy.indexOf(userIdStr);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.stats.likes = Math.max(0, this.stats.likes - 1);
  }
  return this.save();
};

// 实例方法：我也一样
postSchema.methods.sameHere = function(userId) {
  const userIdStr = userId.toString();
  if (!this.sameHereBy.includes(userIdStr)) {
    this.sameHereBy.push(userId);
    this.stats.sameHere += 1;
  }
  return this.save();
};

module.exports = mongoose.model('Post', postSchema);
