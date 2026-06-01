import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  LayoutDashboard, Calculator, ClipboardList,
  LogOut, Scale, ChevronRight
} from 'lucide-react'

const NAV = [
  { path: '/',          icon: LayoutDashboard, label: 'Dashboard'     },
  { path: '/novo',      icon: Calculator,      label: 'Novo Cálculo'  },
  { path: '/historico', icon: ClipboardList,   label: 'Histórico'     },
]

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Gold accent bar */}
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />

        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '6px',
              border: '1px solid rgba(201,168,76,0.35)',
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="cinzel" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>§</span>
            </div>
            <div>
              <p className="cinzel" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1rem', lineHeight: 1, margin: 0 }}>LEX</p>
              <p className="cinzel" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.3em', lineHeight: 1, margin: 0, marginTop: '3px' }}>CALCULATOR</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                  gap: '0.625rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.12s',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color:      active ? 'var(--gold)'          : 'var(--text-muted)',
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                  paddingLeft: active ? 'calc(0.75rem - 2px)' : '0.75rem',
                  fontWeight:  active ? 600 : 400,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </button>
            )
          })}

          <div style={{ flex: 1 }} />

          {/* Novo Cálculo quick action */}
          <button
            onClick={() => navigate('/novo')}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.7rem' }}
          >
            <Calculator size={14} />
            NOVO CÁLCULO
          </button>
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="cinzel" style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
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
              gap: '0.5rem',
              padding: '0.4rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'Outfit, sans-serif',
              background: 'transparent',
              color: 'var(--text-muted)',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={13} />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
