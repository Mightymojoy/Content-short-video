// 看板数据查询路由 (async)
const router = require('express').Router();
const svc = require('../services/dashboard.service');

router.get('/overview', async (req, res) => {
  try {
    const { brand = 'modeng', week } = req.query;
    if (!week) return res.status(400).json({ error: '缺少 week 参数' });
    res.json(await svc.getOverview(brand, week));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/source', async (req, res) => {
  try {
    const { brand = 'modeng', week } = req.query;
    if (!week) return res.status(400).json({ error: '缺少 week 参数' });
    res.json(await svc.getSourceAnalysis(brand, week));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/format', async (req, res) => {
  try {
    const { brand = 'modeng', week } = req.query;
    if (!week) return res.status(400).json({ error: '缺少 week 参数' });
    res.json(await svc.getFormatAnalysis(brand, week));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/runner', async (req, res) => {
  try {
    const { brand = 'modeng', quarter } = req.query;
    if (!quarter) return res.status(400).json({ error: '缺少 quarter 参数' });
    res.json(await svc.getRunnerStats(brand, quarter));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/trend', async (req, res) => {
  try {
    const { brand = 'modeng', weeks = 8 } = req.query;
    res.json(await svc.getTrend(brand, parseInt(weeks)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/weeks', async (req, res) => {
  try {
    const { brand = 'modeng' } = req.query;
    const weeks = await svc.getAvailableWeeks(brand);
    res.json({ brand, weeks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/brands', (req, res) => {
  res.json(require('../../config').brands);
});

module.exports = router;
