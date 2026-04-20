// 日期处理工具 — ISO 8601 周编号计算

/**
 * 获取日期的 ISO 周编号
 * @param {Date|string} date
 * @returns {string} 格式 YYYY-Www (如 "2026-W15")
 */
function getWeekKey(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = getISOWeekYear(d);
  const week = getISOWeek(d);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * 获取月份键
 * @param {Date|string} date
 * @returns {string} 格式 YYYY-MM
 */
function getMonthKey(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 获取季度键
 * @param {Date|string} date
 * @returns {string} 格式 YYYY-Qn
 */
function getQuarterKey(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `${d.getFullYear()}-Q${q}`;
}

/**
 * 解析 Excel 日期 (可能是数字序列号或字符串)
 * @param {*} value Excel 中的日期值
 * @returns {Date|null}
 */
function parseExcelDate(value) {
  if (!value) return null;

  // 如果是数字 (Excel 日期序列号)
  if (typeof value === 'number') {
    // Excel 日期起始: 1900-01-01 = 1 (有个闰年 bug，1900-02-29 也算 1 天)
    const epoch = new Date(1899, 11, 30); // 1899-12-30
    const d = new Date(epoch.getTime() + value * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }

  // 如果是字符串
  if (typeof value === 'string') {
    // 尝试多种格式
    let d = new Date(value.replace(/\//g, '-'));
    if (!isNaN(d.getTime())) return d;

    // 中文格式: 2026年4月15日
    const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }

    return null;
  }

  // Date 对象
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  return null;
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} dateA
 * @param {Date|string} dateB
 * @returns {number} 天数 (正数表示 dateA 在 dateB 之后)
 */
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 86400000);
}

/**
 * 获取最近 N 周的周编号列表（从当前周往前）
 * @param {number} n 周数
 * @returns {string[]}
 */
function getRecentWeeks(n) {
  const weeks = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d));
  }
  return weeks;
}

// ── 内部 ISO 周计算 ──

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getISOWeekYear(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  return date.getUTCFullYear();
}

/**
 * 获取某周的所有日期范围
 * @param {string} weekKey 格式 YYYY-Www
 * @returns {{ start: Date, end: Date }}
 */
function getWeekRange(weekKey) {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1]);
  const week = parseInt(match[2]);

  // ISO 周: 1月4日所在的周为第1周
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 周一=1
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

/**
 * 解析数值（处理 Excel 中可能的字符串/空值）
 * @param {*} value
 * @param {number} defaultValue
 * @returns {number}
 */
function parseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '' || value === '-') return defaultValue;
  const num = parseFloat(String(value).replace(/,/g, '').replace(/%/g, ''));
  return isNaN(num) ? defaultValue : num;
}

/**
 * 解析百分比（Excel 中可能是小数或百分比字符串）
 * @param {*} value
 * @returns {number} 小数形式 (如 0.15 表示 15%)
 */
function parsePercent(value) {
  if (value === null || value === undefined || value === '' || value === '-') return 0;
  const str = String(value).replace(/%/g, '').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  // 如果大于1，认为是百分比形式，需要除以100
  return num > 1 ? num / 100 : num;
}

module.exports = {
  getWeekKey,
  getMonthKey,
  getQuarterKey,
  parseExcelDate,
  daysBetween,
  getRecentWeeks,
  getWeekRange,
  parseNumber,
  parsePercent,
};
