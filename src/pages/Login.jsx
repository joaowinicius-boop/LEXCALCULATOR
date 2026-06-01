import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Scale, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [erro,    setErro]    = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="legal-bg" style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
    }}>
      {/* Top gold bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, var(--gold-dim) 20%, var(--gold) 50%, var(--gold-dim) 80%, transparent 100%)',
      }} />

      {/* Background ornamental circles */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px', height: '64px',
            borderRadius: '50%',
            border: '1px solid rgba(201,168,76,0.3)',
            background: 'var(--bg-elevated)',
            marginBottom: '1rem',
          }} className="gold-glow">
            <span className="cinzel" style={{ color: 'var(--gold)', fontSize: '1.75rem', fontWeight: 700 }}>§</span>
          </div>

          <h1 className="cinzel" style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            color: 'var(--gold)',
            letterSpacing: '0.15em',
            margin: 0,
            lineHeight: 1,
          }}>LEX</h1>

          <p className="cinzel" style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.45em',
            marginTop: '0.3rem',
            marginBottom: '1rem',
          }}>CALCULATOR</p>

          <div className="gold-divider" />

          <p style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: '0.75rem',
          }}>
            Nicolas Gomes Advogado • OAB/AM 8.926
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="cinzel" style={{
            fontSize: '1rem',
            color: 'var(--text)',
            marginBottom: '1.5rem',
            letterSpacing: '0.05em',
          }}>
            Acesso ao Sistema
          </h2>

          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#F87171',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}>E-mail</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-gold"
                placeholder="seu@email.com.br ou admin"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="input-gold"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> VERIFICANDO...</>
                : 'ENTRAR'
              }
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Acesso demo:</span><br />
              E-mail: <span className="mono" style={{ color: 'var(--text)' }}>admin</span> / Senha: <span className="mono" style={{ color: 'var(--text)' }}>admin</span>
            </p>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          marginTop: '1.5rem',
          letterSpacing: '0.05em',
        }}>
          LEX CALCULATOR v1.0 — Sistema de Cálculos de Execução
        </p>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
