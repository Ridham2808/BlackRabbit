# 🛡️ BlackRabbit — Git Commit Guide (Two-Phase)
# Current Branch: dev/phase-1-foundation
# Git Bash Location: /e/Coding Geeta/blackRabbit/BlackRabbit
#
# PHASE 1 (46 commits) → on branch: dev/phase-1-foundation
# PHASE 2 (106 commits) → on branch: main
#
# Copy each block ONE BY ONE into Git Bash

# =====================================================================
#  ██████╗ ██╗  ██╗ █████╗ ███████╗███████╗     ██╗
#  ██╔══██╗██║  ██║██╔══██╗██╔════╝██╔════╝    ███║
#  ██████╔╝███████║███████║███████╗█████╗      ╚██║
#  ██╔═══╝ ██╔══██║██╔══██║╚════██║██╔══╝       ██║
#  ██║     ██║  ██║██║  ██║███████║███████╗     ██║
#  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝
#
#  BRANCH: dev/phase-1-foundation
#  FILES: Modified tracked files (46 commits)
# =====================================================================

# ── ROOT FILES ───────────────────────────────────────────────────────

# COMMIT 1
git add .gitignore
git commit -m "chore: update gitignore to cover all env files, node_modules, logs, uploads, SSL certs, and OS artifacts"

# COMMIT 2
git add README.md
git commit -m "docs: rewrite README with full project overview, architecture diagram, tech stack, API reference, roles, setup guide, and security checklist"

# COMMIT 3
git add docker-compose.yml
git commit -m "chore: configure docker-compose with Redis, PostgreSQL, backend API, AI service, web app, and Nginx services"

# ── DATABASE ─────────────────────────────────────────────────────────

# COMMIT 4
git add db/init.sql
git commit -m "feat(db): update PostgreSQL schema with complete 16-table structure, pgvector, indexes, and referential integrity constraints"

# COMMIT 5
git add db/seed.sql
git commit -m "feat(db): update demo seed data with 15 users across all military roles, 20+ equipment items, bases, and unit records"

# ── BACKEND ROOT ─────────────────────────────────────────────────────

# COMMIT 6
git add backend/package.json
git commit -m "chore(backend): update dependencies including Express, JWT, Redis, Socket.io, Winston, Joi, and QRCode packages"

# COMMIT 7
git add backend/app.js
git commit -m "feat(backend): update Express app with Helmet security, CORS, rate limiting, Morgan logging, and all 17 API route mounts"

# ── BACKEND CONFIG ───────────────────────────────────────────────────

# COMMIT 8
git add backend/src/config/database.js
git commit -m "feat(backend/config): update PostgreSQL connection pool with SSL support, connection retry logic, and pool health monitoring"

# ── BACKEND CONSTANTS ────────────────────────────────────────────────

# COMMIT 9
git add backend/src/constants/roles.js
git commit -m "feat(backend/constants): update system roles to include all 8 military roles - SOLDIER through SUPER_ADMIN"

# COMMIT 10
git add backend/src/constants/permissions.js
git commit -m "feat(backend/constants): update permission set to 40+ fine-grained RBAC permissions across all 12 system domains"

# COMMIT 11
git add backend/src/constants/rolePermissions.js
git commit -m "feat(backend/constants): update role-to-permission mapping for all 8 military roles with correct access levels"

# ── BACKEND MIDDLEWARE ───────────────────────────────────────────────

# COMMIT 12
git add backend/src/middleware/authenticate.js
git commit -m "feat(backend/middleware): update JWT authentication with access token verification, Redis session check, and token rotation"

# COMMIT 13
git add backend/src/middleware/authorize.js
git commit -m "feat(backend/middleware): update RBAC authorization middleware to enforce granular permission checks per route"

# COMMIT 14
git add backend/src/middleware/scopeFilter.js
git commit -m "feat(backend/middleware): update base-scoped data isolation to strictly restrict users to their assigned base records"

# ── BACKEND QUERIES ──────────────────────────────────────────────────

