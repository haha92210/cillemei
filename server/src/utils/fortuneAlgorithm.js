/**
 * 运势算法模块
 * 基于日期+用户ID的伪随机算法生成每日运势
 */

// 运势等级
const FORTUNE_LEVELS = [
  { level: '上上签', score: 95, color: '#FF6B6B', desc: '鸿运当头，万事如意' },
  { level: '上签', score: 85, color: '#4ECDC4', desc: '吉星高照，顺风顺水' },
  { level: '中上签', score: 75, color: '#45B7D1', desc: '运势良好，稳中有进' },
  { level: '中签', score: 60, color: '#96CEB4', desc: '平平淡淡，随遇而安' },
  { level: '中下签', score: 45, color: '#FFEAA7', desc: '小有波折，谨慎行事' },
  { level: '下签', score: 30, color: '#DDA0DD', desc: '时运不济，韬光养晦' }
];

// 运势分类文案库
const FORTUNE_LIBRARY = {
  // 宜提离职 - 运势很好，适合行动
  resign: [
    { content: '今日宜提离职，天时地利人和', advice: '把握机会，果断出击' },
    { content: '老板今天心情好，适合谈离职', advice: '选个合适的时机，好好沟通' },
    { content: '今日星象利于跳槽转运', advice: '准备好离职信，今天递交最佳' },
    { content: '职场运势大旺，提离职必成', advice: '抓住良辰吉日，勇敢迈出第一步' },
    { content: '今日贵人相助，离职顺利', advice: '有望获得好聚好散的结局' },
    { content: '时机已到，不必再忍', advice: '天时地利，离职正当时' },
    { content: '今日运势利于斩断旧缘', advice: '好聚好散，体面离开' },
    { content: '星象显示今日利于工作变动', advice: '主动求变，会有好结果' }
  ],
  
  // 宜苟住 - 运势一般，建议观望
  hold: [
    { content: '今日宜低调苟住，韬光养晦', advice: '静观其变，等待更好时机' },
    { content: '运势平稳，建议再忍忍', advice: '小不忍则乱大谋，继续观望' },
    { content: '今日不宜轻举妄动', advice: '保持现状，积蓄力量' },
    { content: '时机未到，宜坚守阵地', advice: '耐心等待，会有转机' },
    { content: '今日星象暗示宜静不宜动', advice: '以不变应万变，稳住心态' },
    { content: '运势中庸，建议按兵不动', advice: '继续观察，切勿冲动' },
    { content: '今日宜埋头做事，少言多做', advice: '用行动说话，等待时机' },
    { content: '暂时蛰伏，厚积薄发', advice: '现在不是最佳时机，再等等' }
  ],
  
  // 宜准备 - 运势转好，开始准备
  prepare: [
    { content: '今日宜准备简历，蓄势待发', advice: '未雨绸缪，提前规划' },
    { content: '运势渐起，宜开始准备', advice: '更新简历，看看机会' },
    { content: '今日适合谋划未来', advice: '制定计划，做好准备' },
    { content: '时机渐近，宜提前布局', advice: '准备充分，等待东风' },
    { content: '今日利于学习提升', advice: '充实自己，为跳槽做准备' },
    { content: '运势向好，宜开始物色新机会', advice: '悄悄看机会，不要声张' },
    { content: '今日宜整理工作经验', advice: '总结成果，为下家准备' },
    { content: '时机正在成熟，宜提前准备', advice: '做好万全准备，机会来时抓住' }
  ],
  
  // 宜摸鱼 - 运势一般，放松一下
  slack: [
    { content: '今日宜适度摸鱼，劳逸结合', advice: '工作累了就休息一下' },
    { content: '运势平平，宜低调摸鱼', advice: '不要太拼，保持精力' },
    { content: '今日适合带薪喝茶', advice: '放松心情，调整心态' },
    { content: '星象暗示今日宜偷得浮生半日闲', advice: '适度放松，不要勉强' },
    { content: '今日工作量不宜太大', advice: '保持节奏，适度休息' },
    { content: '运势一般，宜保存实力', advice: '今天不要太拼，留点精力' },
    { content: '今日适合工位养生', advice: '泡杯茶，听听歌，放松一下' },
    { content: '今天适合低调度过', advice: '不争不抢，安心摸鱼' }
  ]
};

