// 直播间数据访问层 (sql.js async 版)
const { run, get, all, transaction, saveDb } = require('./sql.helper');

class LivestreamRepo {
  async batchInsert(records) {
    await transaction(async () => {
      for (const r of records) {
        await run(`
          INSERT OR REPLACE INTO livestream (
            brand, live_date, start_time, end_time, duration_min,
            live_gmv, live_payment, refund_amount, net_gmv, ad_cost,
            data_week, data_month
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          r.brand, r.live_date, r.start_time, r.end_time, r.duration_min,
          r.live_gmv, r.live_payment, r.refund_amount, r.net_gmv, r.ad_cost,
          r.data_week, r.data_month
        ]);
      }
    });
    saveDb();
  }

  async getWeeklyStats(brand, week) {
    return get(`
      SELECT
        COUNT(*) as live_count,
        SUM(live_gmv) as total_live_gmv,
        SUM(live_payment) as total_payment,
        SUM(refund_amount) as total_refund,
        SUM(net_gmv) as total_net_gmv,
        SUM(ad_cost) as total_ad_cost,
        SUM(duration_min) as total_duration_min
      FROM livestream WHERE brand = ? AND data_week = ?
    `, [brand, week]);
  }

  async clearByBrand(brand) {
    await run('DELETE FROM livestream WHERE brand = ?', [brand]);
    saveDb();
  }
}

module.exports = new LivestreamRepo();