# COMMIT 15
git add backend/src/queries/auth.queries.js
git commit -m "feat(backend/queries): update auth SQL queries for user lookup, session management, base and unit retrieval"

# COMMIT 16
git add backend/src/queries/checkout.queries.js
git commit -m "feat(backend/queries): update checkout SQL queries for issuance, check-in, custody chain, and overdue record detection"

# COMMIT 17
git add backend/src/queries/incident.queries.js
git commit -m "feat(backend/queries): update incident SQL queries for multi-asset reporting, investigation log, and evidence management"

# ── BACKEND VALIDATORS ───────────────────────────────────────────────

# COMMIT 18
git add backend/src/validators/auth.validators.js
git commit -m "feat(backend/validators): update Joi schemas for login, officer signup, and password change request validation"

# COMMIT 19
git add backend/src/validators/checkout.validators.js
git commit -m "feat(backend/validators): update Joi schemas for checkout creation, check-in, and transfer request body validation"

# COMMIT 20
git add backend/src/validators/equipment.validators.js
git commit -m "feat(backend/validators): update Joi schemas for equipment CRUD and list query parameter validation"

# COMMIT 21
git add backend/src/validators/incident.validators.js
git commit -m "feat(backend/validators): update Joi schemas for incident report submission and resolution request validation"

# COMMIT 22
git add backend/src/validators/personnel.validators.js
git commit -m "feat(backend/validators): update Joi schemas for personnel creation and profile update validation"

# ── BACKEND SERVICES ─────────────────────────────────────────────────

# COMMIT 23
git add backend/src/services/auth.service.js
git commit -m "feat(backend/services): update auth service with secure login, JWT issuance, refresh token rotation, and Redis session cleanup"

# COMMIT 24
git add backend/src/services/alert.service.js
git commit -m "feat(backend/services): update alert service with auto-generation triggers, acknowledgment, resolution, and escalation logic"

# COMMIT 25
git add backend/src/services/checkout.service.js
git commit -m "feat(backend/services): update checkout service with QR-based equipment issuance, check-in flow, and custody chain update"

# COMMIT 26
git add backend/src/services/incident.service.js
git commit -m "feat(backend/services): update incident service with multi-asset report flow, investigation logging, evidence handling, and stolen equipment auto-escalation"

# COMMIT 27
git add backend/src/services/location.service.js
git commit -m "feat(backend/services): update location service to process mobile GPS pings, persist location history, and flag stale positions"

# COMMIT 28
git add backend/src/services/transfer.service.js
git commit -m "feat(backend/services): update transfer service with full inter-base request, approval, dispatch, and receive workflow"

# ── BACKEND CONTROLLERS ──────────────────────────────────────────────

# COMMIT 29
git add backend/src/controllers/auth.controller.js
git commit -m "feat(backend/controllers): update auth controller with login, officer signup, token refresh, logout, and profile endpoints"

# COMMIT 30
git add backend/src/controllers/admin.controller.js
git commit -m "feat(backend/controllers): update admin controller for user management, role assignment, and base configuration"

# COMMIT 31
git add backend/src/controllers/alert.controller.js
git commit -m "feat(backend/controllers): update alert controller for listing, acknowledging, resolving, and dismissing system alerts"

# COMMIT 32
git add backend/src/controllers/checkout.controller.js
git commit -m "feat(backend/controllers): update checkout controller for QR-based issuance, check-in, and full custody chain retrieval"

# COMMIT 33
git add backend/src/controllers/equipment.controller.js
git commit -m "feat(backend/controllers): update equipment controller with full CRUD, QR generation, serial lookup, and dashboard stats"

# COMMIT 34
git add backend/src/controllers/incident.controller.js
git commit -m "feat(backend/controllers): update incident controller for reporting, investigation entries, evidence upload, and CO acknowledgment"

# COMMIT 35
git add backend/src/controllers/location.controller.js
git commit -m "feat(backend/controllers): update location controller for GPS ping processing and equipment location history retrieval"

