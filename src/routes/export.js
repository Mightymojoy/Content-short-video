// 导出路由 — Excel 报表导出
const router = require('express').Router();
const { generateWeeklyReport, generateRunnerReport } = require('../services/export.service');

router.get('/report', async (req, res) => {
  try {
    const { brand = 'modeng', week } = req.query;
    if (!week) return res.status(400).json({ error: '缺少 week 参数' });

    const workbook = await generateWeeklyReport(brand, week);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${brand}-${week}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runner', async (req, res) => {
  try {
    const { brand = 'modeng', quarter } = req.query;
    if (!quarter) return res.status(400).json({ error: '缺少 quarter 参数' });

    const workbook = await generateRunnerReport(brand, quarter);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="runner-report-${brand}-${quarter}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
