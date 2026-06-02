import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCalculos } from '../hooks/useCalculos.js'
import { fmt } from '../utils/calcular.js'
import {
  Calculator, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Plus, ChevronRight, Loader2
} from 'lucide-react'

function Badge({ status }) {
  if (status === 'concluido')
    return <span className="badge badge-success"><CheckCircle2 size={10} />Pago</span>
  return <span className="badge badge-warning"><Clock size={10} />Pendente</span>
}

function KpiCard({ icon: Icon, label, value, sub, accent, delay }) {
  return (
    <div className="card fade-up" style={{ padding: '20px', animationDelay: delay, opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p className="kpi-label">{label}</p>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: accent ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--secondary))',
          border: `1px solid ${accent ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border))'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={accent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
        </div>
      </div>
      <p className="kpi-value" style={{ color: accent ? 'hsl(var(--primary))' : undefined, fontSize: accent ? '24px' : '36px' }}>
        {value}
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { calculos, loading } = useCalculos()

  const hora      = new Date().getHours()
  const saudacao  = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const totalValor = calculos.reduce((a, c) => a + (c.total_atualizado ?? 0), 0)
  const pendentes  = calculos.filter(c => c.status === 'pendente')
  const valorPend  = pendentes.reduce((a, c) => a + (c.total_atualizado ?? 0), 0)
  const concluidos = calculos.filter(c => c.status === 'concluido').length

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>

      <div className="fade-up" style={{ marginBottom: '28px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
          ANÁLISES · VISÃO GERAL
        </p>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          {saudacao}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
          {loading ? 'Carregando...' : `${calculos.length} cálculos • ${pendentes.length} aguardando pagamento`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={Calculator}   label="Total de Cálculos"       value={loading ? '—' : calculos.length}      sub="neste sistema"                  accent={false} delay="0.05s" />
        <KpiCard icon={TrendingUp}   label="Valor Total em Execução"  value={loading ? '—' : fmt(totalValor)}      sub="abertos + pagos"                accent={true}  delay="0.10s" />
        <KpiCard icon={Clock}        label="Aguardando Pagamento"     value={loading ? '—' : pendentes.length}     sub={loading ? '' : fmt(valorPend) + ' pendente'}   accent={false} delay="0.15s" />
        <KpiCard icon={CheckCircle2} label="Processos Pagos"          value={loading ? '—' : concluidos}           sub="pagamentos confirmados"         accent={false} delay="0.20s" />
      </div>

      <div className="card fade-up stagger-3">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>COMERCIAL</p>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cálculos Recentes</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/historico')} style={{ fontSize: '13px' }}>
            Ver todos <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando cálculos...
          </div>
        ) : calculos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Calculator size={36} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: '0 0 16px', color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Nenhum cálculo ainda</p>
            <button className="btn-primary" onClick={() => navigate('/novo')} style={{ height: '40px', fontSize: '13px' }}>
              <Plus size={15} /> Criar primeiro cálculo
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Cliente</th>
                  <th>Executada</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {calculos.slice(0, 6).map((c, i) => (
                  <tr key={c.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s forwards`, opacity: 0 }}>
                    <td><span className="mono" style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{(c.processo || '—').substring(0, 15)}{c.processo?.length > 15 ? '…' : ''}</span></td>
                    <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cliente}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>{c.executada}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontWeight: 600, color: 'hsl(var(--primary))', fontSize: '13px' }}>
                        {c.total_atualizado ? fmt(c.total_atualizado) : '—'}
                      </span>
                    </td>
                    <td><Badge status={c.status} /></td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate('/historico')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--primary))'}
                        onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ marginTop: '16px', fontSize: '11px', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
        Índices aproximados — SELIC ~13,75% a.a. • IPCA ~4,83% a.a. • Juros 1% a.m. (art. 406 CC)
      </p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
