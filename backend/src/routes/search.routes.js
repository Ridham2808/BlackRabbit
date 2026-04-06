const router   = require('express').Router();
const ctrl     = require('../controllers/search.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/nl',     authorize(PERMISSIONS.SEARCH_AI), ctrl.nlSearch);
router.get('/global', authorize(PERMISSIONS.EQUIPMENT_VIEW), ctrl.globalSearch);

module.exports = router;
