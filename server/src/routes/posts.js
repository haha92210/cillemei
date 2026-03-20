/**
 * 树洞帖子路由
 * /api/posts
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

/**
 * @route   GET /api/posts
 * @desc    获取帖子列表
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 10,
      sort = 'newest'  // newest, hottest
    } = req.query;
    
    const query = { status: 'active' };
    if (category && category !== 'all') {
      query.category = category;
    }
    
    let sortOption = {};
    if (sort === 'hottest') {
      sortOption = { 'stats.likes': -1, createdAt: -1 };
    } else {
      sortOption = { isPinned: -1, createdAt: -1 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find(query)
      .populate('userId', 'nickName avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Post.countDocuments(query);
    
    // 匿名处理
    const anonymousPosts = posts.map(post => {
      const postObj = post.toObject();
      const userId = postObj.userId;
      postObj.userId = undefined;
      postObj.anonymousId = userId ? `用户${userId._id.toString().slice(-6)}` : '匿名用户';
      return postObj;
    });
    
    res.json({
      success: true,
      data: {
        posts: anonymousPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取帖子失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/posts/hot
 * @desc    热榜（按点赞数排序）
 * @access  Public
 */
router.get('/hot', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const posts = await Post.find({ status: 'active' })
      .populate('userId', 'nickName avatarUrl')
      .sort({ 'stats.likes': -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    // 匿名处理
    const anonymousPosts = posts.map(post => {
      const postObj = post.toObject();
      const userId = postObj.userId;
      postObj.userId = undefined;
      postObj.anonymousId = userId ? `用户${userId._id.toString().slice(-6)}` : '匿名用户';
      return postObj;
    });
    
    res.json({
      success: true,
      data: {
        posts: anonymousPosts,
        total: anonymousPosts.length
      }
    });
  } catch (error) {
    console.error('获取热榜失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取热榜失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    获取单条帖子详情
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'nickName avatarUrl');
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    // 增加浏览量
    post.stats.views += 1;
    await post.save();
    
    // 匿名处理
    const postObj = post.toObject();
    const userId = postObj.userId;
    postObj.userId = undefined;
    postObj.anonymousId = userId ? `用户${userId._id.toString().slice(-6)}` : '匿名用户';
    
    // 评论匿名处理
    if (postObj.comments && postObj.comments.length > 0) {
      postObj.comments = postObj.comments.map(comment => {
        const commentObj = comment;
        if (comment.userId) {
          commentObj.anonymousId = `用户${comment.userId.toString().slice(-6)}`;
          commentObj.userId = undefined;
        }
        return commentObj;
      });
    }
    
    res.json({ 
      success: true,
      data: { post: postObj } 
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取帖子详情失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/posts
 * @desc    发布新帖子
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { userId, content, category = '吐槽', tags = [], mood = '😐' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '内容不能为空' 
      });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: '内容不能超过1000字' 
      });
    }
    
    const post = new Post({
      userId,
      content: content.trim(),
      category,
      mood,
      tags: tags.slice(0, 5) // 最多5个标签
    });
    
    await post.save();
    
    res.status(201).json({
      success: true,
      message: '发布成功',
      data: { post }
    });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ 
      success: false,
      error: '发布失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/posts/:id/comments
 * @desc    添加评论
 * @access  Public
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, replyTo, replyToName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '评论内容不能为空' 
      });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ 
        success: false,
        error: '评论内容不能超过500字' 
      });
    }
    
    const post = await Post.findById(id);
    if (!post || post.status !== 'active') {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    await post.addComment(userId, content.trim(), replyTo, replyToName);
    
    res.json({
      success: true,
      message: '评论成功',
      data: {
        commentCount: post.stats.comments
      }
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ 
      success: false,
      error: '评论失败',
      message: error.message 
    });
  }
});

/**
 * @route   DELETE /api/posts/:id/comments/:commentId
 * @desc    删除评论
 * @access  Public
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    await post.deleteComment(commentId, userId);
    
    res.json({ 
      success: true,
      message: '删除成功',
      data: {
        commentCount: post.stats.comments
      }
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || '删除失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    点赞
 * @access  Public
 */
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    const post = await Post.findById(id);
    if (!post || post.status !== 'active') {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    await post.like(userId);
    
    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likes: post.stats.likes,
        liked: true
      }
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ 
      success: false,
      error: '点赞失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/posts/:id/unlike
 * @desc    取消点赞
 * @access  Public
 */
router.post('/:id/unlike', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    await post.unlike(userId);
    
    res.json({
      success: true,
      message: '取消点赞成功',
      data: {
        likes: post.stats.likes,
        liked: false
      }
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ 
      success: false,
      error: '取消点赞失败',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/posts/:id/same
 * @desc    "我也一样"
 * @access  Public
 */
router.post('/:id/same', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    const post = await Post.findById(id);
    if (!post || post.status !== 'active') {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在' 
      });
    }
    
    await post.sameHere(userId);
    
    res.json({
      success: true,
      message: '我也一样',
      data: {
        sameHere: post.stats.sameHere,
        hasSame: true
      }
    });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ 
      success: false,
      error: '操作失败',
      message: error.message 
    });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    删除帖子
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: '请先登录' 
      });
    }
    
    const post = await Post.findOne({ _id: req.params.id, userId });
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: '帖子不存在或无权限删除' 
      });
    }
    
    post.status = 'deleted';
    await post.save();
    
    res.json({ 
      success: true,
      message: '删除成功' 
    });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除失败',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/posts/meta/categories
 * @desc    获取帖子分类
 * @access  Public
 */
router.get('/meta/categories', async (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        { id: 'all', name: '全部', icon: '📋' },
        { id: '吐槽', name: '吐槽', icon: '😤' },
        { id: '求助', name: '求助', icon: '🆘' },
        { id: '分享', name: '分享', icon: '📢' },
        { id: '树洞', name: '树洞', icon: '🌳' }
      ]
    }
  });
});

module.exports = router;
