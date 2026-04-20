// sql.js 适配层 — 提供 async 接口
const { getDb, saveDb } = require('./db');

// 执行 SQL 语句（无返回值）
async function run(sql, params = []) {
  const db = await getDb();
  if (params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}

// 执行多条 SQL
async function exec(sql) {
  const db = await getDb();
  db.run(sql);
}

// 查询单行
async function get(sql, params = []) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// 查询多行
async function all(sql, params = []) {
  const db = await getDb();
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// 事务执行
async function transaction(fn) {
  const db = await getDb();
  db.run('BEGIN');
  try {
    await fn();
    db.run('COMMIT');
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = { run, exec, get, all, transaction, saveDb, getDb };
