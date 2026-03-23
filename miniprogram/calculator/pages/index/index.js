// calculator/pages/index/index.js
const app = getApp();
const API_BASE = app.globalData?.apiBase || 'http://localhost:3000/api';

Page({
  data: {
    cities: ['一线城市', '二线城市', '三线城市', '四线及以下'],
    cityIndex: 1,
    families: ['单身', '已婚', '有娃'],
    familyIndex: 0,
    inputs: {
      savings: '',          // 存款金额
      monthlyIncome: '',    // 月薪
      monthlyExpense: '',   // 月支出
      city: '二线城市',
      family: '单身'
    },
    loading: false,
    result: null,
    showResult: false,
    userId: null
  },

  onLoad() {
    const userId = wx.getStorageSync('userId') || 'temp_user_001';
    this.setData({ userId });
    
    // 加载缓存的计算结果
    const cachedResult = wx.getStorageSync('calculatorResult');
    if (cachedResult) {
      this.setData({
        result: cachedResult,
        showResult: true,
        inputs: cachedResult.inputs || this.data.inputs
      });
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`inputs.${field}`]: value
    });
  },

  onCityChange(e) {
    const index = e.detail.value;
    this.setData({
      cityIndex: index,
      'inputs.city': this.data.cities[index]
    });
  },

  onFamilyChange(e) {
    const index = e.detail.value;
    this.setData({
      familyIndex: index,
      'inputs.family': this.data.families[index]
    });
  },

  // 验证输入
  validateInputs() {
    const { savings, monthlyIncome, monthlyExpense } = this.data.inputs;
    
    if (!savings || parseFloat(savings) <= 0) {
      wx.showToast({ title: '请输入存款金额', icon: 'none' });
      return false;
    }
    
    if (!monthlyExpense || parseFloat(monthlyExpense) <= 0) {
      wx.showToast({ title: '请输入月支出', icon: 'none' });
      return false;
    }
    
    return true;
  },

  // 计算
  async calculate() {
    if (!this.validateInputs()) return;
    
    this.setData({ loading: true, showResult: false });
    
    wx.showLoading({ title: '计算中...' });
    
    try {
      const { inputs, userId } = this.data;
      
      // 调用后端API
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/calculator/calculate`,
          method: 'POST',
          data: {
            userId,
            savings: parseFloat(inputs.savings),
            monthlyIncome: parseFloat(inputs.monthlyIncome) || 0,
            monthlyExpense: parseFloat(inputs.monthlyExpense),
            city: inputs.city,
            family: inputs.family
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
        const result = res.data;
        this.setData({
          result,
          showResult: true,
          loading: false
        });
        
        // 缓存结果
        wx.setStorageSync('calculatorResult', result);
        
        wx.showToast({
          title: `风险等级：${result.result.riskLevel}`,
          icon: 'none',
          duration: 2000
        });
      } else {
        throw new Error(res.message || '计算失败');
      }
    } catch (error) {
      console.error('计算失败:', error);
      
      // 降级到本地计算
      this.calculateLocally();
    } finally {
      wx.hideLoading();
    }
  },

  // 本地计算（降级方案）
  calculateLocally() {
    const { inputs } = this.data;
    
    // 城市系数
    const cityCoefficients = {
      '一线城市': 1.2,
      '二线城市': 1.0,
      '三线城市': 0.8,
      '四线及以下': 0.7
    };
    
    // 家庭系数
    const familyCoefficients = {
      '单身': 1.0,
      '已婚': 1.3,
      '有娃': 1.8
    };
    
    const cityCoeff = cityCoefficients[inputs.city] || 1.0;
    const familyCoeff = familyCoefficients[inputs.family] || 1.0;
    
    const savings = parseFloat(inputs.savings);
    const monthlyExpense = parseFloat(inputs.monthlyExpense);
    
    // 计算实际月支出
    const actualMonthlyExpense = monthlyExpense * cityCoeff * familyCoeff;
    
    // 计算可支撑月数
    const runwayMonths = savings / actualMonthlyExpense;
    
    // 确定风险等级
    let riskLevel, riskColor, riskEmoji, advice, score;
    
    if (runwayMonths >= 12) {
      score = 90;
      riskLevel = '安全';
      riskColor = '#00C853';
      riskEmoji = '🟢';
      advice = '资金充足，可以考虑裸辞，给自己一段休息调整的时间';
    } else if (runwayMonths >= 6) {
      score = 75;
      riskLevel = '较安全';
      riskColor = '#64DD17';
      riskEmoji = '🟢';
      advice = '财务状况良好，辞职后可以有充足时间寻找理想工作';
    } else if (runwayMonths >= 3) {
      score = 55;
      riskLevel = '警戒';
      riskColor = '#FFB300';
      riskEmoji = '🟡';
      advice = '资金尚可，但建议找到下家再辞职，或准备应急资金';
    } else {
      score = 30;
      riskLevel = '危险';
      riskColor = '#FF1744';
      riskEmoji = '🔴';
      advice = '资金紧张，强烈建议先找到下家，或大幅削减开支';
    }
    
    // 生成详细分析
    let analysis = {
      summary: '',
      suggestions: [],
      milestones: []
    };
    
    if (runwayMonths >= 12) {
      analysis.summary = '财务状况非常健康，可以从容规划职业转型';
    } else if (runwayMonths >= 6) {
      analysis.summary = '资金充足，有缓冲时间寻找合适机会';
    } else if (runwayMonths >= 3) {
      analysis.summary = '资金尚可，但需要加快求职节奏';
      analysis.suggestions = ['建议边工作边看机会', '适当降低生活标准'];
    } else {
      analysis.summary = '资金紧张，建议谨慎考虑辞职时机';
      analysis.suggestions = ['强烈建议先找到下家再辞职', '削减非必要开支', '考虑临时兼职增加收入'];
    }
    
    const result = {
      inputs: {
        savings,
        monthlyExpense,
        city: inputs.city,
        family: inputs.family,
        cityCoeff,
        familyCoeff
      },
      result: {
        actualMonthlyExpense: Math.round(actualMonthlyExpense * 100) / 100,
        runwayMonths: Math.round(runwayMonths * 10) / 10,
        riskLevel,
        riskColor,
        riskEmoji,
        advice,
        score
      },
      analysis
    };
    
    this.setData({
      result,
      showResult: true,
      loading: false
    });
    
    wx.setStorageSync('calculatorResult', result);
    
    wx.showToast({
      title: `风险等级：${riskLevel}`,
      icon: 'none',
      duration: 2000
    });
  },

  // 重新计算
  reset() {
    this.setData({
      showResult: false,
      result: null
    });
    wx.removeStorageSync('calculatorResult');
  },

  // 分享结果
  shareResult() {
    const { result } = this.data;
    if (!result) return;
    
    // 生成分享图片
    this.generateShareImage();
  },

  // 生成分享图片
  generateShareImage() {
    const { result } = this.data;
    const ctx = wx.createCanvasContext('shareCanvas');
    
    // 背景
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, 300, 400);
    
    // 标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(20);
    ctx.setTextAlign('center');
    ctx.fillText('离职风险评估', 150, 40);
    
    // 风险等级
    ctx.setFillStyle(result.result.riskColor);
    ctx.setFontSize(36);
    ctx.fillText(result.result.riskLevel, 150, 100);
    
    // 可支撑月数
    ctx.setFillStyle('#666666');
    ctx.setFontSize(14);
    ctx.fillText(`可支撑 ${result.result.runwayMonths} 个月`, 150, 140);
    
    // 建议
    ctx.setFillStyle('#333333');
    ctx.setFontSize(12);
    ctx.fillText(result.result.advice.substring(0, 20) + '...', 150, 180);
    
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

  onShareAppMessage() {
    const { result } = this.data;
    if (result) {
      return {
        title: `我的离职风险评估：${result.result.riskLevel} - 可支撑${result.result.runwayMonths}个月`,
        path: '/calculator/pages/index/index'
      };
    }
    return {
      title: '离职风险评估计算器',
      path: '/calculator/pages/index/index'
    };
  }
});
