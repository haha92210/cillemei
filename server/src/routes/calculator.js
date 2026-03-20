/**
 * 离职计算器路由
 * /api/calculator
 */

const express = require('express');
const router = express.Router();
const Calculator = require('../models/Calculator');

/**
 * @route   POST /api/calculator/calculate
 * @desc    计算离职风险评估
 * @access  Public
 */
router.post('/calculate', async (req, res) => {
  try {
    const { userId, inputs } = req.body;
    
    if (!inputs) {
      return res.status(400).json({ error: '缺少计算参数' });
    }
    
    // 执行计算逻辑
    const result = calculateResignationRisk(inputs);
    
    // 如果有用户ID，保存记录
    if (userId) {
      const calculator = new Calculator({
        userId,
        inputs,
        result,
        isSaved: true
      });
      await calculator.save();
    }
    
    res.json({
      message: '计算完成',
      result
    });
  } catch (error) {
    console.error('计算失败:', error);
    res.status(500).json({ error: '计算失败' });
  }
});

/**
 * @route   GET /api/calculator/history
 * @desc    获取计算历史
 * @access  Public
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const skip = (page - 1) * limit;
    
    const records = await Calculator.find({ userId, isSaved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Calculator.countDocuments({ userId, isSaved: true });
    
    res.json({
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

/**
 * @route   GET /api/calculator/:id
 * @desc    获取单条计算记录
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const record = await Calculator.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({ record });
  } catch (error) {
    console.error('获取记录失败:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

/**
 * @route   DELETE /api/calculator/:id
 * @desc    删除计算记录
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const record = await Calculator.findOne({ _id: req.params.id, userId });
    if (!record) {
      return res.status(404).json({ error: '记录不存在或无权限' });
    }
    
    await Calculator.findByIdAndDelete(req.params.id);
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * @route   GET /api/calculator/questions
 * @desc    获取计算器问题列表
 * @access  Public
 */
router.get('/meta/questions', async (req, res) => {
  res.json({
    questions: [
      {
        id: 'age',
        type: 'number',
        label: '您的年龄',
        placeholder: '18-65',
        min: 18,
        max: 65,
        required: true
      },
      {
        id: 'city',
        type: 'select',
        label: '所在城市级别',
        options: ['一线城市', '二线城市', '三线城市', '四线及以下'],
        required: true
      },
      {
        id: 'savings',
        type: 'number',
        label: '您的存款可支撑（月）',
        placeholder: '例如：6个月',
        min: 0,
        required: true
      },
      {
        id: 'monthlyExpense',
        type: 'number',
        label: '每月支出',
        placeholder: '元/月',
        min: 0,
        required: true
      },
      {
        id: 'workYears',
        type: 'number',
        label: '工作年限',
        placeholder: '年',
        min: 0,
        required: true
      },
      {
        id: 'currentJobYears',
        type: 'number',
        label: '当前工作年限',
        placeholder: '年',
        min: 0,
        required: true
      },
      {
        id: 'factors',
        type: 'rate',
        label: '请为以下因素打分（1-10分）',
        items: [
          { id: 'stress', label: '工作压力' },
          { id: 'growth', label: '成长空间' },
          { id: 'satisfaction', label: '工作满意度' },
          { id: 'health', label: '健康影响' },
          { id: 'relationship', label: '人际关系' }
        ],
        min: 1,
        max: 10
      }
    ]
  });
});

// 计算逻辑
function calculateResignationRisk(inputs) {
  const { 
    age, 
    city, 
    savings, 
    monthlyExpense, 
    workYears, 
    currentJobYears, 
    factors 
  } = inputs;
  
  // 基础分数
  let score = 50;
  
  // 1. 年龄因素 (20-35岁是黄金期)
  if (age >= 20 && age <= 30) score += 15;
  else if (age > 30 && age <= 35) score += 10;
  else if (age > 35 && age <= 40) score += 0;
  else score -= 10;
  
  // 2. 存款缓冲（每月支出计算）
  const runway = savings;
  if (runway >= 12) score += 20;
  else if (runway >= 6) score += 10;
  else if (runway >= 3) score += 0;
  else score -= 15;
  
  // 3. 工作年限（稳定性考量）
  if (currentJobYears >= 2) score += 10;
  else if (currentJobYears >= 1) score += 5;
  else score -= 5; // 刚入职就离职不太好
  
  // 4. 城市因素（就业机会）
  const cityScores = {
    '一线城市': 10,
    '二线城市': 5,
    '三线城市': 0,
    '四线及以下': -5
  };
  score += cityScores[city] || 0;
  
  // 5. 各维度评分
  if (factors) {
    // 压力大减分
    score -= (factors.stress - 5) * 1.5;
    // 成长空间小减分
    score -= (10 - factors.growth) * 1;
    // 满意度低减分
    score -= (10 - factors.satisfaction) * 1.5;
    // 健康影响大减分
    score -= (factors.health - 5) * 2;
    // 人际关系差减分
    score -= (10 - factors.relationship) * 1;
  }
  
  // 确保分数在0-100之间
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // 确定风险等级
  let riskLevel, suggestion, bestTime;
  
  if (score >= 80) {
    riskLevel = '安全';
    suggestion = '当前状态良好，可以考虑寻找更好的机会！';
    bestTime = '随时可以行动，准备好简历就出发吧！';
  } else if (score >= 60) {
    riskLevel = '谨慎';
    suggestion = '整体情况尚可，但建议再做一些准备。';
    bestTime = '建议再积累一些经验或储蓄后再考虑。';
  } else if (score >= 40) {
    riskLevel = '警告';
    suggestion = '存在一定风险，建议谨慎决策。';
    bestTime = '建议等待更好的时机，先解决当前问题。';
  } else {
    riskLevel = '危险';
    suggestion = '当前不建议离职，风险较高！';
    bestTime = '强烈建议暂缓离职计划，先改善现状。';
  }
  
  return {
    score,
    riskLevel,
    suggestion,
    bestTime,
    runway
  };
}

module.exports = router;
