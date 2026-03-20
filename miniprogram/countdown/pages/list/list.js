// countdown/pages/list/list.js
Page({
  data: {
    countdowns: []
  },

  onLoad() {
    this.loadCountdowns();
  },

  onShow() {
    this.loadCountdowns();
  },

  loadCountdowns() {
    // Day1 模拟数据
    const now = new Date();
    const countdowns = [
      {
        _id: '1',
        title: '年终奖发放',
        targetDate: '2026-01-15',
        daysLeft: Math.ceil((new Date('2026-01-15') - now) / (1000 * 60 * 60 * 24)),
        style: { icon: '💰', backgroundColor: '#FFD93D' }
      },
      {
        _id: '2',
        title: '离职日',
        targetDate: '2026-03-20',
        daysLeft: Math.ceil((new Date('2026-03-20') - now) / (1000 * 60 * 60 * 24)),
        style: { icon: '🎉', backgroundColor: '#FF6B6B' }
      }
    ];
    this.setData({ countdowns });
  },

  createCountdown() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
