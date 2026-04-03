// ============================================================
// AUTH CONTROLLER
// ============================================================
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseFormatter');
const { AUDIT_ACTIONS } = require('../constants/alertTypes');
const auditService = require('../services/audit.service');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  async login(req, res) {
    const { email, password, deviceToken, deviceType } = req.body;
    const result = await authService.login({
      email, password, deviceToken, deviceType,
      ip: req.ip, requestId: req.requestId,
    });

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
    auditService.createLog({ action: AUDIT_ACTIONS.LOGIN_SUCCESS, performedBy: result.user, ip: req.ip, deviceType: deviceType || 'WEB' });
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
  },

  async refresh(req, res) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    const result = await authService.refresh(token);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
    sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  },

  async logout(req, res) {
    const { userId, sessionId } = req.user;
    await authService.logout(userId, sessionId);
    res.clearCookie('refreshToken');
    auditService.createLog({ action: AUDIT_ACTIONS.LOGOUT, performedBy: req.user, ip: req.ip });
    sendSuccess(res, null, 'Logged out');
  },

  async me(req, res) {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  },
};
