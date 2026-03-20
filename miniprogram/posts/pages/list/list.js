// posts/pages/list/list.js
Page({
  data: {
    currentTab: 'all',
    posts: []
  },

  onLoad() {
    this.loadPosts();
  },

  loadPosts() {
    // Day1 模拟数据
    this.setData({
      posts: [
        {
          _id: '1',
          anonymousId: '用户a1b2c3',
          category: '吐槽',
          content: '今天老板又画饼了，说年底给我升职，我都来三年了...',
          stats: { likes: 128, comments: 45 },
          timeAgo: '2小时前'
        },
        {
          _id: '2',
          anonymousId: '用户x9y8z7',
          category: '求助',
          content: '想辞职但是存款只有3个月生活费，怎么办？',
          stats: { likes: 89, comments: 67 },
          timeAgo: '4小时前'
        },
        {
          _id: '3',
          anonymousId: '用户m4n5o6',
          category: '分享',
          content: '终于离职了！给大家分享一些面试经验...',
          stats: { likes: 256, comments: 89 },
          timeAgo: '6小时前'
        }
      ]
    });
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  likePost(e) {
    wx.showToast({ title: '点赞成功', icon: 'success' });
  },

  createPost() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