# COMMIT 36
git add backend/src/controllers/report.controller.js
git commit -m "feat(backend/controllers): update report controller for generating equipment, checkout, and personnel reports with export support"

# COMMIT 37
git add backend/src/controllers/sync.controller.js
git commit -m "feat(backend/controllers): update sync controller to handle batched offline queue payloads from mobile on reconnect"

# ── BACKEND ROUTES ───────────────────────────────────────────────────

# COMMIT 38
git add backend/src/routes/auth.routes.js
git commit -m "feat(backend/routes): update auth routes with rate-limited login, signup, token refresh, logout, and profile endpoints"

# COMMIT 39
git add backend/src/routes/admin.routes.js
git commit -m "feat(backend/routes): update admin routes with SUPER_ADMIN permission guards for user and system management"

# COMMIT 40
git add backend/src/routes/alert.routes.js
git commit -m "feat(backend/routes): update alert routes with RBAC guards for view, acknowledge, resolve, and dismiss actions"

# COMMIT 41
git add backend/src/routes/equipment.routes.js
git commit -m "feat(backend/routes): update equipment routes with permission guards for CRUD, QR generation, and custody chain"

# COMMIT 42
git add backend/src/routes/incident.routes.js
git commit -m "feat(backend/routes): update incident routes for full incident lifecycle including evidence upload via Multer"

# COMMIT 43
git add backend/src/routes/location.routes.js
git commit -m "feat(backend/routes): update location routes for GPS ping submission and history retrieval with auth guards"

# COMMIT 44
git add backend/src/routes/report.routes.js
git commit -m "feat(backend/routes): update report routes for generating and exporting equipment and personnel reports"

# ── BACKEND JOBS ─────────────────────────────────────────────────────

# COMMIT 45
git add backend/src/jobs/alertEscalation.job.js
git commit -m "feat(backend/jobs): update alert escalation cron job to auto-escalate unacknowledged alerts to higher command"

# COMMIT 46
git add backend/src/jobs/overdueDetection.job.js
git commit -m "feat(backend/jobs): update overdue detection cron job to scan for late equipment returns and generate overdue alerts"

# =====================================================================
#  ██████╗ ██╗  ██╗ █████╗ ███████╗███████╗    ██████╗
#  ██╔══██╗██║  ██║██╔══██╗██╔════╝██╔════╝    ╚════██╗
#  ██████╔╝███████║███████║███████╗█████╗       █████╔╝
#  ██╔═══╝ ██╔══██║██╔══██║╚════██║██╔══╝      ██╔═══╝
#  ██║     ██║  ██║██║  ██║███████║███████╗    ███████╗
#  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚══════╝
#
#  >>> SWITCH TO MAIN BRANCH <<<
#
git checkout main
#
#  BRANCH: main
#  FILES: All NEW untracked files (106 commits)
# =====================================================================

# ── ROOT NEW FILES ───────────────────────────────────────────────────

# COMMIT 47
git add .env.example
git commit -m "chore: add safe env template with placeholder values for all required environment variables"

# COMMIT 48
git add COMMIT_GUIDE.md
git commit -m "docs: add individual git commit reference guide for all project files"

# ── DATABASE NEW FILES ───────────────────────────────────────────────

# COMMIT 49
git add db/setup.js
git commit -m "feat(db): add automated database setup and initialization script"

# COMMIT 50
git add db/package.json
git commit -m "chore(db): add package.json for database utility scripts"

# COMMIT 51
git add db/migrations/feature_9_migration.sql
git commit -m "feat(db): add incident reporting system migration with investigation log, witness statements, and evidence tables"

# COMMIT 52
git add db/migrations/fix_incident_base_id.sql
git commit -m "fix(db): add migration to add missing base_id column to incidents table"

# ── BACKEND NEW DB SCRIPTS ───────────────────────────────────────────

# COMMIT 53
git add backend/db/fix_constraint.js
git commit -m "fix(backend/db): add script to repair database constraint violations in checkout records"

# COMMIT 54
git add backend/db/migrations/20260403_add_checkout_requests.js
git commit -m "feat(backend/db): add migration for checkout requests table with approval workflow columns"

