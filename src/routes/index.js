// 路由注册
const router = require('express').Router();

router.use('/dashboard', require('./dashboard'));
router.use('/upload', require('./upload'));
router.use('/target', require('./target'));
router.use('/export', require('./export'));

module.exports = router;
