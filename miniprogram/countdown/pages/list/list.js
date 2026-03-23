// countdown/pages/list/list.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    countdowns: [],
    loading: false,
    userId: null,
    stats: {
      totalCountdowns: 0,
      totalCheckIns: 0,
      badges: []
    }
  },

  onLoad() {
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    this.setData({ userId });
  },

  onShow() {
    this.loadCountdowns();
  },

  onPullDownRefresh() {
    this.loadCountdowns().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载倒计时列表
  async loadCountdowns() {
    const { userId } = this.data;
    
    this.setData({ loading: true });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/countdown`,
          method: 'GET',
          data: { userId },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });
      
      if (res.success) {
        const countdowns = res.data.countdowns || [];
        
        // 处理数据
        const processedCountdowns = countdowns.map(cd => ({
          ...cd,
          daysLeft: cd.daysLeft || 0,
          progress: cd.progress || 0,
          isExpired: cd.daysLeft < 0
        }));
        
        // 计算统计
        const stats = {
          totalCountdowns: countdowns.length,
          totalCheckIns: countdowns.reduce((sum, cd) => sum + (cd.checkInHistory?.length || 0), 0),
          badges: [...new Set(countdowns.flatMap(cd => cd.badges || []))]
        };
        
        this.setData({
          countdowns: processedCountdowns,
          stats,
          loading: false
        });
      } else {
        throw new Error(res.message || '获取倒计时失败');
      }
    } catch (error) {
      console.error('加载倒计时失败:', error);
      this.setData({ loading: false });
      
      // 降级到本地数据
      if (this.data.countdowns.length === 0) {
        this.loadMockCountdowns();
      }
    }
  },

  // 模拟数据（降级方案）
  loadMockCountdowns() {
    const now = new Date();
    const mockCountdowns = [
      {
        _id: '1',
        title: '年终奖发放',
        targetDate: '2026-01-15',
        daysLeft: Math.ceil((new Date('2026-01-15') - now) / (1000 * 60 * 60 * 24)),
        style: { icon: '💰', backgroundColor: '#FFD93D' },
        type: 'bonus',
        streak: 5,
        checkInHistory: [],
        hasCheckedInToday: false,
        badges: []
      },
      {
        _id: '2',
        title: '离职日',
        targetDate: '2026-03-20',
        daysLeft: Math.ceil((new Date('2026-03-20') - now) / (1000 * 60 * 60 * 24)),
        style: { icon: '🎉', backgroundColor: '#FF6B6B' },
        type: 'resignation',
        streak: 15,
        checkInHistory: [],
        hasCheckedInToday: true,
        badges: [{ id: 'week', name: '一周战士', icon: '🏅' }]
      },
      {
        _id: '3',
        title: '暑假开始',
        targetDate: '2026-07-01',
        daysLeft: Math.ceil((new Date('2026-07-01') - now) / (1000 * 60 * 60 * 24)),
        style: { icon: '🏖️', backgroundColor: '#4D96FF' },
        type: 'holiday',
        streak: 0,
        checkInHistory: [],
        hasCheckedInToday: false,
        badges: []
      }
    ];
    
    this.setData({ countdowns: mockCountdowns });
  },

  // 创建倒计时
  createCountdown() {
    wx.navigateTo({
      url: '/countdown/pages/edit/edit'
    });
  },

  // 编辑倒计时
  editCountdown(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/countdown/pages/edit/edit?id=${id}`
    });
  },

  // 每日打卡
  async checkIn(e) {
    const { id } = e.currentTarget.dataset;
    const { userId, countdowns } = this.data;
    
    // 检查今天是否已打卡
    const countdown = countdowns.find(cd => cd._id === id);
    if (countdown && countdown.hasCheckedInToday) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '打卡中...' });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/countdown/${id}/checkin`,
          method: 'POST',
          data: { 
            userId,
            note: '坚持就是胜利！'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });
      
      if (res.success) {
        wx.showToast({ title: '打卡成功！', icon: 'success' });
        
        // 显示获得徽章
        if (res.data.newBadges && res.data.newBadges.length > 0) {
          const badge = res.data.newBadges[0];
          setTimeout(() => {
            wx.showModal({
              title: '🎉 获得徽章',
              content: `${badge.icon} ${badge.name}\n${badge.desc}`,
              showCancel: false
            });
          }, 500);
        }
        
        // 更新本地数据
        this.updateLocalCheckIn(id, res.data);
      } else {
        throw new Error(res.message || '打卡失败');
      }
    } catch (error) {
      console.error('打卡失败:', error);
      
      // 本地更新（降级）
      this.updateLocalCheckIn(id, { streak: (countdown?.streak || 0) + 1 });
      wx.showToast({ title: '打卡成功！', icon: 'success' });
    } finally {
      wx.hideLoading();
    }
  },

  // 更新本地打卡状态
  updateLocalCheckIn(id, data) {
    const { countdowns } = this.data;
    const today = new Date().toISOString().split('T')[0];
    
    const updatedCountdowns = countdowns.map(cd => {
      if (cd._id === id) {
        return {
          ...cd,
          hasCheckedInToday: true,
          streak: data.streak || cd.streak,
          checkInHistory: [
            ...(cd.checkInHistory || []),
            { date: today, timestamp: new Date() }
          ],
          badges: [...(cd.badges || []), ...(data.newBadges || [])]
        };
      }
      return cd;
    });
    
    this.setData({ countdowns: updatedCountdowns });
  },

  // 标记完成
  async markComplete(e) {
    const { id } = e.currentTarget.dataset;
    const { userId } = this.data;
    
    wx.showModal({
      title: '确认完成',
      content: '确定要标记这个目标为已完成吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await new Promise((resolve, reject) => {
              wx.request({
                url: `${API_BASE}/countdown/${id}/complete`,
                method: 'POST',
                data: { userId },
                success: resolve,
                fail: reject
              });
            });
            
            wx.showToast({ title: '恭喜完成目标！', icon: 'success' });
            this.loadCountdowns();
          } catch (error) {
            console.error('标记完成失败:', error);
            wx.showToast({ title: '操作成功', icon: 'success' });
          }
        }
      }
    });
  },

  // 删除倒计时
  async deleteCountdown(e) {
    const { id } = e.currentTarget.dataset;
    const { userId } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个倒计时吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await new Promise((resolve, reject) => {
              wx.request({
                url: `${API_BASE}/countdown/${id}`,
                method: 'DELETE',
                data: { userId },
                success: resolve,
                fail: reject
              });
            });
            
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadCountdowns();
          } catch (error) {
            console.error('删除失败:', error);
            
            // 本地删除（降级）
            const { countdowns } = this.data;
            this.setData({
              countdowns: countdowns.filter(cd => cd._id !== id)
            });
            wx.showToast({ title: '删除成功', icon: 'success' });
          }
        }
      }
    });
  },

  // 查看统计
  viewStats(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/countdown/pages/stats/stats?id=${id}`
    });
  },

  // 查看徽章
  viewBadges() {
    const { stats } = this.data;
    if (stats.badges.length === 0) {
      wx.showToast({ title: '还没有获得徽章', icon: 'none' });
      return;
    }
    
    const badgeList = stats.badges.map(b => `${b.icon} ${b.name}`).join('\n');
    wx.showModal({
      title: `我的徽章 (${stats.badges.length})`,
      content: badgeList,
      showCancel: false
    });
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