# COMMIT 55
git add backend/db/migrations/20260404_extend_custody_chain.js
git commit -m "feat(backend/db): add migration to extend custody chain with signature and location fields"

# COMMIT 56
git add backend/db/seed_personnel_v2.js
git commit -m "feat(backend/db): add v2 personnel seed script with extended rank, service number, and biometric fields"

# COMMIT 57
git add backend/db/seed_test_data.js
git commit -m "feat(backend/db): add test data seed script for development and QA testing workflows"

# COMMIT 58
git add backend/db/seed_weapons.js
git commit -m "feat(backend/db): add military weapons and equipment seed script with serial numbers, categories, and base assignments"

# ── BACKEND NEW CONSTANTS ────────────────────────────────────────────

# COMMIT 59
git add backend/src/constants/incident.constants.js
git commit -m "feat(backend/constants): add incident type, severity level, and resolution status constants for incident reporting system"

# ── BACKEND NEW UTILS ────────────────────────────────────────────────

# COMMIT 60
git add backend/src/utils/catchAsync.js
git commit -m "feat(backend/utils): add catchAsync wrapper utility to eliminate try-catch boilerplate in async controller functions"

# COMMIT 61
git add backend/src/utils/cryptoTrace.js
git commit -m "feat(backend/utils): add cryptographic trace utility for generating tamper-evident tokens in audit trail records"

# ── BACKEND NEW QUERIES ──────────────────────────────────────────────

# COMMIT 62
git add backend/src/queries/checkoutRequest.queries.js
git commit -m "feat(backend/queries): add SQL queries for checkout request creation, pending queue, approval, and rejection operations"

# ── BACKEND NEW SERVICES ─────────────────────────────────────────────

# COMMIT 63
git add backend/src/services/checkoutRequest.service.js
git commit -m "feat(backend/services): add checkout request service implementing submission, sergeant notification, and approval workflow"

# COMMIT 64
git add backend/src/services/email.service.js
git commit -m "feat(backend/services): add Nodemailer email service for alert escalation notifications and system-generated emails via SMTP"

# ── BACKEND NEW CONTROLLERS ──────────────────────────────────────────

# COMMIT 65
git add backend/src/controllers/checkoutRequest.controller.js
git commit -m "feat(backend/controllers): add checkout request controller for soldier submission and sergeant approve/reject endpoints"

# COMMIT 66
git add backend/src/controllers/officer.controller.js
git commit -m "feat(backend/controllers): add officer controller for base status overview, CO acknowledgment, and transfer approval actions"

# COMMIT 67
git add backend/src/controllers/sergeant.controller.js
git commit -m "feat(backend/controllers): add sergeant controller for unit soldier management, checkout approvals, unit inventory, and ammo reports"

# ── BACKEND NEW ROUTES ───────────────────────────────────────────────

# COMMIT 68
git add backend/src/routes/checkoutRequest.routes.js
git commit -m "feat(backend/routes): add checkout request routes for soldier request submission and sergeant approval workflow"

# COMMIT 69
git add backend/src/routes/officer.routes.js
git commit -m "feat(backend/routes): add officer-specific dashboard routes for base overview and CO acknowledgment with OFFICER role guard"

# COMMIT 70
git add backend/src/routes/sergeant.routes.js
git commit -m "feat(backend/routes): add sergeant routes for soldier management, checkout approvals, unit inventory, and maintenance flagging"

# ── WEB FOUNDATION ───────────────────────────────────────────────────

# COMMIT 71
git add web/package.json
git commit -m "chore(web): add package.json with React 19, Vite 8, TailwindCSS 4, TanStack Query, Zustand, Leaflet, Firebase, and all web dependencies"

# COMMIT 72
git add web/vite.config.js
git commit -m "chore(web): add Vite build configuration with React plugin and dev server proxy settings"

# COMMIT 73
git add web/index.html
git commit -m "chore(web): add root HTML entry point with meta tags, font preloads, and React app mount point"

