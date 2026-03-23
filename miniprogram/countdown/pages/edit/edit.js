// countdown/pages/edit/edit.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    isEdit: false,
    countdownId: null,
    userId: null,
    types: [
      { id: 'resignation', name: '辞职倒计时', icon: '🎉', color: '#FF6B6B' },
      { id: 'bonus', name: '年终奖', icon: '💰', color: '#FFD93D' },
      { id: 'promotion', name: '晋升评估', icon: '📈', color: '#6BCB77' },
      { id: 'holiday', name: '假期', icon: '🏖️', color: '#4D96FF' },
      { id: 'custom', name: '自定义', icon: '📅', color: '#9B59B6' }
    ],
    selectedType: 'resignation',
    form: {
      title: '',
      targetDate: '',
      targetTime: '18:00',
      description: ''
    },
    loading: false,
    today: ''
  },

  onLoad(options) {
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    const today = new Date().toISOString().split('T')[0];
    
    this.setData({
      userId,
      today,
      'form.targetDate': today
    });
    
    // 如果是编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        countdownId: options.id
      });
      this.loadCountdownDetail(options.id);
    }
  },

  // 加载倒计时详情
  async loadCountdownDetail(id) {
    const { userId } = this.data;
    
    this.setData({ loading: true });
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/countdown/${id}/stats`,
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
        // 这里需要根据返回的数据结构调整
        // 实际应该从 /countdown API 获取完整数据
        this.loadFromLocal(id);
      }
    } catch (error) {
      console.error('加载详情失败:', error);
      this.loadFromLocal(id);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 从本地加载（降级）
  loadFromLocal(id) {
    // 模拟数据
    const mockData = {
      _id: id,
      title: '离职日',
      type: 'resignation',
      targetDate: '2026-03-20',
      targetTime: '18:00',
      description: '终于解放了！'
    };
    
    this.setData({
      selectedType: mockData.type,
      form: {
        title: mockData.title,
        targetDate: mockData.targetDate,
        targetTime: mockData.targetTime,
        description: mockData.description
      }
    });
  },

  // 选择类型
  selectType(e) {
    const { type } = e.currentTarget.dataset;
    const typeInfo = this.data.types.find(t => t.id === type);
    
    this.setData({
      selectedType: type,
      'form.title': typeInfo ? typeInfo.name : ''
    });
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ 'form.targetDate': e.detail.value });
  },

  // 选择时间
  onTimeChange(e) {
    this.setData({ 'form.targetTime': e.detail.value });
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value });
  },

  // 验证表单
  validateForm() {
    const { form } = this.data;
    
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return false;
    }
    
    if (!form.targetDate) {
      wx.showToast({ title: '请选择目标日期', icon: 'none' });
      return false;
    }
    
    return true;
  },

  // 保存
  async save() {
    if (!this.validateForm()) return;
    
    this.setData({ loading: true });
    wx.showLoading({ title: '保存中...' });
    
    try {
      const { isEdit, countdownId, userId, selectedType, form } = this.data;
      
      const url = isEdit 
        ? `${API_BASE}/countdown/${countdownId}`
        : `${API_BASE}/countdown`;
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method,
          data: {
            userId,
            type: selectedType,
            title: form.title.trim(),
            targetDate: form.targetDate,
            targetTime: form.targetTime,
            description: form.description.trim()
          },
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
        wx.showToast({
          title: isEdit ? '更新成功' : '创建成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        throw new Error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      
      // 本地保存（降级）
      this.saveLocally();
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  // 本地保存（降级）
  saveLocally() {
    const { isEdit, form, selectedType } = this.data;
    
    // 从本地存储获取列表
    let countdowns = wx.getStorageSync('localCountdowns') || [];
    
    if (isEdit) {
      // 更新
      const index = countdowns.findIndex(c => c._id === this.data.countdownId);
      if (index > -1) {
        countdowns[index] = {
          ...countdowns[index],
          ...form,
          type: selectedType
        };
      }
    } else {
      // 创建
      const typeInfo = this.data.types.find(t => t.id === selectedType);
      const newCountdown = {
        _id: 'local_' + Date.now(),
        ...form,
        type: selectedType,
        style: {
          icon: typeInfo?.icon || '📅',
          backgroundColor: typeInfo?.color || '#9B59B6'
        },
        daysLeft: this.calculateDaysLeft(form.targetDate),
        hasCheckedInToday: false,
        streak: 0,
        checkInHistory: [],
        badges: []
      };
      countdowns.push(newCountdown);
    }
    
    wx.setStorageSync('localCountdowns', countdowns);
    
    wx.showToast({
      title: isEdit ? '更新成功' : '创建成功',
      icon: 'success'
    });
    
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  // 计算剩余天数
  calculateDaysLeft(targetDate) {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // 取消
  cancel() {
    wx.navigateBack();
  },

  // 删除
  async delete() {
    const { isEdit, countdownId, userId } = this.data;
    
    if (!isEdit) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个倒计时吗？此操作不可恢复。',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          try {
            await new Promise((resolve, reject) => {
              wx.request({
                url: `${API_BASE}/countdown/${countdownId}`,
                method: 'DELETE',
                data: { userId },
                success: resolve,
                fail: reject
              });
            });
            
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } catch (error) {
            console.error('删除失败:', error);
            
            // 本地删除
            let countdowns = wx.getStorageSync('localCountdowns') || [];
            countdowns = countdowns.filter(c => c._id !== countdownId);
            wx.setStorageSync('localCountdowns', countdowns);
            
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  }
});
