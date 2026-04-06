const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validateRequest');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validators');
const { authLimiter } = require('../config/rateLimiter');

router.post('/login',          authLimiter, validate(loginSchema), ctrl.login);
router.post('/officer-signup', authLimiter, ctrl.officerSignup);  // Officer self-registration
router.post('/refresh',        ctrl.refresh);
router.post('/logout',         authenticate, ctrl.logout);
router.get('/me',              authenticate, ctrl.me);

// Public: fetch bases & units for signup form (no auth)
router.get('/bases', ctrl.getBases);
router.get('/units', ctrl.getUnits);

module.exports = router;