# COMMIT 74
git add web/eslint.config.js
git commit -m "chore(web): add ESLint configuration with React hooks and fast refresh plugins"

# COMMIT 75
git add web/.gitignore
git commit -m "chore(web): add web-specific gitignore for build artifacts, node_modules, and env files"

# COMMIT 76
git add web/.env.example
git commit -m "chore(web): add web env template with Vite API, Socket, Firebase, and map tile URL placeholders"

# COMMIT 77
git add web/README.md
git commit -m "docs(web): add web dashboard README with tech stack, setup steps, and available scripts"

# COMMIT 78
git add web/test.js
git commit -m "test(web): add web app basic smoke test file"

# ── WEB ASSETS & PUBLIC ──────────────────────────────────────────────

# COMMIT 79
git add web/public/favicon.svg
git commit -m "chore(web): add custom SVG favicon for web dashboard browser tab"

# COMMIT 80
git add web/public/icons.svg
git commit -m "chore(web): add SVG icon sprite sheet for web app UI elements"

# COMMIT 81
git add web/src/assets/hero.png
git commit -m "chore(web): add hero image asset for login page and landing section"

# COMMIT 82
git add web/src/assets/react.svg
git commit -m "chore(web): add React logo SVG asset"

# COMMIT 83
git add web/src/assets/vite.svg
git commit -m "chore(web): add Vite logo SVG asset"

# ── WEB STYLES & ENTRY ───────────────────────────────────────────────

# COMMIT 84
git add web/src/index.css
git commit -m "feat(web): add global CSS with TailwindCSS base, design system tokens, custom utilities, and typography setup"

# COMMIT 85
git add web/src/App.css
git commit -m "feat(web): add App-level CSS with layout overrides and component base styles"

# COMMIT 86
git add web/src/main.jsx
git commit -m "feat(web): add React app entry point bootstrapping TanStack Query, React Router, hot toast, and root render"

# COMMIT 87
git add web/src/App.jsx
git commit -m "feat(web): add root App component with protected routes, role-based navigation guards, and auth state initialization"

# ── WEB CONFIG & STORE ───────────────────────────────────────────────

# COMMIT 88
git add web/src/config/firebase.js
git commit -m "feat(web/config): initialize Firebase SDK and Realtime Database client for live GPS equipment tracking on map"

# COMMIT 89
git add web/src/store/index.js
git commit -m "feat(web/store): add Zustand global store managing auth user state, notification count, and app-wide UI flags"

# ── WEB SERVICES ─────────────────────────────────────────────────────

# COMMIT 90
git add web/src/services/api.js
git commit -m "feat(web/services): add Axios HTTP client with Bearer token injection and automatic 401 refresh token retry interceptor"

# COMMIT 91
git add web/src/services/socket.js
git commit -m "feat(web/services): add Socket.io client for subscribing to real-time checkout events, alerts, and location updates"

# COMMIT 92
git add web/src/services/WebSyncService.js
git commit -m "feat(web/services): add web sync service for detecting offline state and batch-syncing pending operations on network restore"

# ── WEB LAYOUT COMPONENTS ────────────────────────────────────────────

# COMMIT 93
git add web/src/components/layout/AppShell.jsx
git commit -m "feat(web/components): add AppShell layout with collapsible sidebar, role-based menu items, and main content area"

# COMMIT 94
git add web/src/components/layout/TopBar.jsx
git commit -m "feat(web/components): add TopBar with user profile display, live notification bell, alert count badge, and secure logout"

# COMMIT 95
git add web/src/components/ui/index.jsx
git commit -m "feat(web/components): add reusable UI design system with Button, Badge, Card, Modal, Spinner, Input, and Table primitives"

# ── WEB FEATURE COMPONENTS ───────────────────────────────────────────

# COMMIT 96
git add web/src/components/HandoverQR.jsx
git commit -m "feat(web/components): add HandoverQR digital tag station component displaying QR codes for mobile-first equipment checkout scanning"

