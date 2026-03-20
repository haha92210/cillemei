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
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .populate('userId', 'nickName avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Post.countDocuments(query);
    
    // 匿名处理
    const anonymousPosts = posts.map(post => ({
      ...post.toObject(),
      userId: undefined,
      anonymousId: post.userId ? `用户${post.userId._id.toString().slice(-6)}` : '匿名用户'
    }));
    
    res.json({
      posts: anonymousPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ error: '获取帖子失败' });
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
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    // 增加浏览量
    post.stats.views += 1;
    await post.save();
    
    // 匿名处理
    const postObj = post.toObject();
    postObj.userId = undefined;
    postObj.anonymousId = `用户${post.userId._id.toString().slice(-6)}`;
    
    res.json({ post: postObj });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

/**
 * @route   POST /api/posts
 * @desc    发布新帖子
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { userId, content, category = '吐槽', tags = [] } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '请先登录' });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '内容不能为空' });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ error: '内容不能超过1000字' });
    }
    
    const post = new Post({
      userId,
      content: content.trim(),
      category,
      tags: tags.slice(0, 5) // 最多5个标签
    });
    
    await post.save();
    
    res.status(201).json({
      message: '发布成功',
      post
    });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    点赞/取消点赞
 * @access  Public
 */
router.post('/:id/like', async (req, res) => {
  try {
    const { action = 'like' } = req.body; // like 或 unlike
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    
    if (action === 'like') {
      post.stats.likes += 1;
    } else if (action === 'unlike' && post.stats.likes > 0) {
      post.stats.likes -= 1;
    }
    
    await post.save();
    
    res.json({
      message: action === 'like' ? '点赞成功' : '取消点赞成功',
      likes: post.stats.likes
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '操作失败' });
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
    
    const post = await Post.findOne({ _id: req.params.id, userId });
    if (!post) {
      return res.status(404).json({ error: '帖子不存在或无权限删除' });
    }
    
    post.status = 'deleted';
    await post.save();
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * @route   GET /api/posts/categories
 * @desc    获取帖子分类
 * @access  Public
 */
router.get('/meta/categories', async (req, res) => {
  res.json({
    categories: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: '吐槽', name: '吐槽', icon: '😤' },
      { id: '求助', name: '求助', icon: '🆘' },
      { id: '分享', name: '分享', icon: '📢' },
      { id: '树洞', name: '树洞', icon: '🌳' }
    ]
  });
});

module.exports = router;
