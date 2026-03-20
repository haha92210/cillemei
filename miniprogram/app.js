App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:3000/api',
    isLoggedIn: false
  },

  onLaunch() {
    console.log('辞了没小程序启动');
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
    }
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
  },

  // 全局登录方法
  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // TODO: 调用后端登录接口
            console.log('微信登录成功, code:', res.code);
            resolve(res.code);
          } else {
            reject(new Error('登录失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 全局请求封装
  request(options) {
    const { apiBaseUrl } = this.globalData;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBaseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.error || '请求失败'));
          }
        },
        fail: reject
      });
    });
  }
});
