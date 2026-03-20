/**
 * 离职计算器逻辑
 * 评估离职风险和资金充足度
 */

// 城市系数
const CITY_COEFFICIENTS = {
  '一线城市': 1.2,
  '二线城市': 1.0,
  '三线城市': 0.8
};

// 家庭系数
const FAMILY_COEFFICIENTS = {
  '单身': 1.0,
  '已婚': 1.3,
  '有娃': 1.8
};

// 风险等级定义
const RISK_LEVELS = {
  SAFE: {
    level: '安全',
    minMonths: 6,
    color: '#00C853',
    emoji: '🟢',
    advice: '资金充足，可以放心辞职，有充足时间找下家'
  },
  WARNING: {
    level: '警戒',
    minMonths: 3,
    color: '#FFB300',
    emoji: '🟡',
    advice: '资金尚可，但建议找到下家再辞职，或准备应急资金'
  },
  DANGER: {
    level: '危险',
    minMonths: 0,
    color: '#FF1744',
    emoji: '🔴',
    advice: '资金紧张，强烈建议先找到下家，或大幅削减开支'
  }
};

// 建议文案库
const ADVICE_LIBRARY = {
  safe: [
    '资金充足，可以考虑裸辞，给自己一段休息调整的时间',
    '财务状况良好，辞职后可以有充足时间寻找理想工作',
    '建议利用这段时间好好规划职业发展，不要急于入职',
    '可以考虑gap一段时间，充电学习或旅行放松'
  ],
  warning: [
    '建议边工作边看机会，找到下家再辞职更稳妥',
    '可以适当降低生活标准，延长资金使用时间',
    '考虑做一些兼职或副业，增加收入来源',
    '建议准备3-6个月的应急资金后再行动'
  ],
  danger: [
    '强烈建议先找到下家再辞职，避免资金链断裂',
    '考虑先削减非必要开支，增加存款',
    '可以开始投简历，但不要裸辞',
    '建议制定详细的求职计划，争取尽快入职'
  ]
};

/**
 * 计算离职风险评估
 * @param {Object} params - 计算参数
 * @param {number} params.savings - 存款（月）
 * @param {number} params.monthlyExpense - 月支出
 * @param {string} params.city - 城市级别（一线城市/二线城市/三线城市）
 * @param {string} params.family - 家庭情况（单身/已婚/有娃）
 * @returns {Object} 计算结果
 */
function calculateResignationRisk(params) {
  const { savings, monthlyExpense, city = '二线城市', family = '单身' } = params;
  
  // 参数验证
  if (!savings || !monthlyExpense) {
    throw new Error('缺少必要参数：存款和月支出');
  }
  
  // 获取系数
  const cityCoeff = CITY_COEFFICIENTS[city] || 1.0;
  const familyCoeff = FAMILY_COEFFICIENTS[family] || 1.0;
  
  // 计算实际月支出
  const actualMonthlyExpense = monthlyExpense * cityCoeff * familyCoeff;
  
  // 计算可支撑月数
  const runwayMonths = savings / actualMonthlyExpense;
  
  // 确定风险等级
  let riskLevel;
  if (runwayMonths >= RISK_LEVELS.SAFE.minMonths) {
    riskLevel = RISK_LEVELS.SAFE;
  } else if (runwayMonths >= RISK_LEVELS.WARNING.minMonths) {
    riskLevel = RISK_LEVELS.WARNING;
  } else {
    riskLevel = RISK_LEVELS.DANGER;
  }
  
  // 随机选择建议
  const adviceKey = riskLevel.level === '安全' ? 'safe' : 
                    riskLevel.level === '警戒' ? 'warning' : 'danger';
  const advices = ADVICE_LIBRARY[adviceKey];
  const randomAdvice = advices[Math.floor(Math.random() * advices.length)];
  
  return {
    // 输入参数
    inputs: {
      savings,
      monthlyExpense,
      city,
      family,
      cityCoeff,
      familyCoeff
    },
    // 计算结果
    result: {
      actualMonthlyExpense: Math.round(actualMonthlyExpense * 100) / 100,
      runwayMonths: Math.round(runwayMonths * 10) / 10,
      riskLevel: riskLevel.level,
      riskColor: riskLevel.color,
      riskEmoji: riskLevel.emoji,
      advice: randomAdvice
    },
    // 详细分析
    analysis: generateAnalysis(runwayMonths, actualMonthlyExpense)
  };
}

/**
 * 生成详细分析报告
 * @param {number} runwayMonths - 可支撑月数
 * @param {number} actualMonthlyExpense - 实际月支出
 * @returns {Object} 分析报告
 */
function generateAnalysis(runwayMonths, actualMonthlyExpense) {
  const analysis = {
    summary: '',
    suggestions: [],
    milestones: []
  };
  
  // 总结
  if (runwayMonths >= 12) {
    analysis.summary = '财务状况非常健康，可以从容规划职业转型';
  } else if (runwayMonths >= 6) {
    analysis.summary = '资金充足，有缓冲时间寻找合适机会';
  } else if (runwayMonths >= 3) {
    analysis.summary = '资金尚可，但需要加快求职节奏';
  } else {
    analysis.summary = '资金紧张，建议谨慎考虑辞职时机';
  }
  
  // 建议
  if (runwayMonths < 6) {
    analysis.suggestions.push('考虑削减非必要开支');
    analysis.suggestions.push('开始积极投递简历');
  }
  if (runwayMonths < 3) {
    analysis.suggestions.push('优先保证基本生活需求');
    analysis.suggestions.push('考虑临时兼职增加收入');
  }
  
  // 关键时间点
  const monthlyBurn = actualMonthlyExpense;
  analysis.milestones = [
    { month: 1, amount: Math.round(monthlyBurn * 1), event: '第一个月' },
    { month: 3, amount: Math.round(monthlyBurn * 3), event: '警戒线' },
    { month: 6, amount: Math.round(monthlyBurn * 6), event: '安全线' }
  ].filter(m => m.month <= runwayMonths);
  
  return analysis;
}

/**
 * 获取风险等级列表
 * @returns {Array} 风险等级列表
 */
function getRiskLevels() {
  return Object.values(RISK_LEVELS).map(level => ({
    level: level.level,
    minMonths: level.minMonths,
    color: level.color,
    emoji: level.emoji
  }));
}

/**
 * 获取城市系数列表
 * @returns {Object} 城市系数
 */
function getCityCoefficients() {
  return { ...CITY_COEFFICIENTS };
}

/**
 * 获取家庭系数列表
 * @returns {Object} 家庭系数
 */
function getFamilyCoefficients() {
  return { ...FAMILY_COEFFICIENTS };
}

module.exports = {
  calculateResignationRisk,
  getRiskLevels,
  getCityCoefficients,
  getFamilyCoefficients,
  CITY_COEFFICIENTS,
  FAMILY_COEFFICIENTS,
  RISK_LEVELS
};
