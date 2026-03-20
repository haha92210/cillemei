/**
 * 运势相关路由
 * /api/fortune
 */

const express = require('express');
const router = express.Router();
const Fortune = require('../models/Fortune');

/**
 * @route   GET /api/fortune/today
 * @desc    获取今日运势
 * @access  Public
 */
router.get('/today', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const fortune = await Fortune.findOne({
      userId,
      drawDate: today
    });
    
    if (!fortune) {
      return res.json({
        hasDrawn: false,
        message: '今日还未抽签'
      });
    }
    
    res.json({
      hasDrawn: true,
      fortune
    });
  } catch (error) {
    console.error('获取今日运势失败:', error);
    res.status(500).json({ error: '获取运势失败' });
  }
});

/**
 * @route   POST /api/fortune/draw
 * @desc    抽取今日运势
 * @access  Public
 */
router.post('/draw', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已抽签
    const existing = await Fortune.findOne({ userId, drawDate: today });
    if (existing) {
      return res.status(400).json({ 
        error: '今日已抽签，明天再来吧',
        fortune: existing
      });
    }
    
    // 生成运势结果（Day1 使用模拟数据）
    const levels = ['上上签', '上签', '中上签', '中签', '中下签', '下签'];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    
    const fortuneData = {
      userId,
      drawDate: today,
      result: {
        level: randomLevel,
        title: '今日职场运势',
        content: generateFortuneContent(randomLevel),
        advice: generateAdvice(randomLevel)
      },
      details: {
        career: { score: randomScore(), desc: '事业运' },
        wealth: { score: randomScore(), desc: '财运' },
        relationship: { score: randomScore(), desc: '人际关系' },
        resignation: { score: randomScore(), desc: '辞职指数' }
      }
    };
    
    const fortune = new Fortune(fortuneData);
    await fortune.save();
    
    res.json({
      message: '抽签成功',
      fortune
    });
  } catch (error) {
    console.error('抽签失败:', error);
    res.status(500).json({ error: '抽签失败' });
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
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const skip = (page - 1) * limit;
    
    const fortunes = await Fortune.find({ userId })
      .sort({ drawDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Fortune.countDocuments({ userId });
    
    res.json({
      fortunes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取运势历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
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
    
    const fortune = await Fortune.findOneAndUpdate(
      { userId, drawDate: date },
      { shared: true },
      { new: true }
    );
    
    if (!fortune) {
      return res.status(404).json({ error: '未找到运势记录' });
    }
    
    res.json({ message: '分享成功', fortune });
  } catch (error) {
    console.error('分享运势失败:', error);
    res.status(500).json({ error: '分享失败' });
  }
});

// 辅助函数
function randomScore() {
  return Math.floor(Math.random() * 40) + 60; // 60-100
}

function generateFortuneContent(level) {
  const contents = {
    '上上签': '今日运势极佳，适合大胆行动，把握机会！',
    '上签': '运势良好，工作顺利，心情愉快。',
    '中上签': '整体运势不错，小有收获，保持积极。',
    '中签': '运势平稳，按部就班，稳扎稳打。',
    '中下签': '略有波折，保持耐心，静待时机。',
    '下签': '今日需谨慎，避免冲动决策，多休息。'
  };
  return contents[level] || '平平淡淡才是真。';
}

function generateAdvice(level) {
  const advices = {
    '上上签': '今天适合提加薪、谈项目、大胆表现！',
    '上签': '可以主动争取机会，展现你的能力。',
    '中上签': '保持现状，适度努力即可。',
    '中签': '专注本职工作，不宜激进。',
    '中下签': '少说话多做事，避免与同事冲突。',
    '下签': '今天适合低调，重要决定改日再做。'
  };
  return advices[level] || '保持平常心。';
}

module.exports = router;