// 幸运色库
const LUCKY_COLORS = [
  { name: '中国红', value: '#FF0000', desc: '热情似火，运势亨通' },
  { name: '富贵金', value: '#FFD700', desc: '招财进宝，财运滚滚' },
  { name: '天空蓝', value: '#87CEEB', desc: '心旷神怡，思路清晰' },
  { name: '森林绿', value: '#228B22', desc: '生机勃勃，事业顺遂' },
  { name: '紫罗兰', value: '#EE82EE', desc: '高贵优雅，贵人相助' },
  { name: '活力橙', value: '#FFA500', desc: '活力满满，干劲十足' },
  { name: '纯净白', value: '#FFFFFF', desc: '心如止水，头脑清醒' },
  { name: '神秘黑', value: '#000000', desc: '沉稳大气，深不可测' },
  { name: '樱花粉', value: '#FFB6C1', desc: '桃花朵朵，人缘极佳' },
  { name: '薄荷绿', value: '#98FB98', desc: '清新自然，身心舒畅' },
  { name: '深海蓝', value: '#00008B', desc: '沉着冷静，智慧涌现' },
  { name: '香槟金', value: '#F7E7CE', desc: '优雅从容，好事将近' }
];

// 吉时数组
const LUCKY_HOURS = [
  '09:00-11:00', '11:00-13:00', '13:00-15:00', 
  '15:00-17:00', '17:00-19:00'
];

/**
 * 基于种子生成伪随机数
 * @param {string} seed - 随机种子
 * @returns {number} 0-1之间的随机数
 */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * 根据种子生成指定范围的整数
 * @param {string} seed - 随机种子
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function seededRandomInt(seed, min, max) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

/**
 * 生成每日运势
 * @param {string} userId - 用户ID
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {Object} 运势结果
 */
function generateDailyFortune(userId, date = new Date().toISOString().split('T')[0]) {
  // 生成随机种子
  const seed = `${userId}_${date}`;
  
  // 生成基础运势分 (0-100)
  const baseScore = seededRandomInt(seed + '_base', 20, 98);
  
  // 确定运势等级
  let fortuneLevel;
  for (const level of FORTUNE_LEVELS) {
    if (baseScore >= level.score - 10) {
      fortuneLevel = level;
      break;
    }
  }
  if (!fortuneLevel) {
    fortuneLevel = FORTUNE_LEVELS[FORTUNE_LEVELS.length - 1];
  }
  
  // 确定运势类型和文案
  let category;
  if (baseScore >= 80) {
    category = 'resign';
  } else if (baseScore >= 60) {
    category = 'prepare';
  } else if (baseScore >= 40) {
    category = 'hold';
  } else {
    category = 'slack';
  }
  
  const categorySeed = seed + '_category';
  const fortuneTexts = FORTUNE_LIBRARY[category];
  const selectedText = fortuneTexts[seededRandomInt(categorySeed, 0, fortuneTexts.length - 1)];
  
  // 生成各维度评分
  const dimensions = {
    career: Math.min(100, Math.max(20, baseScore + seededRandomInt(seed + '_career', -15, 15))),
    wealth: Math.min(100, Math.max(20, baseScore + seededRandomInt(seed + '_wealth', -20, 10))),
    relationship: Math.min(100, Math.max(20, baseScore + seededRandomInt(seed + '_relation', -10, 20))),
    resignation: Math.min(100, Math.max(20, baseScore + seededRandomInt(seed + '_resign', -25, 5)))
  };
  
  // 生成幸运色
  const luckyColorSeed = seed + '_color';
  const luckyColor = LUCKY_COLORS[seededRandomInt(luckyColorSeed, 0, LUCKY_COLORS.length - 1)];
  
  // 生成幸运数字
  const luckyNumbers = [];
  for (let i = 0; i < 3; i++) {
    const num = seededRandomInt(seed + '_num_' + i, 1, 99);
    if (!luckyNumbers.includes(num)) {
      luckyNumbers.push(num);
    }
  }
  luckyNumbers.sort((a, b) => a - b);
  
  // 生成幸运方向
  const directions = ['东', '南', '西', '北', '东南', '东北', '西南', '西北'];
  const luckyDirection = directions[seededRandomInt(seed + '_direction', 0, directions.length - 1)];
  
  // 生成吉时
  const luckyHour = LUCKY_HOURS[seededRandomInt(seed + '_hour', 0, LUCKY_HOURS.length - 1)];
  
  // 生成宜忌事项
  const suitableThings = generateSuitableThings(seed, baseScore);
  const avoidThings = generateAvoidThings(seed, baseScore);
  
  return {
    date,
    level: fortuneLevel.level,
    levelScore: fortuneLevel.score,
    levelColor: fortuneLevel.color,
    levelDesc: fortuneLevel.desc,
    overallScore: baseScore,
    category,
    content: selectedText.content,
    advice: selectedText.advice,
    dimensions: {
      career: { score: dimensions.career, label: '事业运', desc: getDimensionDesc(dimensions.career) },
      wealth: { score: dimensions.wealth, label: '财运', desc: getDimensionDesc(dimensions.wealth) },
      relationship: { score: dimensions.relationship, label: '人际关系', desc: getDimensionDesc(dimensions.relationship) },
      resignation: { score: dimensions.resignation, label: '辞职指数', desc: getDimensionDesc(dimensions.resignation) }
    },
    luckyColor,
    luckyNumbers,
    luckyDirection,
    luckyHour,
    suitable: suitableThings,
    avoid: avoidThings,
    seed
  };
}

