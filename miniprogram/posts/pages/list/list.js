// posts/pages/list/list.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    currentTab: 'all',
    tabs: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: '吐槽', name: '吐槽', icon: '😤' },
      { id: '求助', name: '求助', icon: '🆘' },
      { id: '分享', name: '分享', icon: '📢' },
      { id: '树洞', name: '树洞', icon: '🌳' }
    ],
    posts: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    sort: 'newest', // newest, hottest
    userId: null,
    likedPosts: [] // 已点赞的帖子ID
  },

  onLoad() {
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    const likedPosts = wx.getStorageSync('likedPosts') || [];
    this.setData({ userId, likedPosts });
    this.loadPosts();
  },

  onShow() {
    // 刷新列表
    this.refreshPosts();
  },

  onPullDownRefresh() {
    this.refreshPosts().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMorePosts();
    }
  },

  // 刷新帖子列表
  refreshPosts() {
    this.setData({ page: 1, posts: [], hasMore: true });
    return this.loadPosts();
  },

  // 加载帖子列表
  async loadPosts() {
    const { currentTab, page, limit, sort, userId } = this.data;
    
    this.setData({ loading: true });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts`,
          method: 'GET',
          data: {
            category: currentTab === 'all' ? '' : currentTab,
            page,
            limit,
            sort,
            userId
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
        const { posts, pagination } = res.data;
        
        // 处理时间显示
        const processedPosts = posts.map(post => ({
          ...post,
          timeAgo: this.formatTimeAgo(post.createdAt),
          isLiked: this.data.likedPosts.includes(post._id)
        }));
        
        this.setData({
          posts: page === 1 ? processedPosts : [...this.data.posts, ...processedPosts],
          hasMore: page < pagination.pages,
          loading: false
        });
      } else {
        throw new Error(res.message || '获取帖子失败');
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      this.setData({ loading: false });
      
      // 降级到模拟数据
      if (this.data.posts.length === 0) {
        this.loadMockPosts();
      }
      
      wx.showToast({
        title: '加载失败，使用本地数据',
        icon: 'none'
      });
    }
  },

  // 加载更多
  loadMorePosts() {
    const { page, hasMore } = this.data;
    if (hasMore) {
      this.setData({ page: page + 1 }, () => {
        this.loadPosts();
      });
    }
  },

  // 模拟数据（降级方案）
  loadMockPosts() {
    const mockPosts = [
      {
        _id: '1',
        anonymousId: '用户a1b2c3',
        category: '吐槽',
        content: '今天老板又画饼了，说年底给我升职，我都来三年了...',
        stats: { likes: 128, comments: 45, views: 520 },
        timeAgo: '2小时前',
        mood: '😤',
        isLiked: false
      },
      {
        _id: '2',
        anonymousId: '用户x9y8z7',
        category: '求助',
        content: '想辞职但是存款只有3个月生活费，怎么办？',
        stats: { likes: 89, comments: 67, views: 380 },
        timeAgo: '4小时前',
        mood: '😰',
        isLiked: false
      },
      {
        _id: '3',
        anonymousId: '用户m4n5o6',
        category: '分享',
        content: '终于离职了！给大家分享一些面试经验...',
        stats: { likes: 256, comments: 89, views: 1200 },
        timeAgo: '6小时前',
        mood: '🎉',
        isLiked: false
      },
      {
        _id: '4',
        anonymousId: '用户p7q8r9',
        category: '树洞',
        content: '每天加班到深夜，感觉身体快撑不住了，但又不敢辞职...',
        stats: { likes: 45, comments: 23, views: 210 },
        timeAgo: '1小时前',
        mood: '😔',
        isLiked: false
      }
    ];
    
    this.setData({ posts: mockPosts });
  },

  // 切换分类
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.currentTab) {
      this.setData({ currentTab: tab }, () => {
        this.refreshPosts();
      });
    }
  },

  // 切换排序
  switchSort(e) {
    const sort = e.currentTarget.dataset.sort;
    if (sort !== this.data.sort) {
      this.setData({ sort }, () => {
        this.refreshPosts();
      });
    }
  },

  // 点赞
  async likePost(e) {
    const { id } = e.currentTarget.dataset;
    const { posts, userId, likedPosts } = this.data;
    
    // 检查是否已点赞
    if (likedPosts.includes(id)) {
      wx.showToast({ title: '已经赞过了', icon: 'none' });
      return;
    }
    
    // 本地更新
    const updatedPosts = posts.map(post => {
      if (post._id === id) {
        return {
          ...post,
          stats: { ...post.stats, likes: post.stats.likes + 1 },
          isLiked: true
        };
      }
      return post;
    });
    
    const updatedLikedPosts = [...likedPosts, id];
    
    this.setData({
      posts: updatedPosts,
      likedPosts: updatedLikedPosts
    });
    
    wx.setStorageSync('likedPosts', updatedLikedPosts);
    
    // 发送到服务器
    try {
      await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${id}/like`,
          method: 'POST',
          data: { userId },
          success: resolve,
          fail: reject
        });
      });
    } catch (error) {
      console.error('点赞同步失败:', error);
    }
    
    wx.showToast({ title: '点赞成功', icon: 'success' });
  },

  // 我也一样
  async sameHere(e) {
    const { id } = e.currentTarget.dataset;
    const { posts, userId } = this.data;
    
    // 本地更新
    const updatedPosts = posts.map(post => {
      if (post._id === id) {
        return {
          ...post,
          stats: { ...post.stats, sameHere: (post.stats.sameHere || 0) + 1 }
        };
      }
      return post;
    });
    
    this.setData({ posts: updatedPosts });
    
    // 发送到服务器
    try {
      await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${id}/same`,
          method: 'POST',
          data: { userId },
          success: resolve,
          fail: reject
        });
      });
    } catch (error) {
      console.error('同步失败:', error);
    }
    
    wx.showToast({ title: '我也一样', icon: 'success' });
  },

  // 查看详情
  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/posts/pages/detail/detail?id=${id}`
    });
  },

  // 创建帖子
  createPost() {
    wx.navigateTo({
      url: '/posts/pages/create/create'
    });
  },

  // 查看热榜
  viewHot() {
    wx.navigateTo({
      url: '/posts/pages/hot/hot'
    });
  },

  // 格式化时间
  formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
});
