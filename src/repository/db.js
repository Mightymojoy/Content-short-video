// 数据库连接管理 — sql.js (WebAssembly SQLite, 无需编译)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const DB_PATH = config.dbPath;
const DB_DIR = path.dirname(DB_PATH);

let _db = null;
let _SQL = null;

async function getDb() {
  if (!_db) {
    if (!_SQL) {
      _SQL = await initSqlJs();
    }
    // 确保目录存在
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // 加载或创建数据库
    if (fs.existsSync(DB_PATH)) {
      const buf = fs.readFileSync(DB_PATH);
      _db = new _SQL.Database(buf);
    } else {
      _db = new _SQL.Database();
    }
  }
  return _db;
}

function saveDb() {
  if (_db && _SQL) {
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function closeDb() {
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

module.exports = { getDb, saveDb, closeDb };
