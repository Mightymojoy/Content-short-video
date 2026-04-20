// 上传路由 (async)
const router = require('express').Router();
const upload = require('../middleware/upload.middleware');

router.post('/video', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    const brand = req.body.brand || 'modeng';
    const { parseVideoExcel } = require('../services/parse.service');
    const result = await parseVideoExcel(req.file.path, brand);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/livestream', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    const { parseLivestreamExcel } = require('../services/parse.service');
    const result = await parseLivestreamExcel(req.file.path);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
