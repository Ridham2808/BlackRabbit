// ============================================================
// PERMISSIONS — Every permission string in the system
// ============================================================

const PERMISSIONS = {
  // Equipment
  EQUIPMENT_VIEW:           'equipment:view',
  EQUIPMENT_CREATE:         'equipment:create',
  EQUIPMENT_UPDATE:         'equipment:update',
  EQUIPMENT_DELETE:         'equipment:delete',
  EQUIPMENT_EXPORT:         'equipment:export',
  EQUIPMENT_IMPORT:         'equipment:import',
  EQUIPMENT_QR_GENERATE:    'equipment:qr_generate',

  // Checkout
  CHECKOUT_VIEW:            'checkout:view',
  CHECKOUT_CREATE:          'checkout:create',
  CHECKOUT_CHECKIN:         'checkout:checkin',
  CHECKOUT_APPROVE:         'checkout:approve',
  CHECKOUT_TRANSFER:        'checkout:transfer',
  CHECKOUT_VIEW_ALL:        'checkout:view_all',

  // Personnel
  PERSONNEL_VIEW:           'personnel:view',
  PERSONNEL_CREATE:         'personnel:create',
  PERSONNEL_UPDATE:         'personnel:update',
  PERSONNEL_DELETE:         'personnel:delete',

  // Maintenance
  MAINTENANCE_VIEW:         'maintenance:view',
  MAINTENANCE_CREATE:       'maintenance:create',
  MAINTENANCE_UPDATE:       'maintenance:update',
  MAINTENANCE_SCHEDULE:     'maintenance:schedule',
  MAINTENANCE_SIGN_OFF:     'maintenance:sign_off',

  // Transfer
  TRANSFER_VIEW:            'transfer:view',
  TRANSFER_REQUEST:         'transfer:request',
  TRANSFER_APPROVE:         'transfer:approve',
  TRANSFER_DISPATCH:        'transfer:dispatch',
  TRANSFER_RECEIVE:         'transfer:receive',

  // Incidents
  INCIDENT_VIEW:            'incident:view',
  INCIDENT_REPORT:          'incident:report',
  INCIDENT_INVESTIGATE:     'incident:investigate',
  INCIDENT_CLOSE:           'incident:close',
  INCIDENT_WITNESS_SUBMIT:  'incident:witness_submit',
  INCIDENT_CO_ACKNOWLEDGE:  'incident:co_acknowledge',
  INCIDENT_RESOLVE:         'incident:resolve',

  // Alerts
  ALERT_VIEW:               'alert:view',
  ALERT_ACKNOWLEDGE:        'alert:acknowledge',
  ALERT_RESOLVE:            'alert:resolve',
  ALERT_DISMISS:            'alert:dismiss',

  // Audit
  AUDIT_VIEW:               'audit:view',
  AUDIT_EXPORT:             'audit:export',

  // Reports
  REPORT_VIEW:              'report:view',
  REPORT_GENERATE:          'report:generate',
  REPORT_EXPORT:            'report:export',

  // Admin
  ADMIN_USER_MANAGE:        'admin:user_manage',
  ADMIN_ROLE_ASSIGN:        'admin:role_assign',
  ADMIN_BASE_CONFIG:        'admin:base_config',
  ADMIN_SYSTEM_CONFIG:      'admin:system_config',

  // Location
  LOCATION_PING:            'location:ping',
  LOCATION_VIEW:            'location:view',

  // Search
  SEARCH_AI:                'search:ai',
};

module.exports = { PERMISSIONS };
