import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Scale, Mail, Lock, AlertCircle, Loader2, ChevronRight, Eye, EyeOff, Gavel, Landmark, BookOpen, FileText } from 'lucide-react'
import logoNg from '../assets/logo_ng.png'

// Decorative dots for left panel

// ── Carrossel jurídico do painel de login ────────────────────────────────────
const SLIDES = [
  { logo: true,       titulo: 'Nicolas Gomes — Advogado', sub: 'Cumprimento de sentença no padrão do escritório' },
  { Icon: Gavel,      titulo: 'Sentenças e acórdãos',     sub: 'A IA lê a decisão e monta o cálculo para sua revisão' },
  { Icon: Landmark,   titulo: 'Índices oficiais',         sub: 'INPC, IPCA e SELIC direto do Banco Central' },
  { Icon: BookOpen,   titulo: 'Súmulas do STJ aplicadas', sub: 'Correção e juros conforme as Súmulas 43, 54 e 362' },
  { Icon: FileText,   titulo: 'Petição timbrada NG',      sub: 'Word e PDF preenchidos automaticamente após o cálculo' },
]

function Slideshow() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % SLIDES.length), 4200)
    return () => clearInterval(t)
  }, [])
  return (
    <div>
      <div style={{ position: 'relative', height: '92px' }}>
        {SLIDES.map((sl, j) => (
          <div key={j} style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', gap: '16px',
            opacity: i === j ? 1 : 0,
            transform: i === j ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity .8s ease, transform .8s ease',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
              background: 'hsl(var(--primary) / 0.10)',
              border: '1px solid hsl(var(--primary) / 0.30)',
              boxShadow: '0 0 24px hsl(var(--primary) / 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sl.logo
                ? <img src={logoNg} alt="NG" style={{ width: '40px', height: 'auto' }} />
                : <sl.Icon size={30} color="hsl(199 89% 55%)" strokeWidth={1.6} />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{sl.titulo}</p>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'hsl(var(--muted-foreground))', maxWidth: '320px' }}>{sl.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {SLIDES.map((_, j) => (
          <div key={j} style={{
            width: i === j ? '22px' : '7px', height: '7px', borderRadius: '999px',
            background: i === j ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.25)',
            transition: 'all .5s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

// Ícones jurídicos flutuando ao fundo + marca d'água NG
function FundoJuridico() {
  const itens = [
    { Icon: Gavel,    top: '12%', left: '68%', size: 34, dur: '9s',  delay: '0s'   },
    { Icon: Scale,    top: '30%', left: '84%', size: 28, dur: '11s', delay: '1.4s' },
    { Icon: Landmark, top: '58%', left: '74%', size: 38, dur: '10s', delay: '0.7s' },
    { Icon: BookOpen, top: '74%', left: '60%', size: 26, dur: '12s', delay: '2.1s' },
    { Icon: FileText, top: '44%', left: '58%', size: 24, dur: '9.5s', delay: '3s'  },
  ]
  return (
    <>
      <img src={logoNg} alt="" style={{
        position: 'absolute', right: '-40px', bottom: '6%',
        width: '300px', opacity: 0.05, filter: 'grayscale(40%)',
        animation: 'ng-drift 14s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {itens.map(({ Icon, ...st }, k) => (
        <Icon key={k} size={st.size} strokeWidth={1.2}
          style={{
            position: 'absolute', top: st.top, left: st.left,
            color: 'hsl(199 89% 55% / 0.14)',
            animation: `ng-float ${st.dur} ease-in-out ${st.delay} infinite`,
            pointerEvents: 'none',
          }} />
      ))}
    </>
  )
}

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
        <FundoJuridico />

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

          {/* Bottom — carrossel jurídico */}
          <Slideshow />
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
        @keyframes ng-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-16px) rotate(4deg); }
        }
        @keyframes ng-drift {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-12px) scale(1.03); }
        }
        @media (min-width: 1024px) {
          .left-panel { display: block !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
