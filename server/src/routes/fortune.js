/**
 * 运势相关路由
 * /api/fortune
 */

const express = require('express');
const router = express.Router();
const Fortune = require('../models/Fortune');
const { generateDailyFortune } = require('../utils/fortuneAlgorithm');

/**
 * @route   GET /api/fortune/today
 * @desc    获取今日运势
 * @access  Public
 */
router.get('/today', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '缺少用户ID' 
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const fortune = await Fortune.findOne({
      userId,
      drawDate: today
    });
    
    if (!fortune) {
      return res.json({
        success: true,
        data: {
          hasDrawn: false,
          message: '今日还未抽签'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        hasDrawn: true,
        fortune
      }
    });
  } catch (error) {
    console.error('获取今日运势失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取运势失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/fortune/draw
 * @desc    抽取今日运势（使用算法生成一致运势）
 * @access  Public
 */
router.post('/draw', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '缺少用户ID' 
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已抽签
    const existing = await Fortune.findOne({ userId, drawDate: today });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: '今日已抽签，明天再来吧',
        data: { fortune: existing }
      });
    }
    
    // 使用算法生成运势（基于日期+用户ID生成一致的运势）
    const fortuneResult = generateDailyFortune(userId, today);
    
    // 构建完整的运势数据
    const fortuneData = {
      userId,
      drawDate: today,
      result: {
        level: fortuneResult.level,
        title: `今日运势 - ${fortuneResult.level}`,
        content: fortuneResult.content,
        advice: fortuneResult.advice
      },
      details: {
        career: { 
          score: fortuneResult.dimensions.career.score, 
          desc: `${fortuneResult.dimensions.career.label}：${fortuneResult.dimensions.career.desc}` 
        },
        wealth: { 
          score: fortuneResult.dimensions.wealth.score, 
          desc: `${fortuneResult.dimensions.wealth.label}：${fortuneResult.dimensions.wealth.desc}` 
        },
        relationship: { 
          score: fortuneResult.dimensions.relationship.score, 
          desc: `${fortuneResult.dimensions.relationship.label}：${fortuneResult.dimensions.relationship.desc}` 
        },
        resignation: { 
          score: fortuneResult.dimensions.resignation.score, 
          desc: `${fortuneResult.dimensions.resignation.label}：${fortuneResult.dimensions.resignation.desc}` 
        }
      },
      // 扩展字段（用于前端展示）
      ext: {
        overallScore: fortuneResult.overallScore,
        levelColor: fortuneResult.levelColor,
        levelDesc: fortuneResult.levelDesc,
        category: fortuneResult.category,
        luckyColor: fortuneResult.luckyColor,
        luckyNumbers: fortuneResult.luckyNumbers,
        luckyDirection: fortuneResult.luckyDirection,
        luckyHour: fortuneResult.luckyHour,
        suitable: fortuneResult.suitable,
        avoid: fortuneResult.avoid
      }
    };
    
    const fortune = new Fortune(fortuneData);
    await fortune.save();
    
    res.json({
      success: true,
      message: '抽签成功',
      data: {
        fortune,
        fullResult: fortuneResult
      }
    });
  } catch (error) {
    console.error('抽签失败:', error);
    res.status(500).json({ 
      success: false,
      error: '抽签失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/fortune/history
 * @desc    获取历史运势记录
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
    
    const skip = (page - 1) * limit;
    
    const fortunes = await Fortune.find({ userId })
      .sort({ drawDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Fortune.countDocuments({ userId });
    
    res.json({
      success: true,
      data: {
        fortunes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取运势历史失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取历史记录失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/fortune/share
 * @desc    分享运势
 * @access  Public
 */
router.post('/share', async (req, res) => {
  try {
    const { userId, date } = req.body;
    
    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID或日期'
      });
    }
    
    const fortune = await Fortune.findOneAndUpdate(
      { userId, drawDate: date },
      { shared: true },
      { new: true }
    );
    
    if (!fortune) {
      return res.status(404).json({ 
        success: false,
        error: '未找到运势记录' 
      });
    }
    
    res.json({ 
      success: true,
      message: '分享成功', 
      data: { fortune } 
    });
  } catch (error) {
    console.error('分享运势失败:', error);
    res.status(500).json({ 
      success: false,
      error: '分享失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/fortune/detail/:date
 * @desc    获取指定日期的运势详情
 * @access  Public
 */
router.get('/detail/:date', async (req, res) => {
  try {
    const { userId } = req.query;
    const { date } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }
    
    const fortune = await Fortune.findOne({ userId, drawDate: date });
    
    if (!fortune) {
      return res.status(404).json({
        success: false,
        error: '未找到该日期的运势记录'
      });
    }
    
    res.json({
      success: true,
      data: { fortune }
    });
  } catch (error) {
    console.error('获取运势详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取运势详情失败',
      message: error.message
    });
  }
});

module.exports = router;
