import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  LayoutDashboard, Calculator, ClipboardList,
  LogOut, Scale, ChevronRight, Bell, Search
} from 'lucide-react'

const NAV = [
  { path: '/',          icon: LayoutDashboard, label: 'Dashboard'    },
  { path: '/novo',      icon: Calculator,      label: 'Novo Cálculo' },
  { path: '/historico', icon: ClipboardList,   label: 'Histórico'    },
]

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/novo':      'Novo Cálculo',
  '/historico': 'Histórico',
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()

  const initials = user?.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') ?? 'NG'

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'LEX CALCULATOR'

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'hsl(var(--background))',
    }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: '256px',
        background: 'hsl(var(--sidebar-background))',
        borderRight: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gradient-primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px hsl(var(--primary) / 0.3)',
          }}>
            <Scale size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
              LEX
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.2, letterSpacing: '0.05em' }}>
              CALCULATOR
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'hsl(var(--muted-foreground))',
            padding: '0 8px',
            marginBottom: '6px',
            marginTop: '4px',
          }}>
            MENU
          </p>
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  background: active ? 'hsl(var(--primary))' : 'transparent',
                  color: active ? '#fff' : 'hsl(var(--sidebar-foreground))',
                  marginBottom: '2px',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'hsl(var(--sidebar-accent))'
                    e.currentTarget.style.color = 'hsl(var(--foreground))'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'
                  }
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom — user */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '12px 8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: '10px',
            marginBottom: '4px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '9999px',
              background: 'hsl(var(--primary) / 0.2)',
              border: '1px solid hsl(var(--primary) / 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--primary))' }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                {user?.oab || user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 8px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: 'hsl(var(--muted-foreground))',
              background: 'transparent',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'hsl(var(--destructive))'
              e.currentTarget.style.background = 'hsl(0 62% 50% / 0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={14} />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* ── Right column (header + content) ─────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header — 64px fixed */}
        <header style={{
          height: '64px',
          flexShrink: 0,
          background: 'rgba(20,24,31,0.5)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          zIndex: 10,
        }}>
          {/* Left — breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.05em' }}>LEX CALCULATOR</span>
            <ChevronRight size={13} color='hsl(var(--border))' />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{pageTitle}</span>
          </div>

          {/* Right — avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/novo')}
              className="btn-primary"
              style={{ height: '36px', fontSize: '13px', padding: '6px 14px' }}
            >
              <Calculator size={14} />
              Novo Cálculo
            </button>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '9999px',
              background: 'hsl(var(--primary) / 0.2)',
              border: '2px solid hsl(var(--primary) / 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--primary))' }}>{initials}</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
