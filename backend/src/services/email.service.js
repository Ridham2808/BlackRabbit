// ============================================================
// EMAIL SERVICE — Nodemailer for credential delivery
// ============================================================

const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

// Lazy-init transporter so missing SMTP config doesn't crash boot
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn('Email service: SMTP not configured — emails disabled');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Send auto-generated credentials to a newly created personnel account.
 */
async function sendCredentials({ to, fullName, role, serviceNumber, password, badgeNumber, baseUrl }) {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(`Email skipped (SMTP not configured): credentials for ${to}`);
    return { skipped: true };
  }

  const roleLabel = {
    SERGEANT: 'Sergeant',
    SOLDIER:  'Soldier',
    OFFICER:  'Officer',
  }[role] || role;

  const roleColor = {
    SERGEANT: '#f59e0b',
    SOLDIER:  '#3b82f6',
    OFFICER:  '#dc2626',
  }[role] || '#374151';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEAS Access Credentials</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e2a3a,#0f172a);padding:32px;text-align:center;border-bottom:1px solid #334155;">
            <div style="width:64px;height:64px;background:${roleColor};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">🛡️</div>
            <h1 style="color:#f8fafc;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">DEAS ACCESS GRANTED</h1>
            <p style="color:#64748b;margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Defence Equipment Accountability System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
              Hello <strong style="color:#f1f5f9;">${fullName}</strong>,<br><br>
              Your access to the DEAS system has been provisioned. Below are your login credentials.
            </p>

            <!-- Role Badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="background:${roleColor}22;color:${roleColor};border:1px solid ${roleColor}44;border-radius:20px;padding:6px 20px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                ${roleLabel}
              </span>
            </div>

            <!-- Credentials Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #1e293b;overflow:hidden;margin-bottom:24px;">
              <tr><td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                      <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Full Name</span>
                      <span style="color:#f1f5f9;font-size:14px;font-weight:600;">${fullName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                      <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Service Number</span>
                      <span style="color:#f1f5f9;font-size:14px;font-weight:700;font-family:monospace;">${serviceNumber}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                      <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Badge Number</span>
                      <span style="color:${roleColor};font-size:14px;font-weight:700;font-family:monospace;">${badgeNumber}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Temporary Password</span>
                      <span style="color:#fbbf24;font-size:16px;font-weight:700;font-family:monospace;background:#1e293b;padding:8px 16px;border-radius:8px;display:inline-block;letter-spacing:0.05em;">${password}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Warning -->
            <div style="background:#7c2d1222;border:1px solid #7c2d1244;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="color:#fca5a5;margin:0;font-size:13px;line-height:1.6;">
                ⚠️ <strong>Change your password immediately</strong> after first login. Do not share these credentials with anyone.
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${baseUrl || 'http://localhost:5173'}/login"
                 style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;display:inline-block;letter-spacing:0.05em;">
                LOGIN TO DEAS →
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:20px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#475569;margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
              DEAS SYSTEM V1.4 // CLASSIFIED // DO NOT FORWARD
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM || '"DEAS System" <noreply@deas.mil>',
    to,
    subject: `[DEAS] Your Access Credentials — ${roleLabel} ${badgeNumber}`,
    html,
  });

  logger.info('Credentials email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

module.exports = { sendCredentials };
