// ============================================================
// QR GENERATOR — Generates QR code data-URL for an equipment item
// ============================================================

const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Generate a QR code PNG file and return its relative URL.
 * The QR code encodes a JSON payload with the equipment id and serial.
 */
async function generateQRCode(equipmentId, serialNumber) {
  const payload = JSON.stringify({
    type:   'DEAS_EQUIPMENT',
    id:     equipmentId,
    serial: serialNumber,
  });

  // Ensure qr_codes dir exists
  const qrDir = path.join(UPLOAD_DIR, 'qr_codes');
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }

  const filename = `qr_${serialNumber.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const filepath  = path.join(qrDir, filename);

  await QRCode.toFile(filepath, payload, {
    type:           'png',
    color:          { dark: '#0A0F1E', light: '#FFFFFF' },
    width:          400,
    errorCorrectionLevel: 'H',
    margin:         2,
  });

  return `/uploads/qr_codes/${filename}`;
}

/**
 * Generate QR as base64 data URL (for inline embedding)
 */
async function generateQRCodeDataURL(equipmentId, serialNumber) {
  const payload = JSON.stringify({
    type:   'DEAS_EQUIPMENT',
    id:     equipmentId,
    serial: serialNumber,
  });

  const dataUrl = await QRCode.toDataURL(payload, {
    type:                 'image/png',
    color:                { dark: '#0A0F1E', light: '#FFFFFF' },
    width:                400,
    errorCorrectionLevel: 'H',
    margin:               2,
  });

  return dataUrl;
}

module.exports = { generateQRCode, generateQRCodeDataURL };
