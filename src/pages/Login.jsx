import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Scale, Mail, Lock, AlertCircle, Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react'

// Decorative dots for left panel
function DotsGrid() {
  const dots = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      dots.push(
        <div key={`${r}-${c}`} style={{
          width: '3px', height: '3px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
        }} />
      )
    }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 3px)', gap: '14px' }}>
      {dots}
    </div>
  )
}

const FEATURES = [
  { label: 'SELIC & IPCA automáticos',      sub: 'Correção monetária calculada' },
  { label: 'Sentença ou acórdão',           sub: 'Suporte a ambos os documentos' },
  { label: 'Dano moral + material + honorários', sub: 'Todas as verbas em um cálculo' },
  { label: 'Exporta para petição',          sub: 'Copia tabela formatada em 1 clique' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [erro,    setErro]    = useState('')
  const [loading, setLoading] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch {
      setErro('E-mail ou senha inválidos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'hsl(var(--background))',
    }}>
      {/* ── Left panel ─────────────────────────────────────── */}
      <div style={{
        flex: '0 0 55%',
        display: 'none', // hidden on mobile; shown via CSS below
        position: 'relative',
        overflow: 'hidden',
        background: 'hsl(220 20% 5%)',
        borderRight: '1px solid hsl(var(--border))',
      }}
      className="left-panel"
      >
        {/* Blue glow top-left */}
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: '450px', height: '450px',
          background: 'radial-gradient(circle, hsl(199 89% 48% / 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Blue glow bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-80px',
          width: '350px', height: '350px',
          background: 'radial-gradient(circle, hsl(217 91% 60% / 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '48px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Top — logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'var(--gradient-primary)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px hsl(var(--primary) / 0.4)',
            }}>
              <Scale size={20} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: 'hsl(var(--foreground))' }}>LEX CALCULATOR</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Nicolas Gomes Advogado</p>
            </div>
          </div>

          {/* Middle — heading */}
          <div>
            <p style={{
              fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'hsl(var(--primary))',
              marginBottom: '16px',
            }}>
              CÁLCULOS DE EXECUÇÃO
            </p>
            <h1 style={{
              fontSize: '36px', fontWeight: 700, lineHeight: 1.25,
              color: 'hsl(var(--foreground))',
              margin: '0 0 16px',
            }}>
              Cumprimento de<br />Sentença em<br />
              <span style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>segundos.</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, margin: 0, maxWidth: '380px' }}>
              Informe os dados da sentença ou acórdão. O sistema calcula automaticamente a correção monetária e os juros.
            </p>

            {/* Feature list */}
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.15)',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{f.label}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — dots grid */}
          <div><DotsGrid /></div>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        minHeight: '100vh',
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo (hidden on desktop) */}
          <div className="mobile-logo" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              width: '48px', height: '48px',
              background: 'var(--gradient-primary)',
              borderRadius: '12px',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
            }}>
              <Scale size={22} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>LEX CALCULATOR</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Nicolas Gomes Advogado</p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(20,24,31,0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
              Bem-vindo de volta
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
              Entre com suas credenciais para acessar o sistema
            </p>

            {/* Error */}
            {erro && (
              <div style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--error)',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'hsl(var(--foreground))',
                  marginBottom: '6px',
                }}>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(var(--muted-foreground))',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-lex input-icon"
                    placeholder="seu@email.com.br ou admin"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>Senha</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(var(--muted-foreground))',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="input-lex input-icon"
                    placeholder="••••••••"
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <button type="button" onClick={() => setVerSenha(v => !v)}
                    title={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
                      color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}>
                    {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: '48px' }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verificando...</>
                  : <>Entrar <ChevronRight size={16} /></>
                }
              </button>
            </form>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .left-panel { display: block !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
