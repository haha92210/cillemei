// pages/fortune/fortune.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    fortune: null,
    loading: false,
    error: null,
    hasDrawn: false,
    userId: null
  },

  onLoad() {
    // 获取用户ID（从缓存或全局数据）
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    this.setData({ userId });
    this.loadFortune();
  },

  onPullDownRefresh() {
    this.loadFortune().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    const { fortune } = this.data;
    if (fortune) {
      return {
        title: `今日运势：${fortune.level} - ${fortune.content}`,
        path: '/pages/fortune/fortune',
        imageUrl: '/images/share-fortune.png'
      };
    }
    return {
      title: '辞了没 - 每日职场运势',
      path: '/pages/fortune/fortune'
    };
  },

  // 加载今日运势
  async loadFortune() {
    this.setData({ loading: true, error: null });
    
    try {
      const { userId } = this.data;
      const today = new Date().toISOString().split('T')[0];
      
      // 先检查本地缓存
      const cachedFortune = wx.getStorageSync('todayFortune');
      const cachedDate = wx.getStorageSync('fortuneDate');
      
      if (cachedFortune && cachedDate === today) {
        this.setData({
          fortune: cachedFortune,
          hasDrawn: true,
          loading: false
        });
        return;
      }
      
      // 从服务器获取
      const res = await this.fetchFortune(userId, today);
      
      if (res.success) {
        const fortune = res.data.fortune;
        this.setData({
          fortune,
          hasDrawn: true,
          loading: false
        });
        
        // 缓存到本地
        wx.setStorageSync('todayFortune', fortune);
        wx.setStorageSync('fortuneDate', today);
      } else {
        throw new Error(res.message || '获取运势失败');
      }
    } catch (error) {
      console.error('加载运势失败:', error);
      this.setData({
        error: error.message || '网络错误，请稍后重试',
        loading: false
      });
      
      // 使用本地算法生成（降级方案）
      this.generateLocalFortune();
    }
  },

  // 从服务器获取运势
  fetchFortune(userId, date) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/fortune/today`,
        method: 'GET',
        data: { userId, date },
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
  },

  // 抽签（重新生成）
  async drawFortune() {
    const { hasDrawn, fortune } = this.data;
    
    if (hasDrawn && fortune) {
      wx.showModal({
        title: '提示',
        content: '今日已抽签，是否重新抽取？',
        success: (res) => {
          if (res.confirm) {
            this.doDrawFortune();
          }
        }
      });
    } else {
      this.doDrawFortune();
    }
  },

  // 执行抽签
  async doDrawFortune() {
    this.setData({ loading: true });
    
    wx.showLoading({ title: '抽签中...' });
    
    try {
      const { userId } = this.data;
      
      // 调用服务器API生成运势
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/fortune/draw`,
          method: 'POST',
          data: { userId },
          success: (res) => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve(res.data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });
      
      if (res.success) {
        const fortune = res.data.fortune;
        const today = new Date().toISOString().split('T')[0];
        
        this.setData({
          fortune,
          hasDrawn: true,
          loading: false
        });
        
        // 更新缓存
        wx.setStorageSync('todayFortune', fortune);
        wx.setStorageSync('fortuneDate', today);
        
        wx.showToast({
          title: `抽到${fortune.level}！`,
          icon: 'success',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('抽签失败:', error);
      // 降级到本地生成
      this.generateLocalFortune();
      wx.showToast({
        title: '已生成本地运势',
        icon: 'success'
      });
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  // 本地生成运势（降级方案）
  generateLocalFortune() {
    const { userId } = this.data;
    const today = new Date().toISOString().split('T')[0];
    const seed = `${userId}_${today}`;
    
    // 简单的伪随机算法
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const rand = Math.abs(hash % 100);
    
    // 运势等级
    const levels = [
      { level: '上上签', min: 90, color: '#FF6B6B', desc: '鸿运当头' },
      { level: '上签', min: 75, color: '#4ECDC4', desc: '吉星高照' },
      { level: '中上签', min: 60, color: '#45B7D1', desc: '运势良好' },
      { level: '中签', min: 45, color: '#96CEB4', desc: '平平淡淡' },
      { level: '中下签', min: 30, color: '#FFEAA7', desc: '小有波折' },
      { level: '下签', min: 0, color: '#DDA0DD', desc: '时运不济' }
    ];
    
    const levelInfo = levels.find(l => rand >= l.min) || levels[levels.length - 1];
    
    // 文案库
    const contents = {
      '上上签': ['今日宜提离职，天时地利人和', '贵人相助，职场顺遂'],
      '上签': ['适合谈加薪，老板心情不错', '运势向好，把握机会'],
      '中上签': ['可以开始准备简历了', '时机渐近，提前布局'],
      '中签': ['今日宜低调苟住', '韬光养晦，等待时机'],
      '中下签': ['暂时按兵不动', '谨慎行事，避免冲动'],
      '下签': ['宜埋头做事，少言多做', '保存实力，静待转机']
    };
    
    const contentList = contents[levelInfo.level] || contents['中签'];
    const content = contentList[Math.abs(hash) % contentList.length];
    
    // 生成各维度评分
    const baseScore = Math.max(20, rand);
    const dimensions = {
      career: Math.min(100, Math.max(20, baseScore + (hash % 20) - 10)),
      wealth: Math.min(100, Math.max(20, baseScore + (hash % 30) - 15)),
      relationship: Math.min(100, Math.max(20, baseScore + (hash % 25) - 12)),
      resignation: Math.min(100, Math.max(20, baseScore + (hash % 35) - 20))
    };
    
    // 幸运色
    const colors = ['中国红', '富贵金', '天空蓝', '森林绿', '紫罗兰'];
    const luckyColor = colors[Math.abs(hash) % colors.length];
    
    // 幸运数字
    const luckyNumbers = [
      Math.abs(hash % 99) + 1,
      Math.abs((hash >> 4) % 99) + 1,
      Math.abs((hash >> 8) % 99) + 1
    ].sort((a, b) => a - b);
    
    const fortune = {
      date: today,
      level: levelInfo.level,
      levelScore: baseScore,
      levelColor: levelInfo.color,
      levelDesc: levelInfo.desc,
      content,
      advice: '根据实际情况理性决策',
      dimensions: {
        career: { score: dimensions.career, label: '事业运', desc: this.getDimensionDesc(dimensions.career) },
        wealth: { score: dimensions.wealth, label: '财运', desc: this.getDimensionDesc(dimensions.wealth) },
        relationship: { score: dimensions.relationship, label: '人际关系', desc: this.getDimensionDesc(dimensions.relationship) },
        resignation: { score: dimensions.resignation, label: '辞职指数', desc: this.getDimensionDesc(dimensions.resignation) }
      },
      luckyColor: { name: luckyColor },
      luckyNumbers,
      category: baseScore >= 80 ? 'resign' : baseScore >= 60 ? 'prepare' : baseScore >= 40 ? 'hold' : 'slack'
    };
    
    this.setData({
      fortune,
      hasDrawn: true,
      loading: false
    });
    
    wx.setStorageSync('todayFortune', fortune);
    wx.setStorageSync('fortuneDate', today);
  },

  // 获取维度描述
  getDimensionDesc(score) {
    if (score >= 90) return '极佳';
    if (score >= 80) return '很好';
    if (score >= 70) return '不错';
    if (score >= 60) return '一般';
    if (score >= 50) return '稍弱';
    return '低迷';
  },

  // 分享运势
  shareFortune() {
    const { fortune } = this.data;
    if (!fortune) {
      wx.showToast({ title: '请先抽签', icon: 'none' });
      return;
    }
    
    // 生成分享图片
    this.generateShareImage();
  },

  // 生成分享图片
  generateShareImage() {
    const { fortune } = this.data;
    const ctx = wx.createCanvasContext('shareCanvas');
    
    // 背景
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, 300, 400);
    
    // 标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(20);
    ctx.setTextAlign('center');
    ctx.fillText('今日职场运势', 150, 40);
    
    // 等级
    ctx.setFillStyle(fortune.levelColor || '#FF6B6B');
    ctx.setFontSize(36);
    ctx.fillText(fortune.level, 150, 90);
    
    // 内容
    ctx.setFillStyle('#666666');
    ctx.setFontSize(14);
    ctx.fillText(fortune.content, 150, 130);
    
    // 保存图片
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        success: (res) => {
          wx.previewImage({
            urls: [res.tempFilePath]
          });
        }
      });
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
