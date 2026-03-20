// pages/index/index.js
const app = getApp();

// API 基础地址
const API_BASE = 'http://localhost:3000/api';

Page({
  data: {
    greeting: '',
    hasDrawn: false,
    todayFortune: null,
    countdowns: [],
    hotPosts: []
  },

  onLoad() {
    this.setGreeting();
    this.loadTodayFortune();
    this.loadCountdowns();
    this.loadHotPosts();
  },

  onShow() {
    this.loadTodayFortune();
    this.loadCountdowns();
  },

  // 设置问候语
  setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 6) greeting = '夜深了';
    else if (hour < 9) greeting = '早上好';
    else if (hour < 12) greeting = '上午好';
    else if (hour < 14) greeting = '中午好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    this.setData({ greeting });
  },

  // 加载今日运势
  async loadTodayFortune() {
    try {
      const userId = app.globalData.userId || 'test_user';
      const res = await wx.request({
        url: `${API_BASE}/fortune/today`,
        method: 'GET',
        data: { userId }
      });
      
      if (res.data && res.data.hasDrawn) {
        this.setData({
          hasDrawn: true,
          todayFortune: res.data.fortune
        });
      } else {
        this.setData({
          hasDrawn: false,
          todayFortune: null
        });
      }
    } catch (error) {
      console.error('加载运势失败:', error);
      // 使用模拟数据作为 fallback
      this.setData({
        hasDrawn: true,
        todayFortune: {
          result: {
            level: '中签',
            content: '今日运势平平，保持平常心',
            advice: '按部就班，静待时机'
          }
        }
      });
    }
  },

  // 加载倒计时
  async loadCountdowns() {
    try {
      // Day1 使用模拟数据
      const mockCountdowns = [
        {
          _id: '1',
          title: '年终奖发放',
          targetDate: '2026-01-15',
          daysLeft: 290
        },
        {
          _id: '2',
          title: '离职日',
          targetDate: '2026-03-20',
          daysLeft: 365
        }
      ];
      
      this.setData({ countdowns: mockCountdowns });
    } catch (error) {
      console.error('加载倒计时失败:', error);
    }
  },

  // 加载热门帖子
  async loadHotPosts() {
    try {
      const res = await wx.request({
        url: `${API_BASE}/posts/hot`,
        method: 'GET',
        data: { limit: 5 }
      });
      
      if (res.data && res.data.posts) {
        const posts = res.data.posts.map(post => ({
          ...post,
          timeAgo: this.formatTimeAgo(post.createdAt)
        }));
        this.setData({ hotPosts: posts });
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      // 使用模拟数据作为 fallback
      this.setData({
        hotPosts: [
          {
            _id: '1',
            category: '吐槽',
            content: '今天老板又画饼了，说年底给我升职，我都来三年了...',
            stats: { likes: 128, comments: 45 },
            timeAgo: '2小时前'
          },
          {
            _id: '2',
            category: '求助',
            content: '想辞职但是存款只有3个月生活费，怎么办？',
            stats: { likes: 89, comments: 67 },
            timeAgo: '4小时前'
          }
        ]
      });
    }
  },

  // 格式化时间
  formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString();
  },

  // 跳转到运势页
  goToFortune() {
    wx.navigateTo({
      url: '/pages/fortune/fortune'
    });
  },

  // 跳转到计算器
  goToCalculator() {
    wx.navigateTo({
      url: '/calculator/pages/index/index'
    });
  },

  // 跳转到倒计时
  goToCountdown() {
    wx.navigateTo({
      url: '/countdown/pages/list/list'
    });
  },

  // 跳转到树洞
  goToTreehole() {
    wx.switchTab({
      url: '/posts/pages/list/list'
    });
  }
});
