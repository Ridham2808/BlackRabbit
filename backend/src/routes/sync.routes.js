const router   = require('express').Router();
const ctrl     = require('../controllers/sync.controller');
const { authenticate } = require('../middleware/authenticate');
const { offlineSyncLimiter } = require('../config/rateLimiter');

router.use(authenticate);

router.post('/process', offlineSyncLimiter, ctrl.processQueue);
router.get('/status',   ctrl.getQueueStatus);

module.exports = router;
