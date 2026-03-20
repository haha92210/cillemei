/**
 * 离职计算器记录模型
 * 计算离职风险和建议
 */

const mongoose = require('mongoose');

const calculatorSchema = new mongoose.Schema({
  // 关联用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '用户ID'
  },
  
  // 计算器输入项
  inputs: {
    // 基本信息
    age: {
      type: Number,
      min: 18,
      max: 65,
      comment: '年龄'
    },
    city: {
      type: String,
      comment: '所在城市'
    },
    
    // 财务状况
    savings: {
      type: Number,
      min: 0,
      comment: '存款（月）'
    },
    monthlyExpense: {
      type: Number,
      min: 0,
      comment: '月支出'
    },
    
    // 工作状况
    workYears: {
      type: Number,
      min: 0,
      comment: '工作年限'
    },
    currentJobYears: {
      type: Number,
      min: 0,
      comment: '当前工作年限'
    },
    annualIncome: {
      type: Number,
      min: 0,
      comment: '年收入'
    },
    
    // 离职因素评分 (1-10)
    factors: {
      stress: { type: Number, min: 1, max: 10, comment: '压力程度' },
      growth: { type: Number, min: 1, max: 10, comment: '成长空间' },
      satisfaction: { type: Number, min: 1, max: 10, comment: '工作满意度' },
      health: { type: Number, min: 1, max: 10, comment: '健康影响' },
      relationship: { type: Number, min: 1, max: 10, comment: '人际关系' }
    }
  },
  
  // 计算结果
  result: {
    // 综合评分
    score: {
      type: Number,
      min: 0,
      max: 100,
      comment: '综合得分'
    },
    // 风险等级
    riskLevel: {
      type: String,
      enum: ['安全', '谨慎', '警告', '危险'],
      comment: '风险等级'
    },
    // 建议
    suggestion: {
      type: String,
      comment: '系统建议'
    },
    // 离职最佳时机
    bestTime: {
      type: String,
      comment: '最佳离职时间建议'
    },
    // 资金充足度（月）
    runway: {
      type: Number,
      comment: '可维持月数'
    }
  },
  
  // 是否保存为历史记录
  isSaved: {
    type: Boolean,
    default: true,
    comment: '是否保存'
  },
  
  // 备注
  note: {
    type: String,
    maxlength: 500,
    comment: '用户备注'
  }
}, {
  timestamps: true,
  collection: 'calculators'
});

// 索引
calculatorSchema.index({ userId: 1, createdAt: -1 });
calculatorSchema.index({ 'result.riskLevel': 1 });

module.exports = mongoose.model('Calculator', calculatorSchema);
