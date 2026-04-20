// 数据库初始化脚本 — 建表 (sql.js 版本)
const path = require('path');
const fs = require('fs');
const config = require('../config');
const initSqlJs = require('sql.js');

console.log('[init] 开始创建数据表...');

async function main() {
  const SQL = await initSqlJs();
  const DB_DIR = path.dirname(config.dbPath);
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  let db;
  if (fs.existsSync(config.dbPath)) {
    db = new SQL.Database(fs.readFileSync(config.dbPath));
  } else {
    db = new SQL.Database();
  }

  function execSql(sql) { db.run(sql); }

  async function saveDbAsync() {
    const data = db.export();
    fs.writeFileSync(config.dbPath, Buffer.from(data));
  }
  // ── videos 表 ──
  execSql(`
    CREATE TABLE IF NOT EXISTS videos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      brand           TEXT    NOT NULL DEFAULT 'modeng',
      video_name      TEXT,
      video_id        TEXT,
      upload_date     TEXT,
      upload_time     TEXT,
      source_raw      TEXT,
      source          TEXT,
      video_format    TEXT,
      tag             TEXT,
      impressions     INTEGER DEFAULT 0,
      ctr             REAL    DEFAULT 0,
      cvr             REAL    DEFAULT 0,
      cost            REAL    DEFAULT 0,
      roi             REAL    DEFAULT 0,
      gmv             REAL    DEFAULT 0,
      actual_payment  REAL    DEFAULT 0,
      days_online     INTEGER DEFAULT 0,
      data_week       TEXT,
      data_month      TEXT,
      upload_week     TEXT,
      upload_month    TEXT,
      created_at      TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at      TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // ── livestream 表 ──
  execSql(`
    CREATE TABLE IF NOT EXISTS livestream (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      brand           TEXT    NOT NULL DEFAULT 'modeng',
      live_date       TEXT,
      start_time      TEXT,
      end_time        TEXT,
      duration_min    INTEGER DEFAULT 0,
      live_gmv        REAL    DEFAULT 0,
      live_payment    REAL    DEFAULT 0,
      refund_amount   REAL    DEFAULT 0,
      net_gmv         REAL    DEFAULT 0,
      ad_cost         REAL    DEFAULT 0,
      data_week       TEXT,
      data_month      TEXT,
      created_at      TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // ── targets 表 ──
  execSql(`
    CREATE TABLE IF NOT EXISTS targets (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      brand             TEXT    NOT NULL DEFAULT 'modeng',
      week              TEXT    NOT NULL,
      dimension         TEXT    NOT NULL DEFAULT 'overall',
      target_video_count   INTEGER DEFAULT 0,
      target_gmv_ratio_all  REAL    DEFAULT 0,
      target_gmv_ratio_new  REAL    DEFAULT 0,
      target_avg_gmv       REAL    DEFAULT 0,
      actual_video_count   INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at        TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(brand, week, dimension)
    )
  `);

  // ── format_stats 表 ──
  execSql(`
    CREATE TABLE IF NOT EXISTS format_stats (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      brand             TEXT    NOT NULL DEFAULT 'modeng',
      week              TEXT    NOT NULL,
      video_format      TEXT    NOT NULL,
      total_gmv         REAL    DEFAULT 0,
      total_impressions INTEGER DEFAULT 0,
      total_cost        REAL    DEFAULT 0,
      avg_roi           REAL    DEFAULT 0,
      avg_ctr           REAL    DEFAULT 0,
      avg_cvr           REAL    DEFAULT 0,
      video_count       INTEGER DEFAULT 0,
      calculated_at     TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(brand, week, video_format)
    )
  `);

  // ── 索引 ──
  execSql(`
    CREATE INDEX IF NOT EXISTS idx_videos_brand_week    ON videos(brand, data_week);
    CREATE INDEX IF NOT EXISTS idx_videos_source         ON videos(source);
    CREATE INDEX IF NOT EXISTS idx_videos_format         ON videos(video_format);
    CREATE INDEX IF NOT EXISTS idx_livestream_brand_week ON livestream(brand, data_week);
    CREATE INDEX IF NOT EXISTS idx_targets_brand_week    ON targets(brand, week);
    CREATE INDEX IF NOT EXISTS idx_format_stats_brand_week ON format_stats(brand, week);
  `);

  await saveDbAsync();
  db.close();

  console.log('[init] 数据表创建完成 ✅');
}

main().catch(err => {
  console.error('[init] ❌ 失败:', err.message);
  process.exit(1);
});