# COMMIT 97
git add web/src/components/ReleaseAssetModal.jsx
git commit -m "feat(web/components): add ReleaseAssetModal for confirming equipment check-in with condition assessment and digital signature"

# COMMIT 98
git add web/src/components/RequestEquipmentModal.jsx
git commit -m "feat(web/components): add RequestEquipmentModal for soldiers to submit equipment requests with type, quantity, and mission justification"

# COMMIT 99
git add web/src/components/equipment/QRCodeModal.jsx
git commit -m "feat(web/components): add QRCodeModal to display, zoom, and download QR codes for individual equipment items"

# COMMIT 100
git add web/src/components/incidents/CoAcknowledgmentBanner.jsx
git commit -m "feat(web/components): add CO acknowledgment banner for commanding officers to accept and sign off on stolen equipment reports"

# COMMIT 101
git add web/src/components/incidents/EscalationCountdown.jsx
git commit -m "feat(web/components): add EscalationCountdown live timer showing time remaining before an unresolved incident auto-escalates"

# COMMIT 102
git add web/src/components/incidents/EvidenceGallery.jsx
git commit -m "feat(web/components): add EvidenceGallery for displaying uploaded photo and document evidence attached to incident reports"

# COMMIT 103
git add web/src/components/incidents/GpsCorrelationMap.jsx
git commit -m "feat(web/components): add GpsCorrelationMap showing the last-known GPS position of equipment at the time an incident was reported"

# COMMIT 104
git add web/src/components/incidents/WitnessStatementForm.jsx
git commit -m "feat(web/components): add WitnessStatementForm for capturing and submitting structured witness accounts linked to an incident"

# ── WEB PAGES ────────────────────────────────────────────────────────

# COMMIT 105
git add web/src/pages/LoginPage.jsx
git commit -m "feat(web/pages): add LoginPage with animated auth form, role-based post-login redirect, and demo credential helper"

# COMMIT 106
git add web/src/pages/OfficerSignup.jsx
git commit -m "feat(web/pages): add OfficerSignup self-registration page with base and unit selection, validation, and account creation"

# COMMIT 107
git add web/src/pages/Dashboard.jsx
git commit -m "feat(web/pages): add main Dashboard with equipment stats cards, active alerts feed, recent checkout activity, and quick action buttons"

# COMMIT 108
git add web/src/pages/NotFound.jsx
git commit -m "feat(web/pages): add 404 NotFound page with animated illustration and navigation back to dashboard"

# COMMIT 109
git add web/src/pages/CheckoutProcess.jsx
git commit -m "feat(web/pages): add multi-step CheckoutProcess page with equipment selection, QR code display, digital signature, and confirmation"

# COMMIT 110
git add web/src/pages/CheckInProcess.jsx
git commit -m "feat(web/pages): add CheckInProcess page for scanning equipment return, condition assessment form, and signature capture"

# COMMIT 111
git add web/src/pages/admin/AdminPanel.jsx
git commit -m "feat(web/pages): add AdminPanel with tabbed interface for user management, role assignment, base config, and system settings"

# COMMIT 112
git add web/src/pages/alerts/AlertList.jsx
git commit -m "feat(web/pages): add AlertList page with severity filters, real-time alert feed, and acknowledge, resolve, dismiss actions"

# COMMIT 113
git add web/src/pages/audit/AuditLog.jsx
git commit -m "feat(web/pages): add AuditLog page with immutable action history table, actor filter, date range picker, and CSV export"

# COMMIT 114
git add web/src/pages/checkouts/CheckoutList.jsx
git commit -m "feat(web/pages): add CheckoutList with paginated active and historical checkout records, search, filter, and overdue highlighting"

# COMMIT 115
git add web/src/pages/equipment/EquipmentList.jsx
git commit -m "feat(web/pages): add EquipmentList with TanStack Table, category and status filters, QR generation action, and Excel/PDF export"

# COMMIT 116
git add web/src/pages/equipment/EquipmentDetail.jsx
git commit -m "feat(web/pages): add EquipmentDetail page with full item profile, custody chain timeline, maintenance history, and incident records"

