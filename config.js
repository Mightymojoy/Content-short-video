// 系统配置
const path = require('path');

module.exports = {
  // 服务端口
  port: process.env.PORT || 3001,

  // 数据库路径
  dbPath: path.join(__dirname, 'db', 'data.db'),

  // 上传目录
  uploadsDir: path.join(__dirname, 'uploads'),

  // 模板目录
  templatesDir: path.join(__dirname, 'templates'),

  // 品牌配置
  brands: [
    { key: 'modeng', name: '摩登新贵女' },
    { key: 'qingshu', name: '轻熟质享客' },
    { key: 'yunduan', name: '云端商务家' },
  ],

  // 品牌名称 → key 反查映射
  brandNameMap: {
    '摩登新贵女': 'modeng',
    '轻熟质享客': 'qingshu',
    '云端商务家': 'yunduan',
  },

  // 剪辑部门 → 制作源头映射
  sourceMap: {
    '内部': 'internal',
    'ITO': 'ito',
    '外部': 'external',
    'AIGC': 'aigc',
    '其他': 'other',
  },

  // 视频类型 → 视频形式映射
  formatMap: {
    'KOL': 'KOL',
    '主播': '直播切片',
    '自制': '原生',
    '混剪': '原生',
    '种草': '原生',
    '原生': '原生',
    '直播切片': '直播切片',
    '复刻': '复刻',
    '明星': '明星',
  },

  // 默认视频形式（未匹配时）
  defaultFormat: '原生',

  // 有效视频阈值
  effectiveGmvThreshold: 1000,
  effectiveDaysThreshold: 5,

  // 跑量视频阈值
  runnerGmv50k: 50000,
  runnerGmv10k: 10000,
};
