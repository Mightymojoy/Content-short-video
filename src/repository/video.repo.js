// 视频数据访问层 (sql.js async 版)
const { run, get, all, transaction, saveDb } = require('./sql.helper');

class VideoRepo {
  async batchInsert(records) {
    await transaction(async () => {
      for (const r of records) {
        await run(`
          INSERT OR REPLACE INTO videos (
            brand, video_name, video_id, upload_date, upload_time,
            source_raw, source, video_format, tag,
            impressions, ctr, cvr, cost, roi, gmv, actual_payment, days_online,
            data_week, data_month, upload_week, upload_month
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          r.brand, r.video_name, r.video_id, r.upload_date, r.upload_time,
          r.source_raw, r.source, r.video_format, r.tag,
          r.impressions, r.ctr, r.cvr, r.cost, r.roi, r.gmv, r.actual_payment, r.days_online,
          r.data_week, r.data_month, r.upload_week, r.upload_month
        ]);
      }
    });
    saveDb();
  }

  async getByWeek(brand, week) {
    return all('SELECT * FROM videos WHERE brand = ? AND data_week = ?', [brand, week]);
  }

  async getNewVideosByWeek(brand, week) {
    return all('SELECT * FROM videos WHERE brand = ? AND upload_week = ?', [brand, week]);
  }

  async getWeeklyStats(brand, week) {
    return get(`
      SELECT
        COUNT(*) as video_count,
        SUM(gmv) as total_gmv,
        SUM(impressions) as total_impressions,
        SUM(cost) as total_cost,
        AVG(roi) as avg_roi,
        AVG(ctr) as avg_ctr,
        AVG(cvr) as avg_cvr,
        SUM(actual_payment) as total_payment
      FROM videos WHERE brand = ? AND data_week = ?
    `, [brand, week]);
  }

  async getWeeklyStatsBySource(brand, week) {
    return all(`
      SELECT source, COUNT(*) as video_count, SUM(gmv) as total_gmv, AVG(gmv) as avg_gmv
      FROM videos WHERE brand = ? AND data_week = ? GROUP BY source
    `, [brand, week]);
  }

  async getWeeklyStatsByFormat(brand, week) {
    return all(`
      SELECT
        video_format, COUNT(*) as video_count, SUM(gmv) as total_gmv,
        SUM(impressions) as total_impressions, SUM(cost) as total_cost,
        AVG(roi) as avg_roi, AVG(ctr) as avg_ctr, AVG(cvr) as avg_cvr
      FROM videos WHERE brand = ? AND data_week = ? GROUP BY video_format
    `, [brand, week]);
  }

  async getByQuarter(brand, quarter) {
    const [year, q] = quarter.split('-Q');
    const qNum = parseInt(q);
    const startMonth = (qNum - 1) * 3 + 1;
    const endMonth = qNum * 3;
    return all(`
      SELECT * FROM videos
      WHERE brand = ? AND data_month >= ? AND data_month <= ?
      ORDER BY upload_date ASC
    `, [brand, `${year}-${String(startMonth).padStart(2, '0')}`, `${year}-${String(endMonth).padStart(2, '0')}`]);
  }

  async getAvailableWeeks(brand) {
    const rows = await all(`
      SELECT DISTINCT data_week as w FROM videos WHERE brand = ? AND data_week IS NOT NULL
      ORDER BY w DESC
    `, [brand]);
    return rows.map(r => r.w);
  }

  async clearByBrand(brand) {
    await run('DELETE FROM videos WHERE brand = ?', [brand]);
    saveDb();
  }
}

module.exports = new VideoRepo();
