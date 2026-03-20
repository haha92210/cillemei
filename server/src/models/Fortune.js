/**
 * 运势记录模型
 * 存储每日抽签结果
 */

const mongoose = require('mongoose');

const fortuneSchema = new mongoose.Schema({
  // 关联用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '用户ID'
  },
  
  // 抽签日期（每天只能抽一次）
  drawDate: {
    type: String,
    required: true,
    index: true,
    comment: '抽签日期 YYYY-MM-DD'
  },
  
  // 运势内容
  result: {
    level: {
      type: String,
      required: true,
      enum: ['上上签', '上签', '中上签', '中签', '中下签', '下签'],
      comment: '运势等级'
    },
    title: {
      type: String,
      required: true,
      comment: '运势标题'
    },
    content: {
      type: String,
      required: true,
      comment: '运势详细内容'
    },
    advice: {
      type: String,
      default: '',
      comment: '今日建议'
    }
  },
  
  // 运势详情
  details: {
    career: {
      score: { type: Number, min: 1, max: 100, comment: '事业运分数' },
      desc: { type: String, comment: '事业运描述' }
    },
    wealth: {
      score: { type: Number, min: 1, max: 100, comment: '财运分数' },
      desc: { type: String, comment: '财运描述' }
    },
    relationship: {
      score: { type: Number, min: 1, max: 100, comment: '人际关系分数' },
      desc: { type: String, comment: '人际关系描述' }
    },
    resignation: {
      score: { type: Number, min: 1, max: 100, comment: '辞职指数' },
      desc: { type: String, comment: '辞职建议' }
    }
  },
  
  // 用户分享状态
  shared: {
    type: Boolean,
    default: false,
    comment: '是否已分享'
  }
}, {
  timestamps: true,
  collection: 'fortunes'
});

// 复合索引：一个用户每天只能有一条记录
fortuneSchema.index({ userId: 1, drawDate: 1 }, { unique: true });
fortuneSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Fortune', fortuneSchema);
