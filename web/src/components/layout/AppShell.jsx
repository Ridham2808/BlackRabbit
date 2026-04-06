import { Outlet } from 'react-router-dom'
import TopBar  from './TopBar'

export default function AppShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#dce3ea', overflow: 'hidden' }}>
      <TopBar />
      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 32px',
        maxWidth: 1440,
        width: '100%',
        margin: '0 auto',
        alignSelf: 'stretch',
        boxSizing: 'border-box',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
