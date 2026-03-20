/**
 * 离职计算器路由
 * /api/calculator
 */

const express = require('express');
const router = express.Router();
const Calculator = require('../models/Calculator');
const { calculateResignationRisk, getRiskLevels, getCityCoefficients, getFamilyCoefficients } = require('../utils/calculatorLogic');

/**
 * @route   POST /api/calculator
 * @desc    计算离职风险评估（主接口）
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { userId, inputs } = req.body;
    
    if (!inputs) {
      return res.status(400).json({ 
        success: false,
        error: '缺少计算参数' 
      });
    }
    
    // 验证必要参数
    const { savings, monthlyExpense, city, family } = inputs;
    if (savings === undefined || monthlyExpense === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：savings（存款月数）和 monthlyExpense（月支出）'
      });
    }
    
    // 使用算法计算离职风险
    const calculationResult = calculateResignationRisk({
      savings: parseFloat(savings),
      monthlyExpense: parseFloat(monthlyExpense),
      city: city || '二线城市',
      family: family || '单身'
    });
    
    // 构建返回结果
    const result = {
      riskLevel: calculationResult.result.riskLevel,
      riskColor: calculationResult.result.riskColor,
      riskEmoji: calculationResult.result.riskEmoji,
      runwayMonths: calculationResult.result.runwayMonths,
      actualMonthlyExpense: calculationResult.result.actualMonthlyExpense,
      advice: calculationResult.result.advice,
      analysis: calculationResult.analysis
    };
    
    // 保存计算记录到数据库
    let savedRecord = null;
    if (userId) {
      const calculator = new Calculator({
        userId,
        inputs: {
          ...inputs,
          cityCoeff: calculationResult.inputs.cityCoeff,
          familyCoeff: calculationResult.inputs.familyCoeff
        },
        result: {
          score: Math.round(calculationResult.result.runwayMonths * 10), // 基于月数计算分数
          riskLevel: calculationResult.result.riskLevel,
          suggestion: calculationResult.result.advice,
          bestTime: calculationResult.analysis.summary,
          runway: calculationResult.result.runwayMonths
        },
        isSaved: true
      });
      savedRecord = await calculator.save();
    }
    
    res.json({
      success: true,
      message: '计算完成',
      data: {
        result,
        inputs: calculationResult.inputs,
        recordId: savedRecord ? savedRecord._id : null
      }
    });
  } catch (error) {
    console.error('计算失败:', error);
    res.status(500).json({ 
      success: false,
      error: '计算失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/calculator/calculate
 * @desc    计算离职风险评估（兼容旧接口）
 * @access  Public
 */
router.post('/calculate', async (req, res) => {
  try {
    const { userId, inputs } = req.body;
    
    if (!inputs) {
      return res.status(400).json({ 
        success: false,
        error: '缺少计算参数' 
      });
    }
    
    // 使用算法计算离职风险
    const calculationResult = calculateResignationRisk(inputs);
    const result = calculationResult.result;
    
    // 如果有用户ID，保存记录
    let savedRecord = null;
    if (userId) {
      const calculator = new Calculator({
        userId,
        inputs,
        result: {
          score: Math.round(result.runwayMonths * 10),
          riskLevel: result.riskLevel,
          suggestion: result.advice,
          bestTime: calculationResult.analysis.summary,
          runway: result.runwayMonths
        },
        isSaved: true
      });
      savedRecord = await calculator.save();
    }
    
    res.json({
      success: true,
      message: '计算完成',
      data: {
        result,
        analysis: calculationResult.analysis,
        recordId: savedRecord ? savedRecord._id : null
      }
    });
  } catch (error) {
    console.error('计算失败:', error);
    res.status(500).json({ 
      success: false,
      error: '计算失败',
      message: error.message 
    });
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
      return res.status(400).json({ 
        success: false,
        error: '缺少用户ID' 
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await Calculator.find({ userId, isSaved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Calculator.countDocuments({ userId, isSaved: true });
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取历史记录失败',
      message: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        error: '记录不存在' 
      });
    }
    
    res.json({ 
      success: true,
      data: { record } 
    });
  } catch (error) {
    console.error('获取记录失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取记录失败',
      message: error.message 
    });
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
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }
    
    const record = await Calculator.findOne({ _id: req.params.id, userId });
    if (!record) {
      return res.status(404).json({ 
        success: false,
        error: '记录不存在或无权限' 
      });
    }
    
    await Calculator.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: '删除成功' 
    });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/calculator/meta/config
 * @desc    获取计算器配置（风险等级、系数等）
 * @access  Public
 */
router.get('/meta/config', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        riskLevels: getRiskLevels(),
        cityCoefficients: getCityCoefficients(),
        familyCoefficients: getFamilyCoefficients()
      }
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取配置失败',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/calculator/meta/questions
 * @desc    获取计算器问题列表
 * @access  Public
 */
router.get('/meta/questions', async (req, res) => {
  res.json({
    success: true,
    data: {
      questions: [
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
          id: 'city',
          type: 'select',
          label: '所在城市级别',
          options: ['一线城市', '二线城市', '三线城市'],
          required: true
        },
        {
          id: 'family',
          type: 'select',
          label: '家庭情况',
          options: ['单身', '已婚', '有娃'],
          required: true
        }
      ]
    }
  });
});

module.exports = router;
