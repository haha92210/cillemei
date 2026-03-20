/**
 * 倒计时路由
 * /api/countdown
 */

const express = require('express');
const router = express.Router();
const Countdown = require('../models/Countdown');

/**
 * @route   GET /api/countdown
 * @desc    获取用户的倒计时列表
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const now = new Date();
    
    // 获取所有未过期的倒计时
    const countdowns = await Countdown.find({
      userId,
      status: { $in: ['active', 'completed'] },
      $or: [
        { targetDate: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        { status: 'active' }
      ]
    }).sort({ order: -1, targetDate: 1 });
    
    // 计算剩余天数
    const countdownsWithDays = countdowns.map(cd => {
      const obj = cd.toObject();
      const target = new Date(cd.targetDate);
      const diff = target - now;
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      obj.daysLeft = daysLeft;
      obj.isExpired = daysLeft < 0 && cd.status !== 'completed';
      return obj;
    });
    
    res.json({
      countdowns: countdownsWithDays
    });
  } catch (error) {
    console.error('获取倒计时失败:', error);
    res.status(500).json({ error: '获取倒计时失败' });
  }
});

/**
 * @route   POST /api/countdown
 * @desc    创建新倒计时
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { userId, title, type, targetDate, targetTime, description, reminder } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '请先登录' });
    }
    
    if (!title || !targetDate) {
      return res.status(400).json({ error: '标题和目标日期不能为空' });
    }
    
    const countdown = new Countdown({
      userId,
      title,
      type: type || 'custom',
      targetDate: new Date(targetDate),
      targetTime: targetTime || '18:00',
      description: description || '',
      reminder: reminder || { enabled: true, daysBefore: [7, 3, 1] },
      status: 'active'
    });
    
    await countdown.save();
    
    res.status(201).json({
      message: '创建成功',
      countdown
    });
  } catch (error) {
    console.error('创建倒计时失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * @route   PUT /api/countdown/:id
 * @desc    更新倒计时
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { userId, title, type, targetDate, targetTime, description, reminder, style, order } = req.body;
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ error: '倒计时不存在或无权限' });
    }
    
    if (title) countdown.title = title;
    if (type) countdown.type = type;
    if (targetDate) countdown.targetDate = new Date(targetDate);
    if (targetTime) countdown.targetTime = targetTime;
    if (description !== undefined) countdown.description = description;
    if (reminder) countdown.reminder = reminder;
    if (style) countdown.style = { ...countdown.style, ...style };
    if (order !== undefined) countdown.order = order;
    
    await countdown.save();
    
    res.json({
      message: '更新成功',
      countdown
    });
  } catch (error) {
    console.error('更新倒计时失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * @route   DELETE /api/countdown/:id
 * @desc    删除倒计时
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ error: '倒计时不存在或无权限' });
    }
    
    // 软删除
    countdown.status = 'cancelled';
    await countdown.save();
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除倒计时失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * @route   POST /api/countdown/:id/complete
 * @desc    标记倒计时完成
 * @access  Public
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ error: '倒计时不存在或无权限' });
    }
    
    countdown.status = 'completed';
    countdown.completedAt = new Date();
    await countdown.save();
    
    res.json({
      message: '恭喜！目标已达成！',
      countdown
    });
  } catch (error) {
    console.error('标记完成失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * @route   GET /api/countdown/types
 * @desc    获取倒计时类型列表
 * @access  Public
 */
router.get('/meta/types', async (req, res) => {
  res.json({
    types: [
      { id: 'resignation', name: '辞职倒计时', icon: '🎉', defaultTitle: '离职日', color: '#FF6B6B' },
      { id: 'bonus', name: '年终奖', icon: '💰', defaultTitle: '年终奖发放', color: '#FFD93D' },
      { id: 'promotion', name: '晋升评估', icon: '📈', defaultTitle: '晋升考核', color: '#6BCB77' },
      { id: 'holiday', name: '假期', icon: '🏖️', defaultTitle: '放假啦', color: '#4D96FF' },
      { id: 'custom', name: '自定义', icon: '📅', defaultTitle: '重要日子', color: '#9B59B6' }
    ]
  });
});

/**
 * @route   POST /api/countdown/:id/checkin
 * @desc    每日打卡
 * @access  Public
 */
router.post('/:id/checkin', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ error: '倒计时不存在或无权限' });
    }
    
    if (countdown.status !== 'active') {
      return res.status(400).json({ error: '倒计时已结束' });
    }
    
    // 检查今天是否已打卡
    const alreadyCheckedIn = countdown.checkInHistory && countdown.checkInHistory.some(
      h => h.date === today
    );
    
    if (alreadyCheckedIn) {
      return res.status(400).json({ error: '今日已打卡' });
    }
    
    // 添加打卡记录
    if (!countdown.checkInHistory) {
      countdown.checkInHistory = [];
    }
    
    countdown.checkInHistory.push({
      date: today,
      timestamp: new Date()
    });
    
    // 计算连续打卡天数
    let streak = 1;
    const history = countdown.checkInHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    for (let i = 1; i < history.length; i++) {
      const prevDate = new Date(history[i-1].date);
      const currDate = new Date(history[i].date);
      const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    countdown.streak = streak;
    await countdown.save();
    
    // 检查徽章
    const badges = checkBadges(countdown);
    
    res.json({
      message: '打卡成功！',
      streak: streak,
      totalDays: countdown.checkInHistory.length,
      badges: badges
    });
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({ error: '打卡失败' });
  }
});

/**
 * @route   GET /api/countdown/:id/stats
 * @desc    获取倒计时统计
 * @access  Public
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ error: '倒计时不存在' });
    }
    
    const totalDays = countdown.checkInHistory ? countdown.checkInHistory.length : 0;
    const streak = countdown.streak || 0;
    const badges = checkBadges(countdown);
    
    // 计算剩余天数
    const daysLeft = Math.ceil((new Date(countdown.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    res.json({
      totalDays: totalDays,
      streak: streak,
      daysLeft: daysLeft,
      badges: badges,
      checkInHistory: countdown.checkInHistory || []
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 检查徽章
function checkBadges(countdown) {
  const badges = [];
  const totalDays = countdown.checkInHistory ? countdown.checkInHistory.length : 0;
  const streak = countdown.streak || 0;
  
  if (totalDays >= 7) {
    badges.push({ id: 'week', name: '一周战士', icon: '🏅', desc: '连续打卡7天' });
  }
  if (totalDays >= 30) {
    badges.push({ id: 'month', name: '月度苟王', icon: '🥈', desc: '连续打卡30天' });
  }
  if (totalDays >= 100) {
    badges.push({ id: 'century', name: '百日忍者', icon: '🥇', desc: '连续打卡100天' });
  }
  if (streak >= 7) {
    badges.push({ id: 'streak7', name: '坚持者', icon: '🔥', desc: '连续7天不间断' });
  }
  if (countdown.status === 'completed') {
    badges.push({ id: 'freedom', name: '自由人', icon: '🎉', desc: '达成目标' });
  }
  
  return badges;
}

module.exports = router;
