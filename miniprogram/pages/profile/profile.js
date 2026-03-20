// pages/profile/profile.js
Page({
  data: {
    userId: 'USER001',
    stats: {
      fortuneCount: 12,
      postCount: 3,
      calculatorCount: 5
    },
    settings: {
      notifications: true
    }
  },

  onLoad() {
    // 页面加载
  },

  goToHistory() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToMyPosts() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToCalculatorHistory() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  toggleNotification(e) {
    this.setData({
      'settings.notifications': e.detail.value
    });
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage();
          wx.showToast({ title: '清除成功' });
        }
      }
    });
  },

  about() {
    wx.showModal({
      title: '关于辞了没',
      content: '辞了没 v1.0.0\n\n一个帮助职场人理性决策的小程序',
      showCancel: false
    });
  }
});