/**
 * 根据分数获取维度描述
 * @param {number} score - 分数
 * @returns {string} 描述
 */
function getDimensionDesc(score) {
  if (score >= 90) return '极佳';
  if (score >= 80) return '很好';
  if (score >= 70) return '不错';
  if (score >= 60) return '一般';
  if (score >= 50) return '稍弱';
  if (score >= 40) return '较弱';
  return '低迷';
}

/**
 * 生成宜做事项
 * @param {string} seed - 随机种子
 * @param {number} score - 运势分数
 * @returns {Array} 宜做事项
 */
function generateSuitableThings(seed, score) {
  const allThings = [
    '提离职', '谈加薪', '面试新工作', '更新简历', '找猎头聊聊',
    '请同事吃饭', '向领导汇报工作', '申请调休', '整理工位',
    '学习新技能', '规划职业发展', '跟HR谈福利', '参加行业聚会',
    '整理作品集', '准备离职交接', '写工作总结', '制定新年计划',
    '买彩票', '投资理财', '约朋友聚会', '运动健身', '早点下班'
  ];
  
  const count = score >= 80 ? 4 : score >= 60 ? 3 : 2;
  const things = [];
  const used = new Set();
  
  for (let i = 0; things.length < count && i < 50; i++) {
    const idx = seededRandomInt(seed + '_suit_' + i, 0, allThings.length - 1);
    if (!used.has(idx)) {
      used.add(idx);
      things.push(allThings[idx]);
    }
  }
  
  return things;
}

/**
 * 生成忌做事项
 * @param {string} seed - 随机种子
 * @param {number} score - 运势分数
 * @returns {Array} 忌做事项
 */
function generateAvoidThings(seed, score) {
  const allThings = [
    '冲动离职', '跟领导顶嘴', '公开抱怨公司', '迟到早退',
    '拒绝加班', '越级上报', '泄露机密', '传播负能量',
    '借钱给同事', '参与八卦', '得罪客户', '旷工',
    '简历造假', '裸辞', '投资高风险产品', '冲动消费',
    '得罪HR', '拒绝团建', '办公室恋爱', '背后议论'
  ];
  
  const count = score < 40 ? 4 : score < 60 ? 3 : 2;
  const things = [];
  const used = new Set();
  
  for (let i = 0; things.length < count && i < 50; i++) {
    const idx = seededRandomInt(seed + '_avoid_' + i, 0, allThings.length - 1);
    if (!used.has(idx)) {
      used.add(idx);
      things.push(allThings[idx]);
    }
  }
  
  return things;
}

/**
 * 验证运势是否过期
 * @param {string} fortuneDate - 运势日期
 * @returns {boolean} 是否过期
 */
function isFortuneExpired(fortuneDate) {
  const today = new Date().toISOString().split('T')[0];
  return fortuneDate !== today;
}

module.exports = {
  generateDailyFortune,
  isFortuneExpired,
  FORTUNE_LEVELS,
  FORTUNE_LIBRARY,
  LUCKY_COLORS
};
