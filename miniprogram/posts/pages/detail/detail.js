// posts/pages/detail/detail.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    postId: null,
    post: null,
    loading: false,
    commentText: '',
    userId: null,
    replyingTo: null, // 正在回复的评论
    likedPosts: [],
    likedComments: []
  },

  onLoad(options) {
    const postId = options.id;
    if (!postId) {
      wx.showToast({ title: '帖子ID错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    const likedPosts = wx.getStorageSync('likedPosts') || [];
    const likedComments = wx.getStorageSync('likedComments') || [];
    
    this.setData({
      postId,
      userId,
      likedPosts,
      likedComments
    });
    
    this.loadPostDetail();
  },

  onPullDownRefresh() {
    this.loadPostDetail().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    const { post } = this.data;
    if (post) {
      return {
        title: `${post.anonymousId}: ${post.content.slice(0, 30)}...`,
        path: `/posts/pages/detail/detail?id=${post._id}`
      };
    }
    return {
      title: '树洞详情',
      path: '/posts/pages/list/list'
    };
  },

  // 加载帖子详情
  async loadPostDetail() {
    const { postId, userId } = this.data;
    
    this.setData({ loading: true });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${postId}`,
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
        const post = res.data.post;
        post.isLiked = this.data.likedPosts.includes(post._id);
        
        // 处理评论
        if (post.comments) {
          post.comments = post.comments.map(comment => ({
            ...comment,
            isLiked: this.data.likedComments.includes(comment._id),
            timeAgo: this.formatTimeAgo(comment.createdAt)
          }));
        }
        
        post.timeAgo = this.formatTimeAgo(post.createdAt);
        
        this.setData({ post, loading: false });
      } else {
        throw new Error(res.message || '获取帖子失败');
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      this.setData({ loading: false });
      
      // 降级到模拟数据
      this.loadMockPost();
    }
  },

  // 模拟帖子数据（降级方案）
  loadMockPost() {
    const mockPost = {
      _id: this.data.postId,
      anonymousId: '用户a1b2c3',
      category: '吐槽',
      mood: '😤',
      content: '今天老板又画饼了，说年底给我升职，我都来三年了...\n\n每次开会都是"好好干，年底不会亏待你"，结果年终奖就发了半个月工资。真的心累了，不知道还要不要继续相信。',
      stats: { likes: 128, comments: 3, views: 520, sameHere: 15 },
      timeAgo: '2小时前',
      isLiked: false,
      comments: [
        {
          _id: 'c1',
          anonymousId: '用户d4e5f6',
          content: '同病相怜，我这也是天天画饼',
          likes: 12,
          isLiked: false,
          timeAgo: '1小时前'
        },
        {
          _id: 'c2',
          anonymousId: '用户g7h8i9',
          content: '建议骑驴找马，不要相信口头承诺',
          likes: 8,
          isLiked: false,
          timeAgo: '30分钟前'
        },
        {
          _id: 'c3',
          anonymousId: '用户j0k1l2',
          content: '我就是信了三年，结果毛都没有',
          likes: 5,
          isLiked: false,
          timeAgo: '10分钟前'
        }
      ]
    };
    
    this.setData({ post: mockPost });
  },

  // 点赞帖子
  async likePost() {
    const { post, userId, likedPosts } = this.data;
    
    if (likedPosts.includes(post._id)) {
      wx.showToast({ title: '已经赞过了', icon: 'none' });
      return;
    }
    
    // 本地更新
    const updatedPost = {
      ...post,
      stats: { ...post.stats, likes: post.stats.likes + 1 },
      isLiked: true
    };
    
    const updatedLikedPosts = [...likedPosts, post._id];
    
    this.setData({
      post: updatedPost,
      likedPosts: updatedLikedPosts
    });
    
    wx.setStorageSync('likedPosts', updatedLikedPosts);
    
    // 同步到服务器
    try {
      await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${post._id}/like`,
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
  async sameHere() {
    const { post, userId } = this.data;
    
    const updatedPost = {
      ...post,
      stats: { ...post.stats, sameHere: (post.stats.sameHere || 0) + 1 }
    };
    
    this.setData({ post: updatedPost });
    
    try {
      await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${post._id}/same`,
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

  // 输入评论
  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 回复评论
  replyComment(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      replyingTo: { id, name },
      commentText: `回复 ${name}: `
    });
  },

  // 取消回复
  cancelReply() {
    this.setData({
      replyingTo: null,
      commentText: ''
    });
  },

  // 提交评论
  async submitComment() {
    const { postId, commentText, userId, replyingTo } = this.data;
    
    if (!commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '发送中...' });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/posts/${postId}/comments`,
          method: 'POST',
          data: {
            userId,
            content: commentText.trim(),
            replyTo: replyingTo ? replyingTo.id : null,
            replyToName: replyingTo ? replyingTo.name : null
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
        wx.showToast({ title: '评论成功', icon: 'success' });
        this.setData({
          commentText: '',
          replyingTo: null
        });
        this.loadPostDetail(); // 刷新帖子详情
      }
    } catch (error) {
      console.error('评论失败:', error);
      
      // 本地添加评论（降级）
      this.addLocalComment();
    } finally {
      wx.hideLoading();
    }
  },

  // 本地添加评论（降级方案）
  addLocalComment() {
    const { post, commentText, userId, replyingTo } = this.data;
    
    const newComment = {
      _id: 'local_' + Date.now(),
      anonymousId: '我',
      content: replyingTo ? commentText.replace(`回复 ${replyingTo.name}: `, '') : commentText,
      likes: 0,
      isLiked: false,
      timeAgo: '刚刚',
      replyToName: replyingTo ? replyingTo.name : null
    };
    
    const updatedPost = {
      ...post,
      comments: [...(post.comments || []), newComment],
      stats: { ...post.stats, comments: (post.stats.comments || 0) + 1 }
    };
    
    this.setData({
      post: updatedPost,
      commentText: '',
      replyingTo: null
    });
    
    wx.showToast({ title: '评论成功', icon: 'success' });
  },

  // 点赞评论
  async likeComment(e) {
    const { id } = e.currentTarget.dataset;
    const { post, likedComments } = this.data;
    
    if (likedComments.includes(id)) {
      wx.showToast({ title: '已经赞过了', icon: 'none' });
      return;
    }
    
    // 本地更新
    const updatedComments = post.comments.map(comment => {
      if (comment._id === id) {
        return { ...comment, likes: (comment.likes || 0) + 1, isLiked: true };
      }
      return comment;
    });
    
    const updatedLikedComments = [...likedComments, id];
    
    this.setData({
      'post.comments': updatedComments,
      likedComments: updatedLikedComments
    });
    
    wx.setStorageSync('likedComments', updatedLikedComments);
    
    wx.showToast({ title: '点赞成功', icon: 'success' });
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
  },

  // 返回列表
  goBack() {
    wx.navigateBack();
  }
});
