import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fmt } from '../utils/calcular.js'
import {
  Calculator, TrendingUp, Clock, CheckCircle2,
  ArrowRight, FileText, Plus, ChevronRight
} from 'lucide-react'

const MOCK = [
  { id: '0033813-32.2026.8.04.1000', cliente: 'Ana Karenina da Silva Pessoa',      executada: 'Banco Bradesco S/A', data: '04/05/2026', total: 4938.26,   status: 'concluido', verbas: 2  },
  { id: '0021054-14.2025.8.04.3101', cliente: 'Adailton da Silva Pereira',          executada: 'Banco Bradesco S/A', data: '20/04/2026', total: 39984.86,  status: 'pendente',  verbas: 13 },
  { id: '0015033-82.2024.8.04.1000', cliente: 'Abel Mota Nogueira',                 executada: 'Banco Bradesco S/A', data: '15/04/2026', total: 6067.90,   status: 'concluido', verbas: 8  },
  { id: '0011339-45.2025.8.04.3101', cliente: 'Claudia Nayara Lira Lemos',          executada: 'Banco Bradesco S/A', data: '10/04/2026', total: 6838.49,   status: 'pendente',  verbas: 9  },
  { id: '0017435-21.2025.8.04.3101', cliente: 'Zeildo Almeida Freitas',             executada: 'Banco Bradesco S/A', data: '01/04/2026', total: 30974.44,  status: 'pendente',  verbas: 7  },
  { id: '0023358-91.2025.8.04.1000', cliente: 'Alexandre Luis Barbosa Nogueira',    executada: 'Banco Bradesco S/A', data: '25/03/2026', total: 2579.95,   status: 'concluido', verbas: 6  },
  { id: '0014264-76.2025.8.04.3101', cliente: 'Acrimilson Barros Martins',          executada: 'Banco Bradesco S/A', data: '18/03/2026', total: 14264.76,  status: 'pendente',  verbas: 7  },
  { id: '0026479-18.2024.8.04.1000', cliente: 'Adair Lima Oliveira',                executada: 'Banco Bradesco S/A', data: '10/03/2026', total: 26479.18,  status: 'concluido', verbas: 7  },
]

function Badge({ status }) {
  if (status === 'concluido') return <span className="badge-green"><CheckCircle2 size={10} />Pago</span>
  return <span className="badge-yellow"><Clock size={10} />Pendente</span>
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card fade-up" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '8px',
          background: accent ? 'rgba(201,168,76,0.12)' : 'var(--bg-elevated)',
          border: `1px solid ${accent ? 'rgba(201,168,76,0.2)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={accent ? 'var(--gold)' : 'var(--text-muted)'} />
        </div>
      </div>
      <p className="mono" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 600, color: accent ? 'var(--gold)' : 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>}
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

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'capitalize' }}>{dataHoje}</p>
          <h1 className="cinzel" style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            {saudacao}, <span style={{ color: 'var(--gold)' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {MOCK.length} cálculos no sistema • {pendentes.length} aguardando pagamento
          </p>
        </div>
        <button className="btn-gold" onClick={() => navigate('/novo')}>
          <Plus size={15} />
          Novo Cálculo
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Calculator}   label="Total de Cálculos"   value={MOCK.length}         sub="neste sistema"               accent={false} />
        <StatCard icon={TrendingUp}   label="Valor Total"         value={fmt(totalValor)}     sub="em execuções abertas + pagas" accent={true}  />
        <StatCard icon={Clock}        label="Aguardando Pagamento" value={pendentes.length}    sub={fmt(valorPend) + ' pendente'} accent={false} />
        <StatCard icon={CheckCircle2} label="Concluídos"          value={concluidos}           sub="pagamentos recebidos"         accent={false} />
      </div>

      {/* Recent table */}
      <div className="card fade-up stagger-3">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="cinzel" style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>Cálculos Recentes</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Últimos cumprimentos de sentença elaborados</p>
          </div>
          <button
            className="btn-outline"
            onClick={() => navigate('/historico')}
            style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}
          >
            Ver todos <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Executada</th>
                <th>Verbas</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MOCK.slice(0, 6).map((c, i) => (
                <tr key={c.id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.id.split('-')[0]}-{c.id.split('-')[1].substring(0, 2)}...</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.cliente}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.executada}</td>
                  <td>
                    <span style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}>
                      {c.verbas} verb.
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(c.total)}</span>
                  </td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.data}</td>
                  <td>
                    <button
                      onClick={() => navigate('/novo')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-dim)',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'color 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
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

      {/* Bottom note */}
      <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        Índices utilizados: SELIC ~13,75% a.a. • IPCA ~4,83% a.a. • Juros moratórios 1% a.m. (art. 406 CC) — Valores aproximados. Consulte tabela oficial do BACEN.
      </p>
    </div>
  )
}
