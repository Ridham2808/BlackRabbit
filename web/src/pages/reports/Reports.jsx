import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import api from '../../services/api'
import { PageHeader, Spinner } from '../../components/ui'

const STATUS_COLORS = {
  OPERATIONAL:       '#8aab2e',
  CHECKED_OUT:       '#60a5fa',
  UNDER_MAINTENANCE: '#fbbf24',
  LOST:              '#ef4444',
  MISSING:           '#f97316',
  FLAGGED:           '#a78bfa',
  DECOMMISSIONED:    '#475569',
  IN_TRANSIT:        '#34d399',
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</h3>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {label && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#9ca3af' }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ margin: 0, fontSize: 12, color: p.color || '#111827', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [range, setRange] = useState('30')

  const { data, isLoading } = useQuery({
    queryKey: ['reports', range],
    queryFn: () => api.get('/reports/summary', { params: { days: range } }).then(r => r.data),
  })

  const report = data || {}

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('DEAS — Equipment Utilization Report', 148, 18, { align: 'center' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('CONFIDENTIAL — FOR OFFICIAL USE ONLY', 148, 25, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Range: Last ${range} days`, 14, 35)

    const summary = [
      ['Total Equipment', report.total_equipment ?? '—'],
      ['Checked Out Now', report.active_checkouts ?? '—'],
      ['Maintenance Due', report.maintenance_due ?? '—'],
      ['Open Alerts', report.open_alerts ?? '—'],
      ['Total Checkout Events', report.checkout_events_count ?? '—'],
      ['Overdue Rate', report.overdue_rate ? `${report.overdue_rate}%` : '—'],
    ]
    doc.autoTable({ startY: 42, head: [['Metric', 'Value']], body: summary, styles: { fontSize: 10 }, headStyles: { fillColor: [15,27,45], textColor: [139,171,46] } })
    doc.save(`DEAS-Report-${Date.now()}.pdf`)
    toast.success('PDF exported')
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const rows = [
      ['Metric', 'Value'],
      ['Total Equipment', report.total_equipment ?? ''],
      ['Active Checkouts', report.active_checkouts ?? ''],
      ['Maintenance Due', report.maintenance_due ?? ''],
      ['Open Alerts', report.open_alerts ?? ''],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Summary')
    if (report.status_distribution) {
      const sd = report.status_distribution.map(s => [s.status, s.count])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Status','Count'], ...sd]), 'Status Breakdown')
    }
    if (report.checkout_activity) {
      const ca = report.checkout_activity.map(d => [d.date, d.checkouts, d.returns])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Date','Checkouts','Returns'], ...ca]), 'Activity')
    }
    XLSX.writeFile(wb, `DEAS-Report-${Date.now()}.xlsx`)
    toast.success('Excel exported')
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        sub="Equipment utilization, checkout activity, and maintenance analysis"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input-field" style={{ width: 140, fontSize: 13 }} value={range} onChange={e => setRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={exportPDF}>
              <FileText size={14} /> PDF
            </button>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={exportExcel}>
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        }
      />

      {isLoading ? <Spinner /> : (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Equipment',   value: report.total_equipment,     color: '#8aab2e' },
              { label: 'Active Checkouts',  value: report.active_checkouts,    color: '#60a5fa' },
              { label: 'Maintenance Due',   value: report.maintenance_due,     color: '#fbbf24' },
              { label: 'Open Incidents',    value: report.open_incidents,      color: '#ef4444' },
              { label: 'Overdue Checkouts', value: report.overdue_checkouts,   color: '#f97316' },
              { label: 'Checkout Events',   value: report.checkout_events_count, color: '#a78bfa' },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: k.color }}>{k.value ?? '—'}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Status Distribution Pie */}
            <Section title="Equipment Status Distribution">
              {report.status_distribution?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={report.status_distribution} dataKey="count" nameKey="status"
                      cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                      {report.status_distribution.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLORS[s.status] || '#475569'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v.replace(/_/g,' ')}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p style={{ color: '#475569', textAlign: 'center', padding: 40, fontSize: 13 }}>No data available</p>}
            </Section>

            {/* Checkout by Unit Bar */}
            <Section title="Checkout Frequency by Unit">
              {report.unit_checkouts?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={report.unit_checkouts} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="unit_name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8aab2e" radius={[4,4,0,0]} name="Checkouts" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p style={{ color: '#475569', textAlign: 'center', padding: 40, fontSize: 13 }}>No data available</p>}
            </Section>
          </div>

          {/* Activity Area Chart */}
          <Section title={`Daily Checkout & Return Activity — Last ${range} Days`}>
            {report.checkout_activity?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={report.checkout_activity} margin={{ left: 0, right: 10 }}>
                  <defs>
                    <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8aab2e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8aab2e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  <Area type="monotone" dataKey="checkouts" stroke="#8aab2e" fill="url(#gradC)" strokeWidth={2} name="Checkouts" />
                  <Area type="monotone" dataKey="returns"   stroke="#60a5fa" fill="url(#gradR)" strokeWidth={2} name="Returns" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#475569', textAlign: 'center', padding: 40, fontSize: 13 }}>No activity data in selected range</p>}
          </Section>

          {/* Maintenance Rate Line */}
          {report.maintenance_completion && (
            <Section title="Maintenance Completion Rate (%)">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={report.maintenance_completion} margin={{ left: 0, right: 10 }}>
                  <defs>
                    <linearGradient id="gradM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis domain={[0,100]} tick={{ fill: '#475569', fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rate" stroke="#fbbf24" fill="url(#gradM)" strokeWidth={2} name="Completion %" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
