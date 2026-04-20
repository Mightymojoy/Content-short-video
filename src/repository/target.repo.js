// 目标数据访问层 (sql.js async 版)
const { run, get, all, transaction, saveDb } = require('./sql.helper');

class TargetRepo {
  async getByWeek(brand, week) {
    return all('SELECT * FROM targets WHERE brand = ? AND week = ?', [brand, week]);
  }

  async getOne(brand, week, dimension) {
    return get('SELECT * FROM targets WHERE brand = ? AND week = ? AND dimension = ?', [brand, week, dimension]);
  }

  async upsert(brand, week, dimension, data) {
    await run(`
      INSERT INTO targets (brand, week, dimension, target_video_count, target_gmv_ratio_all, target_gmv_ratio_new, target_avg_gmv, actual_video_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(brand, week, dimension) DO UPDATE SET
        target_video_count = excluded.target_video_count,
        target_gmv_ratio_all = excluded.target_gmv_ratio_all,
        target_gmv_ratio_new = excluded.target_gmv_ratio_new,
        target_avg_gmv = excluded.target_avg_gmv,
        actual_video_count = excluded.actual_video_count,
        updated_at = datetime('now', 'localtime')
    `, [
      brand, week, dimension,
      data.target_video_count || 0,
      data.target_gmv_ratio_all || 0,
      data.target_gmv_ratio_new || 0,
      data.target_avg_gmv || 0,
      data.actual_video_count || 0,
    ]);
    saveDb();
  }

  async batchUpsert(records) {
    await transaction(async () => {
      for (const r of records) {
        await this.upsert(r.brand, r.week, r.dimension, r);
      }
    });
  }
}

module.exports = new TargetRepo();
