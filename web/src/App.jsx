import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store'
import { connectSocket, disconnectSocket } from './services/socket'

import LoginPage         from './pages/LoginPage'
import OfficerSignup     from './pages/OfficerSignup'
import AppShell          from './components/layout/AppShell'
import Dashboard         from './pages/Dashboard'
import SoldierDashboard  from './pages/soldier/SoldierDashboard'
import SergeantDashboard from './pages/sergeant/SergeantDashboard'
import OfficerDashboard  from './pages/officer/OfficerDashboard'
import OfficerAdminPanel from './pages/officer/OfficerAdminPanel'
import EquipmentList     from './pages/equipment/EquipmentList'
import EquipmentDetail   from './pages/equipment/EquipmentDetail'
import PersonnelList     from './pages/personnel/PersonnelList'
import CheckoutList      from './pages/checkouts/CheckoutList'
import MaintenanceList   from './pages/maintenance/MaintenanceList'
import TransferList      from './pages/transfers/TransferList'
import CheckoutProcess   from './pages/CheckoutProcess'
import CheckInProcess    from './pages/CheckInProcess'
import IncidentList      from './pages/incidents/IncidentList'
import AlertList         from './pages/alerts/AlertList'
import AuditLog          from './pages/audit/AuditLog'
import Reports           from './pages/reports/Reports'
import AdminPanel        from './pages/admin/AdminPanel'
import LiveTrackingPage  from './pages/tracking/LiveTrackingPage'
import NotFound          from './pages/NotFound'

function ProtectedRoute({ children }) {
  const isAuth = useAuthStore(s => s.isAuth)
  return isAuth ? children : <Navigate to="/login" replace />
}

// Smart dashboard: redirect to role-specific page
function RoleDashboard() {
  const user = useAuthStore(s => s.user)
  const role = user?.role
  if (role === 'SOLDIER')  return <SoldierDashboard />
  if (role === 'SERGEANT') return <SergeantDashboard />
  if (role === 'OFFICER')  return <OfficerDashboard />
  return <Dashboard />  // fallback for SUPER_ADMIN, BASE_ADMIN, etc.
}

export default function App() {
  const isAuth = useAuthStore(s => s.isAuth)

  useEffect(() => {
    if (isAuth) {
      connectSocket()
      return () => disconnectSocket()
    }
  }, [isAuth])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/officer-signup" element={<OfficerSignup />} />

      {/* Protected routes inside AppShell */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Smart dashboard — redirects per role */}
        <Route path="dashboard"     element={<RoleDashboard />} />

        {/* Shared pages (RBAC enforced on backend) */}
        <Route path="equipment"     element={<EquipmentList />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="personnel"     element={<PersonnelList />} />
        <Route path="personnel/:id" element={<PersonnelList />} />
        <Route path="checkouts"     element={<CheckoutList />} />
        <Route path="maintenance"   element={<MaintenanceList />} />
        <Route path="checkout-process" element={<CheckoutProcess />} />
        <Route path="checkin-process"  element={<CheckInProcess />} />
        <Route path="transfers"     element={<TransferList />} />
        <Route path="incidents"     element={<IncidentList />} />
        <Route path="alerts"        element={<AlertList />} />
        <Route path="audit"         element={<AuditLog />} />
        <Route path="reports"       element={<Reports />} />
        <Route path="map"           element={<LiveTrackingPage />} />

        {/* Officer-only */}
        <Route path="admin"                    element={<OfficerAdminPanel />} />
        <Route path="officer/sergeants/:id"    element={<OfficerDashboard />} />
        <Route path="officer/soldiers/:id"     element={<OfficerDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
