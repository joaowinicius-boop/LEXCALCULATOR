import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fmt } from '../utils/calcular.js'
import {
  Calculator, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Plus, ChevronRight, BarChart3, Scale
} from 'lucide-react'

const MOCK = [
  { id: '0033813-32.2026.8.04.1000', cliente: 'Ana Karenina da Silva Pessoa',      executada: 'Banco Bradesco S/A', data: '04/05/2026', total: 4938.26,   status: 'concluido', verbas: 2  },
  { id: '0021054-14.2025.8.04.3101', cliente: 'Adailton da Silva Pereira',          executada: 'Banco Bradesco S/A', data: '20/04/2026', total: 39984.86,  status: 'pendente',  verbas: 13 },
  { id: '0015033-82.2024.8.04.1000', cliente: 'Abel Mota Nogueira',                 executada: 'Banco Bradesco S/A', data: '15/04/2026', total: 6067.90,   status: 'concluido', verbas: 8  },
  { id: '0011339-45.2025.8.04.3101', cliente: 'Claudia Nayara Lira Lemos',          executada: 'Banco Bradesco S/A', data: '10/04/2026', total: 6838.49,   status: 'pendente',  verbas: 9  },
  { id: '0017435-21.2025.8.04.3101', cliente: 'Zeildo Almeida Freitas',             executada: 'Banco Bradesco S/A', data: '01/04/2026', total: 30974.44,  status: 'pendente',  verbas: 7  },
  { id: '0023358-91.2025.8.04.1000', cliente: 'Alexandre Luis Barbosa Nogueira',    executada: 'Banco Bradesco S/A', data: '25/03/2026', total: 2579.95,   status: 'concluido', verbas: 6  },
]

function Badge({ status }) {
  if (status === 'concluido')
    return <span className="badge badge-success"><CheckCircle2 size={10} />Pago</span>
  return <span className="badge badge-warning"><Clock size={10} />Pendente</span>
}

function KpiCard({ icon: Icon, label, value, sub, accent, delay }) {
  return (
    <div className="card fade-up" style={{
      padding: '20px',
      animationDelay: delay,
      opacity: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p className="kpi-label">{label}</p>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '8px',
          background: accent ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--secondary))',
          border: `1px solid ${accent ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border))'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={accent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
        </div>
      </div>
      <p className={`kpi-value${accent ? ' mono' : ''}`} style={{
        color: accent ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        fontSize: accent ? '28px' : '36px',
      }}>
        {value}
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const totalValor   = MOCK.reduce((a, c) => a + c.total, 0)
  const pendentes    = MOCK.filter(c => c.status === 'pendente')
  const valorPend    = pendentes.reduce((a, c) => a + c.total, 0)
  const concluidos   = MOCK.filter(c => c.status === 'concluido').length

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div className="fade-up" style={{ marginBottom: '28px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
          ANÁLISES · VISÃO GERAL
        </p>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          {saudacao}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
          {MOCK.length} cálculos no sistema • {pendentes.length} processos aguardando pagamento
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard icon={Calculator}   label="Total de Cálculos"      value={MOCK.length}        sub="neste sistema"                  accent={false} delay="0.05s" />
        <KpiCard icon={TrendingUp}   label="Valor Total em Execução" value={fmt(totalValor)}    sub="abertos + pagos"                accent={true}  delay="0.10s" />
        <KpiCard icon={Clock}        label="Aguardando Pagamento"    value={pendentes.length}   sub={fmt(valorPend) + ' pendente'}  accent={false} delay="0.15s" />
        <KpiCard icon={CheckCircle2} label="Processos Pagos"         value={concluidos}          sub="pagamentos confirmados"         accent={false} delay="0.20s" />
      </div>

      {/* Recent table */}
      <div className="card fade-up stagger-3" style={{ marginBottom: '20px' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
              COMERCIAL
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Cálculos Recentes
            </h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/historico')} style={{ fontSize: '13px' }}>
            Ver todos <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Executada</th>
                <th style={{ textAlign: 'center' }}>Verbas</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MOCK.map((c, i) => (
                <tr key={c.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s forwards`, opacity: 0 }}>
                  <td>
                    <span className="mono" style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                      {c.id.split('-')[0]}-{c.id.split('-')[1].substring(0,4)}…
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.cliente}
                  </td>
                  <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>{c.executada}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))',
                    }}>
                      {c.verbas}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 600, color: 'hsl(var(--primary))', fontSize: '13px' }}>
                      {fmt(c.total)}
                    </span>
                  </td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', whiteSpace: 'nowrap' }}>{c.data}</td>
                  <td>
                    <button
                      onClick={() => navigate('/novo')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.1s',
                      }}
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
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textAlign: 'center', letterSpacing: '0.02em' }}>
        Índices aproximados — SELIC ~13,75% a.a. • IPCA ~4,83% a.a. • Juros moratórios 1% a.m. (art. 406 CC). Consulte o BACEN para valores oficiais.
      </p>
    </div>
  )
}
