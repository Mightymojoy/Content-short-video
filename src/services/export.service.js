// Excel 导出服务 — 使用 ExcelJS 生成带样式的报表
const ExcelJS = require('exceljs');
const dashboardService = require('./dashboard.service');
const { getQuarterKey } = require('../utils/date.helper');

/**
 * 生成周度报表 Excel
 * 包含: 总览数据、源头分析、形式监控
 */
async function generateWeeklyReport(brand, week) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '短视频数据看板';
  workbook.created = new Date();

  // 获取数据
  const [overview, sourceData, formatData] = await Promise.all([
    dashboardService.getOverview(brand, week),
    dashboardService.getSourceAnalysis(brand, week),
    dashboardService.getFormatAnalysis(brand, week),
  ]);

  // ── Sheet 1: 周度总览 ──
  const ws1 = workbook.addWorksheet('周度总览', {
    properties: { tabColor: { argb: 'FF6366F1' } },
  });

  // 样式定义
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } },
  };

  const titleStyle = {
    font: { bold: true, size: 14, color: { argb: 'FF1F2937' } },
    alignment: { vertical: 'middle' },
  };

  const labelStyle = {
    font: { size: 11, color: { argb: 'FF6B7280' } },
    alignment: { vertical: 'middle' },
  };

  const valueStyle = {
    font: { bold: true, size: 12, color: { argb: 'FF1F2937' } },
    alignment: { vertical: 'middle' },
  };

  // 标题行
  ws1.mergeCells('A1:D1');
  ws1.getCell('A1').value = `周度数据报表 — ${week}`;
  ws1.getCell('A1').style = titleStyle;
  ws1.getRow(1).height = 36;

  // 总览 KPI 卡片
  const kpiData = [
    ['短视频总 GMV', fmtNum(overview.video.total_gmv), `共 ${overview.video.total_count} 条视频`],
    ['GMV 占比', fmtPercent(overview.target.gmv_ratio), `目标 ${fmtPercent(overview.target.target_gmv_ratio)}`],
    ['新视频 GMV', fmtNum(overview.video.new_gmv), `贡献率 ${fmtPercent(overview.target.new_video_gmv_ratio)}`],
    ['目标达成率', fmtPercent2(overview.target.completion_rate), `目标 GMV ${fmtNum(overview.target.target_gmv)}`],
    ['直播间 GMV', fmtNum(overview.livestream.total_gmv), `共 ${overview.livestream.live_count} 场`],
    ['有效视频数', String(overview.video.effective_count), 'GMV≥1000 且上线≥5天'],
    ['当周新上传', String(overview.video.new_count), '条新视频'],
  ];

  ws1.addRow([]);
  ws1.addRow(['指标', '数值', '备注']);
  const headerRow = ws1.getRow(ws1.rowCount);
  headerRow.eachCell((cell) => { cell.style = headerStyle; });
  headerRow.height = 28;

  kpiData.forEach(([label, value, note]) => {
    const row = ws1.addRow([label, value, note]);
    row.getCell(1).style = labelStyle;
    row.getCell(2).style = valueStyle;
    row.getCell(3).style = labelStyle;
  });

  // 列宽
  ws1.getColumn(1).width = 22;
  ws1.getColumn(2).width = 20;
  ws1.getColumn(3).width = 30;

  // ── Sheet 2: 源头分析 ──
  const ws2 = workbook.addWorksheet('源头分析', {
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  ws2.mergeCells('A1:H1');
  ws2.getCell('A1').value = `制作源头分析 — ${week}`;
  ws2.getCell('A1').style = titleStyle;
  ws2.getRow(1).height = 36;

  const sourceHeaders = ['源头', '视频数', '总 GMV', '平均 GMV', 'GMV 占比', '目标制作数', '实际制作数'];
  ws2.addRow(sourceHeaders);
  const sHeaderRow = ws2.getRow(ws2.rowCount);
  sHeaderRow.eachCell((cell) => { cell.style = headerStyle; });
  sHeaderRow.height = 28;

  const allSources = [...sourceData.groups, ...sourceData.others];
  allSources.forEach((s) => {
    ws2.addRow([
      s.name, s.video_count, fmtNum(s.total_gmv),
      fmtNum(s.avg_gmv), fmtPercent(s.gmv_ratio),
      s.target?.target_video_count || '-',
      s.target?.actual_video_count || '-',
    ]);
  });

  // 源头列宽
  ws2.getColumn(1).width = 18;
  ws2.getColumn(2).width = 12;
  ws2.getColumn(3).width = 18;
  ws2.getColumn(4).width = 18;
  ws2.getColumn(5).width = 14;
  ws2.getColumn(6).width = 14;
  ws2.getColumn(7).width = 14;

  // ── Sheet 3: 形式监控 ──
  const ws3 = workbook.addWorksheet('形式监控', {
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  ws3.mergeCells('A1:H1');
  ws3.getCell('A1').value = `视频形式效果对比 — ${week}`;
  ws3.getCell('A1').style = titleStyle;
  ws3.getRow(1).height = 36;

  const formatHeaders = ['视频形式', '数量', '总 GMV', '展现次数', '消耗', 'ROI', '点击率', '转化率'];
  ws3.addRow(formatHeaders);
  const fHeaderRow = ws3.getRow(ws3.rowCount);
  fHeaderRow.eachCell((cell) => { cell.style = headerStyle; });
  fHeaderRow.height = 28;

  (formatData.formats || []).forEach((f) => {
    ws3.addRow([
      f.video_format, f.video_count, fmtNum(f.total_gmv),
      fmtNum(f.total_impressions), fmtNum(f.total_cost),
      f.avg_roi ? f.avg_roi.toFixed(2) : '-',
      fmtPercent(f.avg_ctr),
      fmtPercent(f.avg_cvr),
    ]);
  });

  // 形式列宽
  ws3.getColumn(1).width = 14;
  for (let c = 2; c <= 8; c++) ws3.getColumn(c).width = 16;

  return workbook;
}

/**
 * 生成季度跑量报表 Excel
 */
async function generateRunnerReport(brand, quarter) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '短视频数据看板';
  workbook.created = new Date();

  const runnerData = await dashboardService.getRunnerStats(brand, quarter);

  const ws = workbook.addWorksheet('季度跑量统计', {
    properties: { tabColor: { argb: 'FFEF4444' } },
  });

  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };

  const titleStyle = {
    font: { bold: true, size: 14, color: { argb: 'FF1F2937' } },
  };

  ws.mergeCells('A1:E1');
  ws.getCell('A1').value = `季度跑量统计 — ${brand} — ${quarter}`;
  ws.getCell('A1').style = titleStyle;
  ws.getRow(1).height = 36;

  const headers = ['分类', '≥5万条数', '≥1万条数', '总视频数'];
  ws.addRow(headers);
  const hRow = ws.getRow(ws.rowCount);
  hRow.eachCell((cell) => { cell.style = headerStyle; });
  hRow.height = 28;

  ws.addRow(['内部(含ITO)', runnerData.internal.count_g50k, runnerData.internal.count_g10k, runnerData.internal.total_count]);
  ws.addRow(['外部', runnerData.external.count_g50k, runnerData.external.count_g10k, runnerData.external.total_count]);
  ws.addRow(['合计', runnerData.total.count_g50k, runnerData.total.count_g10k, runnerData.total.total_count]);

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 14;

  return workbook;
}

// ── 工具函数 ──

function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtPercent(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return (n * 100).toFixed(1) + '%';
}

function fmtPercent2(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return n.toFixed(1) + '%';
}

module.exports = { generateWeeklyReport, generateRunnerReport };