# COMMIT 117
git add web/src/pages/incidents/IncidentList.jsx
git commit -m "feat(web/pages): add IncidentList page for viewing, filtering, and managing incident reports with severity and status indicators"

# COMMIT 118
git add web/src/pages/maintenance/MaintenanceList.jsx
git commit -m "feat(web/pages): add MaintenanceList page for scheduling maintenance tasks, tracking progress, and technician sign-off"

# COMMIT 119
git add web/src/pages/map/LiveMap.jsx
git commit -m "feat(web/pages): add LiveMap page with Leaflet map showing real-time GPS equipment positions streamed from Firebase RTDB"

# COMMIT 120
git add web/src/pages/officer/OfficerDashboard.jsx
git commit -m "feat(web/pages): add OfficerDashboard with base equipment status, active personnel assignments, alert summary, and command actions"

# COMMIT 121
git add web/src/pages/officer/OfficerAdminPanel.jsx
git commit -m "feat(web/pages): add OfficerAdminPanel for base-level administration, CO acknowledgment actions, and transfer approvals"

# COMMIT 122
git add web/src/pages/personnel/PersonnelList.jsx
git commit -m "feat(web/pages): add PersonnelList page for viewing, adding, editing, and managing all base personnel profiles"

# COMMIT 123
git add web/src/pages/reports/Reports.jsx
git commit -m "feat(web/pages): add Reports page for generating equipment accountability, checkout history, and personnel reports with PDF and Excel export"

# COMMIT 124
git add web/src/pages/sergeant/SergeantDashboard.jsx
git commit -m "feat(web/pages): add SergeantDashboard with unit soldier list, pending checkout approval queue, unit inventory, and overdue equipment feed"

# COMMIT 125
git add web/src/pages/soldier/SoldierDashboard.jsx
git commit -m "feat(web/pages): add SoldierDashboard showing personally assigned equipment, checkout history, and equipment request form access"

# COMMIT 126
git add web/src/pages/tracking/LiveTrackingPage.jsx
git commit -m "feat(web/pages): add LiveTrackingPage with animated real-time equipment markers, unit filter, and GPS history replay controls"

# COMMIT 127
git add web/src/pages/tracking/SmoothMarker.jsx
git commit -m "feat(web/pages): add SmoothMarker Leaflet component providing interpolated animation for GPS position updates on the live map"

# COMMIT 128
git add web/src/pages/transfers/TransferList.jsx
git commit -m "feat(web/pages): add TransferList page for initiating, tracking status, and receiving inter-base equipment transfers"

# ── MOBILE FOUNDATION ────────────────────────────────────────────────

# COMMIT 129
git add mobile/.gitignore
git commit -m "chore(mobile): add mobile-specific gitignore for Expo build artifacts, node_modules, keys, and env files"

# COMMIT 130
git add mobile/.env.example
git commit -m "chore(mobile): add mobile env template with Firebase credentials and API URL placeholders"

# COMMIT 131
git add mobile/package.json
git commit -m "chore(mobile): add package.json with Expo 54, React Native 0.81, navigation, camera, biometric, GPS, Firebase, and all mobile dependencies"

# COMMIT 132
git add mobile/app.json
git commit -m "chore(mobile): add Expo app.json with app name, version, splash screen, icons, and Android/iOS permission declarations"

# COMMIT 133
git add mobile/index.js
git commit -m "chore(mobile): add Expo app entry point registering the root App component with AppRegistry"

# COMMIT 134
git add mobile/App.js
git commit -m "feat(mobile): add root App component with Stack and Tab navigator setup, OfflineQueueProvider context, and SafeAreaProvider"

# ── MOBILE ASSETS ────────────────────────────────────────────────────

# COMMIT 135
git add mobile/assets/adaptive-icon.png
git commit -m "chore(mobile): add adaptive icon for Android home screen launcher"

# COMMIT 136
git add mobile/assets/favicon.png
git commit -m "chore(mobile): add favicon for Expo web build target"

# COMMIT 137
git add mobile/assets/icon.png
git commit -m "chore(mobile): add app icon for iOS App Store and Android Play Store"

