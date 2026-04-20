// 目标管理路由 (async)
const router = require('express').Router();
const targetRepo = require('../repository/target.repo');

router.get('/', async (req, res) => {
  try {
    const { brand = 'modeng', week, dimension } = req.query;
    if (!week) return res.status(400).json({ error: '缺少 week 参数' });
    if (dimension) {
      res.json(await targetRepo.getOne(brand, week, dimension) || null);
    } else {
      res.json(await targetRepo.getByWeek(brand, week));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const { brand, week, dimension, ...data } = req.body;
    if (!brand || !week || !dimension) return res.status(400).json({ error: '缺少参数' });
    await targetRepo.upsert(brand, week, dimension, data);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/batch', async (req, res) => {
  try {
    const { targets } = req.body;
    if (!Array.isArray(targets) || targets.length === 0) return res.status(400).json({ error: 'targets 必须是非空数组' });
    await targetRepo.batchUpsert(targets);
    res.json({ success: true, count: targets.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
