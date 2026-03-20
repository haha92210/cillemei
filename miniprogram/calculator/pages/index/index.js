// calculator/pages/index/index.js
Page({
  data: {
    cities: ['一线城市', '二线城市', '三线城市', '四线及以下'],
    cityIndex: 0,
    inputs: {
      age: 28,
      city: '二线城市',
      savings: 6,
      currentJobYears: 2
    },
    factors: [
      { id: 'stress', label: '工作压力', value: 6 },
      { id: 'growth', label: '成长空间', value: 4 },
      { id: 'satisfaction', label: '工作满意度', value: 5 },
      { id: 'health', label: '健康影响', value: 5 },
      { id: 'relationship', label: '人际关系', value: 6 }
    ],
    result: null,
    scoreColor: '#FF6B6B'
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`inputs.${field}`]: e.detail.value
    });
  },

  onCityChange(e) {
    this.setData({
      cityIndex: e.detail.value,
      'inputs.city': this.data.cities[e.detail.value]
    });
  },

  onFactorChange(e) {
    const { id } = e.currentTarget.dataset;
    const factors = this.data.factors.map(f => 
      f.id === id ? { ...f, value: e.detail.value } : f
    );
    this.setData({ factors });
  },

  calculate() {
    // 简单计算逻辑
    let score = 50;
    const { age, savings, currentJobYears, city } = this.data.inputs;
    
    if (age >= 20 && age <= 30) score += 15;
    else if (age > 30 && age <= 35) score += 10;
    else score -= 5;
    
    if (savings >= 12) score += 20;
    else if (savings >= 6) score += 10;
    else if (savings >= 3) score += 0;
    else score -= 15;
    
    if (currentJobYears >= 2) score += 10;
    
    const cityScores = { '一线城市': 10, '二线城市': 5, '三线城市': 0, '四线及以下': -5 };
    score += cityScores[city] || 0;
    
    // 因素调整
    this.data.factors.forEach(f => {
      if (f.id === 'stress') score -= (f.value - 5) * 1.5;
      if (f.id === 'growth') score -= (10 - f.value) * 1;
      if (f.id === 'satisfaction') score -= (10 - f.value) * 1.5;
    });
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    let riskLevel, suggestion, bestTime, scoreColor;
    
    if (score >= 80) {
      riskLevel = '安全';
      suggestion = '当前状态良好，可以考虑寻找更好的机会！';
      bestTime = '随时可以行动，准备好简历就出发吧！';
      scoreColor = '#4CAF50';
    } else if (score >= 60) {
      riskLevel = '谨慎';
      suggestion = '整体情况尚可，但建议再做一些准备。';
      bestTime = '建议再积累一些经验或储蓄后再考虑。';
      scoreColor = '#FF9800';
    } else if (score >= 40) {
      riskLevel = '警告';
      suggestion = '存在一定风险，建议谨慎决策。';
      bestTime = '建议等待更好的时机，先解决当前问题。';
      scoreColor = '#FF5722';
    } else {
      riskLevel = '危险';
      suggestion = '当前不建议离职，风险较高！';
      bestTime = '强烈建议暂缓离职计划，先改善现状。';
      scoreColor = '#F44336';
    }
    
    this.setData({
      result: { score, riskLevel, suggestion, bestTime, runway: savings },
      scoreColor
    });
  }
});
