// 看板聚合查询 (sql.js async 版)
const { get, all } = require('./sql.helper');

class DashboardRepo {
  async getWeeklyTrend(brand, weeks) {
    if (!weeks || weeks.length === 0) return [];
    const placeholders = weeks.map(() => '?').join(',');
    return all(`
      SELECT data_week,
        COUNT(*) as video_count, SUM(gmv) as total_gmv,
        SUM(impressions) as total_impressions, SUM(cost) as total_cost,
        AVG(roi) as avg_roi
      FROM videos WHERE brand = ? AND data_week IN (${placeholders})
      GROUP BY data_week ORDER BY data_week ASC
    `, [brand, ...weeks]);
  }

  async getSourceWeeklyStats(brand, week) {
    return all(`
      SELECT source, COUNT(*) as video_count, SUM(gmv) as total_gmv, AVG(gmv) as avg_gmv, SUM(impressions) as total_impressions
      FROM videos WHERE brand = ? AND data_week = ? GROUP BY source
    `, [brand, week]);
  }

  async getFormatWeeklyStats(brand, week) {
    return all(`
      SELECT video_format, COUNT(*) as video_count, SUM(gmv) as total_gmv,
        SUM(impressions) as total_impressions, SUM(cost) as total_cost,
        AVG(roi) as avg_roi, AVG(ctr) as avg_ctr, AVG(cvr) as avg_cvr
      FROM videos WHERE brand = ? AND data_week = ? GROUP BY video_format
    `, [brand, week]);
  }

  async getEffectiveCount(brand, week, refDate) {
    const dateStr = refDate || new Date().toISOString().split('T')[0];
    const row = await get(`
      SELECT COUNT(*) as cnt FROM videos
      WHERE brand = ? AND data_week = ? AND gmv >= 1000
        AND julianday(?) - julianday(upload_date) >= 5
    `, [brand, week, dateStr]);
    return row?.cnt || 0;
  }
}

module.exports = new DashboardRepo();
