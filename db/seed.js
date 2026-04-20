// 历史数据一键导入脚本
// 用法: node db/seed.js [Excel文件路径]
// 默认路径: uploads/内容短视频-数据报表.xlsx
const path = require('path');
const config = require('../config');
const { parseVideoExcel, parseLivestreamExcel } = require('../src/services/parse.service');

const filePath = process.argv[2] || path.join(config.uploadsDir, '内容短视频-数据报表.xlsx');

console.log('[seed] ========================================');
console.log(`[seed] 开始导入历史数据...`);
console.log(`[seed] 文件: ${filePath}`);
console.log('[seed] ========================================');

async function main() {
  try {
    // 1. 导入短视频数据
    console.log('\n[seed] 📹 导入短视频数据...');
    // 导入时 brand 暂用 modeng，后续可按需分品牌导入
    const videoResult = await parseVideoExcel(filePath, 'modeng');
    console.log(`[seed]   Sheet: ${videoResult.sheet}`);
    console.log(`[seed]   总行数: ${videoResult.total}`);
    console.log(`[seed]   成功导入: ${videoResult.imported} 条`);

    // 2. 导入直播间数据
    console.log('\n[seed] 📡 导入直播间数据...');
    const liveResult = await parseLivestreamExcel(filePath);
    console.log(`[seed]   总导入: ${liveResult.total} 条`);
    for (const s of liveResult.sheets) {
      console.log(`[seed]   Sheet "${s.sheet}" → ${s.brand}: ${s.count} 条`);
    }

    console.log('\n[seed] ========================================');
    console.log('[seed] 历史数据导入完成 ✅');
    console.log('[seed] ========================================');
  } catch (err) {
    console.error('\n[seed] ❌ 导入失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }

  process.exit(0);
}

main();
