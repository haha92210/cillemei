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
      return res.status(400).json({ 
        success: false,
        error: '缺少用户ID' 
      });
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
      // 检查今日是否已打卡
      const today = now.toISOString().split('T')[0];
      obj.hasCheckedInToday = cd.checkInHistory && cd.checkInHistory.some(
        h => h.date === today
      );
      return obj;
    });
    
    res.json({
      success: true,
      data: {
        countdowns: countdownsWithDays
      }
    });
  } catch (error) {
    console.error('获取倒计时失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取倒计时失败',
      message: error.message 
    });
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
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    if (!title || !targetDate) {
      return res.status(400).json({ 
        success: false,
        error: '标题和目标日期不能为空' 
      });
    }
    
    // 验证目标日期是否有效
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) {
      return res.status(400).json({
        success: false,
        error: '目标日期格式无效'
      });
    }
    
    const countdown = new Countdown({
      userId,
      title,
      type: type || 'custom',
      targetDate: target,
      targetTime: targetTime || '18:00',
      description: description || '',
      reminder: reminder || { enabled: true, daysBefore: [7, 3, 1] },
      status: 'active',
      checkInHistory: [],
      streak: 0,
      badges: []
    });
    
    await countdown.save();
    
    res.status(201).json({
      success: true,
      message: '创建成功',
      data: { countdown }
    });
  } catch (error) {
    console.error('创建倒计时失败:', error);
    res.status(500).json({ 
      success: false,
      error: '创建失败',
      message: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        error: '倒计时不存在或无权限' 
      });
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
      success: true,
      message: '更新成功',
      data: { countdown }
    });
  } catch (error) {
    console.error('更新倒计时失败:', error);
    res.status(500).json({ 
      success: false,
      error: '更新失败',
      message: error.message 
    });
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
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '请先登录'
      });
    }
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ 
        success: false,
        error: '倒计时不存在或无权限' 
      });
    }
    
    // 软删除
    countdown.status = 'cancelled';
    await countdown.save();
    
    res.json({ 
      success: true,
      message: '删除成功' 
    });
  } catch (error) {
    console.error('删除倒计时失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除失败',
      message: error.message 
    });
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
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '请先登录'
      });
    }
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ 
        success: false,
        error: '倒计时不存在或无权限' 
      });
    }
    
    countdown.status = 'completed';
    countdown.completedAt = new Date();
    
    // 颁发完成徽章
    const freedomBadge = {
      id: 'freedom',
      name: '自由人',
      icon: '🎉',
      desc: '达成目标，恭喜！',
      earnedAt: new Date()
    };
    if (!countdown.badges.some(b => b.id === 'freedom')) {
      countdown.badges.push(freedomBadge);
    }
    
    await countdown.save();
    
    res.json({
      success: true,
      message: '恭喜！目标已达成！',
      data: { countdown }
    });
  } catch (error) {
    console.error('标记完成失败:', error);
    res.status(500).json({ 
      success: false,
      error: '操作失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/countdown/:id/checkin
 * @desc    每日打卡
 * @access  Public
 */
router.post('/:id/checkin', async (req, res) => {
  try {
    const { userId, note } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '请先登录'
      });
    }
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ 
        success: false,
        error: '倒计时不存在或无权限' 
      });
    }
    
    if (countdown.status !== 'active') {
      return res.status(400).json({ 
        success: false,
        error: '倒计时已结束' 
      });
    }
    
    // 检查今天是否已打卡
    const alreadyCheckedIn = countdown.checkInHistory && countdown.checkInHistory.some(
      h => h.date === today
    );
    
    if (alreadyCheckedIn) {
      return res.status(400).json({ 
        success: false,
        error: '今日已打卡' 
      });
    }
    
    // 添加打卡记录
    countdown.checkInHistory.push({
      date: today,
      timestamp: new Date(),
      note: note || ''
    });
    
    // 计算连续打卡天数
    const streak = calculateStreak(countdown.checkInHistory);
    countdown.streak = streak;
    
    // 检查并颁发徽章
    const newBadges = checkAndAwardBadges(countdown);
    if (newBadges.length > 0) {
      countdown.badges.push(...newBadges);
    }
    
    await countdown.save();
    
    res.json({
      success: true,
      message: '打卡成功！',
      data: {
        streak: streak,
        totalDays: countdown.checkInHistory.length,
        badges: countdown.badges,
        newBadges: newBadges,
        hasCheckedInToday: true
      }
    });
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({ 
      success: false,
      error: '打卡失败',
      message: error.message 
    });
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
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }
    
    const countdown = await Countdown.findOne({ _id: req.params.id, userId });
    if (!countdown) {
      return res.status(404).json({ 
        success: false,
        error: '倒计时不存在' 
      });
    }
    
    const totalDays = countdown.checkInHistory ? countdown.checkInHistory.length : 0;
    const streak = countdown.streak || 0;
    
    // 计算剩余天数
    const now = new Date();
    const daysLeft = Math.ceil((new Date(countdown.targetDate) - now) / (1000 * 60 * 60 * 24));
    
    // 检查今日是否已打卡
    const today = now.toISOString().split('T')[0];
    const hasCheckedInToday = countdown.checkInHistory && countdown.checkInHistory.some(
      h => h.date === today
    );
    
    // 计算完成进度
    const startDate = countdown.createdAt;
    const targetDate = new Date(countdown.targetDate);
    const totalDuration = targetDate - startDate;
    const elapsed = now - startDate;
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    
    res.json({
      success: true,
      data: {
        totalDays: totalDays,
        streak: streak,
        daysLeft: daysLeft,
        progress: progress,
        hasCheckedInToday: hasCheckedInToday,
        badges: countdown.badges || [],
        checkInHistory: countdown.checkInHistory || []
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/countdown/meta/types
 * @desc    获取倒计时类型列表
 * @access  Public
 */
router.get('/meta/types', async (req, res) => {
  res.json({
    success: true,
    data: {
      types: [
        { id: 'resignation', name: '辞职倒计时', icon: '🎉', defaultTitle: '离职日', color: '#FF6B6B' },
        { id: 'bonus', name: '年终奖', icon: '💰', defaultTitle: '年终奖发放', color: '#FFD93D' },
        { id: 'promotion', name: '晋升评估', icon: '📈', defaultTitle: '晋升考核', color: '#6BCB77' },
        { id: 'holiday', name: '假期', icon: '🏖️', defaultTitle: '放假啦', color: '#4D96FF' },
        { id: 'custom', name: '自定义', icon: '📅', defaultTitle: '重要日子', color: '#9B59B6' }
      ]
    }
  });
});

// 辅助函数：计算连续打卡天数
function calculateStreak(history) {
  if (!history || history.length === 0) return 0;
  
  // 按日期降序排序
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 如果今天没打卡，昨天也没打卡，则连续天数为0
  if (sorted[0].date !== today && sorted[0].date !== yesterday) {
    return 0;
  }
  
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i-1].date);
    const currDate = new Date(sorted[i].date);
    const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// 辅助函数：检查并颁发徽章
function checkAndAwardBadges(countdown) {
  const newBadges = [];
  const totalDays = countdown.checkInHistory ? countdown.checkInHistory.length : 0;
  const streak = countdown.streak || 0;
  const existingBadgeIds = countdown.badges ? countdown.badges.map(b => b.id) : [];
  
  // 徽章定义
  const badgeDefinitions = [
    { id: 'first', name: '初次打卡', icon: '🌱', desc: '完成第一次打卡', condition: () => totalDays >= 1 },
    { id: 'week', name: '一周战士', icon: '🏅', desc: '累计打卡7天', condition: () => totalDays >= 7 },
    { id: 'month', name: '月度苟王', icon: '🥈', desc: '累计打卡30天', condition: () => totalDays >= 30 },
    { id: 'century', name: '百日忍者', icon: '🥇', desc: '累计打卡100天', condition: () => totalDays >= 100 },
    { id: 'streak3', name: '三日连击', icon: '⚡', desc: '连续3天不间断', condition: () => streak >= 3 },
    { id: 'streak7', name: '坚持者', icon: '🔥', desc: '连续7天不间断', condition: () => streak >= 7 },
    { id: 'streak30', name: '自律达人', icon: '👑', desc: '连续30天不间断', condition: () => streak >= 30 }
  ];
  
  badgeDefinitions.forEach(badge => {
    if (!existingBadgeIds.includes(badge.id) && badge.condition()) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        desc: badge.desc,
        earnedAt: new Date()
      });
    }
  });
  
  return newBadges;
}

module.exports = router;
