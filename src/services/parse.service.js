// Excel 解析服务
const XLSX = require('xlsx');
const config = require('../../config');
const videoRepo = require('../repository/video.repo');
const livestreamRepo = require('../repository/livestream.repo');
const { getWeekKey, getMonthKey, parseExcelDate, parseNumber, parsePercent } = require('../utils/date.helper');

/**
 * 列名映射配置 — 短视频数据源
 * Excel 列名 → 数据库字段
 */
const VIDEO_COL_MAP = {
  '素材名称': 'video_name',
  '素材ID': 'video_id',
  '素材创建时间': 'upload_date',
  '上传素材时间': 'upload_time',
  '素材来源': 'source_raw',
  '剪辑部门': '_source_raw',
  '类型': '_format_raw',
  '标签': 'tag',
  '整体展现次数': 'impressions',
  '整体点击率': 'ctr',
  '整体转化率': 'cvr',
  '整体消耗': 'cost',
  '整体支付ROI': 'roi',
  '整体成交金额': 'gmv',
  '用户实际支付金额': 'actual_payment',
  '上线天数': 'days_online',
};

/**
 * 列名映射配置 — 直播间数据源
 */
const LIVE_COL_MAP = {
  '日期': 'live_date',
  '直播开始时间': 'start_time',
  '直播结束时间': 'end_time',
  '直播时长(分钟)': 'duration_min',
  '直播间成交金额': 'live_gmv',
  '直播间用户支付金额': 'live_payment',
  '直播间退款金额': 'refund_amount',
  '净成交金额': 'net_gmv',
  '直播间投放消耗': 'ad_cost',
};

/**
 * 模糊匹配列名
 */
function matchColumnName(headers, target) {
  // 精确匹配
  if (headers.includes(target)) return target;
  // 模糊匹配（去除空格）
  const normalized = headers.map(h => h.replace(/\s/g, ''));
  const idx = normalized.indexOf(target.replace(/\s/g, ''));
  return idx >= 0 ? headers[idx] : null;
}

/**
 * 解析短视频 Excel
 */
async function parseVideoExcel(filePath, brand = 'modeng') {
  const workbook = XLSX.readFile(filePath);

  // 查找短视频数据 Sheet — 优先匹配完整版
  const sheetNames = workbook.SheetNames;
  let sheetName = sheetNames.find(n => n.includes('新-短视频'))
    || sheetNames.find(n => n.includes('短视频') && n.includes('数据源'))
    || sheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error(`Sheet "${sheetName}" 中无数据`);
  }

  // 获取实际列名
  const headers = Object.keys(rows[0]);

  // 构建列名映射
  const colMap = {};
  for (const [excelCol, dbField] of Object.entries(VIDEO_COL_MAP)) {
    const actualCol = matchColumnName(headers, excelCol);
    if (actualCol) {
      colMap[dbField] = actualCol;
    }
  }

  // 转换数据
  const records = [];
  for (const row of rows) {
    const uploadDate = parseExcelDate(row[colMap['upload_date']]);
    const uploadTime = parseExcelDate(row[colMap['upload_time']]);

    const sourceRaw = row[colMap['_source_raw']] || '';
    const formatRaw = row[colMap['_format_raw']] || '';

    // 剪辑部门 → source
    const source = config.sourceMap[sourceRaw] || 'other';
    // 类型 → video_format
    const videoFormat = config.formatMap[formatRaw] || config.defaultFormat;

    // 周编号
    const dataWeek = uploadDate ? getWeekKey(uploadDate) : null;
    const dataMonth = uploadDate ? getMonthKey(uploadDate) : null;
    const uploadWeek = uploadTime ? getWeekKey(uploadTime) : dataWeek;
    const uploadMonth = uploadTime ? getMonthKey(uploadTime) : dataMonth;

    records.push({
      brand,
      video_name: row[colMap['video_name']] || '',
      video_id: row[colMap['video_id']] || '',
      upload_date: uploadDate ? uploadDate.toISOString().split('T')[0] : null,
      upload_time: uploadTime ? uploadTime.toISOString() : null,
      source_raw: row[colMap['source_raw']] || '',
      source,
      video_format: videoFormat,
      tag: row[colMap['tag']] || '',
      impressions: parseNumber(row[colMap['impressions']]),
      ctr: parsePercent(row[colMap['ctr']]),
      cvr: parsePercent(row[colMap['cvr']]),
      cost: parseNumber(row[colMap['cost']]),
      roi: parseNumber(row[colMap['roi']]),
      gmv: parseNumber(row[colMap['gmv']]),
      actual_payment: parseNumber(row[colMap['actual_payment']]),
      days_online: parseNumber(row[colMap['days_online']]),
      data_week: dataWeek,
      data_month: dataMonth,
      upload_week: uploadWeek,
      upload_month: uploadMonth,
    });
  }

  // 写入数据库
  await videoRepo.clearByBrand(brand);
  await videoRepo.batchInsert(records);

  return {
    sheet: sheetName,
    total: rows.length,
    imported: records.length,
    brand,
  };
}

/**
 * 解析直播间 Excel
 */
async function parseLivestreamExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;

  const allRecords = [];
  const stats = [];

  for (const sheetName of sheetNames) {
    // 跳过短视频相关 Sheet
    if (sheetName.includes('短视频') || sheetName.includes('目标') || sheetName.includes('数据监控')) {
      continue;
    }

    // 识别品牌
    let brand = 'modeng'; // 默认
    for (const [name, key] of Object.entries(config.brandNameMap)) {
      if (sheetName.includes(name)) {
        brand = key;
        break;
      }
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);

    // 构建列名映射
    const colMap = {};
    for (const [excelCol, dbField] of Object.entries(LIVE_COL_MAP)) {
      const actualCol = matchColumnName(headers, excelCol);
      if (actualCol) colMap[dbField] = actualCol;
    }

    // 跳过无直播日期的 Sheet
    if (!colMap['live_date'] && !colMap['start_time']) continue;

    const records = [];
    for (const row of rows) {
      const liveDate = parseExcelDate(row[colMap['live_date']]) || parseExcelDate(row[colMap['start_time']]);
      if (!liveDate) continue;

      const dataWeek = liveDate ? getWeekKey(liveDate) : null;
      const dataMonth = liveDate ? getMonthKey(liveDate) : null;

      records.push({
        brand,
        live_date: liveDate.toISOString().split('T')[0],
        start_time: row[colMap['start_time']] ? String(row[colMap['start_time']]) : null,
        end_time: row[colMap['end_time']] ? String(row[colMap['end_time']]) : null,
        duration_min: parseNumber(row[colMap['duration_min']]),
        live_gmv: parseNumber(row[colMap['live_gmv']]),
        live_payment: parseNumber(row[colMap['live_payment']]),
        refund_amount: parseNumber(row[colMap['refund_amount']]),
        net_gmv: parseNumber(row[colMap['net_gmv']]),
        ad_cost: parseNumber(row[colMap['ad_cost']]),
        data_week: dataWeek,
        data_month: dataMonth,
      });
    }

    await livestreamRepo.clearByBrand(brand);
    if (records.length > 0) {
      await livestreamRepo.batchInsert(records);
    }

    allRecords.push(...records);
    stats.push({ sheet: sheetName, brand, count: records.length });
  }

  return {
    total: allRecords.length,
    sheets: stats,
  };
}

module.exports = { parseVideoExcel, parseLivestreamExcel };
