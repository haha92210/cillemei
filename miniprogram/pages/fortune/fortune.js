// pages/fortune/fortune.js
Page({
  data: {
    fortune: null
  },

  onLoad() {
    this.loadFortune();
  },

  loadFortune() {
    // Day1 模拟数据
    this.setData({
      fortune: {
        result: {
          level: '上签',
          title: '今日职场运势',
          content: '今天适合谈谈加薪，老板心情不错~',
          advice: '把握机会，主动出击'
        },
        details: {
          career: { score: 85, desc: '事业运' },
          wealth: { score: 78, desc: '财运' },
          relationship: { score: 82, desc: '人际关系' },
          resignation: { score: 65, desc: '辞职指数' }
        }
      }
    });
  },

  drawFortune() {
    wx.showToast({
      title: '抽签成功',
      icon: 'success'
    });
    this.loadFortune();
  },

  goBack() {
    wx.navigateBack();
  }
});