# COMMIT 138
git add mobile/assets/splash-icon.png
git commit -m "chore(mobile): add splash screen icon displayed during app initialization"

# ── MOBILE CONFIG & CONTEXT ──────────────────────────────────────────

# COMMIT 139
git add mobile/src/config/firebase.js
git commit -m "feat(mobile/config): initialize Firebase SDK and RTDB client for publishing real-time GPS coordinates from the field"

# COMMIT 140
git add mobile/src/context/OfflineQueueContext.js
git commit -m "feat(mobile/context): add OfflineQueueContext with AsyncStorage-backed action queue that syncs automatically on network restoration"

# ── MOBILE SERVICES ──────────────────────────────────────────────────

# COMMIT 141
git add mobile/src/services/api.js
git commit -m "feat(mobile/services): add Axios API client with JWT auth injection, 401 refresh interceptor, and offline queue fallback"

# COMMIT 142
git add mobile/src/services/SecurityService.js
git commit -m "feat(mobile/services): add SecurityService for biometric login via expo-local-authentication and encrypted credential storage with expo-secure-store"

# COMMIT 143
git add mobile/src/services/SyncService.js
git commit -m "feat(mobile/services): add SyncService to pre-fetch equipment data for offline use, process the queue, and manage sync lifecycle state"

# ── MOBILE SCREENS ───────────────────────────────────────────────────

# COMMIT 144
git add mobile/src/screens/LoginScreen.js
git commit -m "feat(mobile/screens): add LoginScreen with email/password authentication, biometric login option, and secure JWT session persistence"

# COMMIT 145
git add mobile/src/screens/HomeScreen.js
git commit -m "feat(mobile/screens): add HomeScreen dashboard showing assigned equipment list, active checkout status, real-time alerts, and quick scan shortcut"

# COMMIT 146
git add mobile/src/screens/ScannerScreen.js
git commit -m "feat(mobile/screens): add ScannerScreen with expo-camera QR code scanner to initiate equipment checkout from physical equipment tags"

# COMMIT 147
git add mobile/src/screens/WeaponConfirmScreen.js
git commit -m "feat(mobile/screens): add WeaponConfirmScreen for reviewing scanned equipment details, multi-asset selection, and digital signature before checkout"

# COMMIT 148
git add mobile/src/screens/ActiveTrackingScreen.js
git commit -m "feat(mobile/screens): add ActiveTrackingScreen showing all checked-out equipment with live GPS map and real-time Firebase RTDB updates"

# COMMIT 149
git add mobile/src/screens/RequestScreen.js
git commit -m "feat(mobile/screens): add RequestScreen for soldiers to submit equipment requests with type, quantity, and mission justification"

# COMMIT 150
git add mobile/src/screens/ApprovalScreen.js
git commit -m "feat(mobile/screens): add ApprovalScreen for sergeants to view the pending checkout request queue and approve or reject individual requests"

# COMMIT 151
git add mobile/src/screens/SyncStatusScreen.js
git commit -m "feat(mobile/screens): add SyncStatusScreen displaying offline action queue, sync state indicator, failed item details, and manual retry button"

# COMMIT 152
git add mobile/src/screens/ProfileScreen.js
git commit -m "feat(mobile/screens): add ProfileScreen with user details, military rank badge, base/unit info, biometric auth toggle, and secure logout"

# =====================================================================
#  ██████╗ ██╗   ██╗███████╗██╗  ██╗██╗
#  ██╔══██╗██║   ██║██╔════╝██║  ██║██║
#  ██████╔╝██║   ██║███████╗███████║██║
#  ██╔═══╝ ██║   ██║╚════██║██╔══██║╚═╝
#  ██║     ╚██████╔╝███████║██║  ██║██╗
#  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝
#
#  All 152 commits done! Now push to GitHub:
# =====================================================================

git push origin main
# If origin is not set yet:
# git remote add origin https://github.com/Ridham2808/BlackRabbit.git
# git push -u origin main
