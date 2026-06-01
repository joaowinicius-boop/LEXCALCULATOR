import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmt } from '../utils/calcular.js'
import {
  Search, Plus, CheckCircle2, Clock,
  ChevronUp, ChevronDown, ArrowRight
} from 'lucide-react'

const TODOS = [
  { id: '0033813-32.2026.8.04.1000', cliente: 'Ana Karenina da Silva Pessoa',      executada: 'Banco Bradesco S/A', data: '04/05/2026', total: 4938.26,   status: 'concluido', verbas: 2,  tipoDoc: 'Sentença' },
  { id: '0021054-14.2025.8.04.3101', cliente: 'Adailton da Silva Pereira',          executada: 'Banco Bradesco S/A', data: '20/04/2026', total: 39984.86,  status: 'pendente',  verbas: 13, tipoDoc: 'Sentença' },
  { id: '0015033-82.2024.8.04.1000', cliente: 'Abel Mota Nogueira',                 executada: 'Banco Bradesco S/A', data: '15/04/2026', total: 6067.90,   status: 'concluido', verbas: 8,  tipoDoc: 'Sentença' },
  { id: '0011339-45.2025.8.04.3101', cliente: 'Claudia Nayara Lira Lemos',          executada: 'Banco Bradesco S/A', data: '10/04/2026', total: 6838.49,   status: 'pendente',  verbas: 9,  tipoDoc: 'Sentença' },
  { id: '0017435-21.2025.8.04.3101', cliente: 'Zeildo Almeida Freitas',             executada: 'Banco Bradesco S/A', data: '01/04/2026', total: 30974.44,  status: 'pendente',  verbas: 7,  tipoDoc: 'Sentença' },
  { id: '0023358-91.2025.8.04.1000', cliente: 'Alexandre Luis Barbosa Nogueira',    executada: 'Banco Bradesco S/A', data: '25/03/2026', total: 2579.95,   status: 'concluido', verbas: 6,  tipoDoc: 'Sentença' },
  { id: '0014264-76.2025.8.04.3101', cliente: 'Acrimilson Barros Martins',          executada: 'Banco Bradesco S/A', data: '18/03/2026', total: 14264.76,  status: 'pendente',  verbas: 7,  tipoDoc: 'Sentença' },
  { id: '0026479-18.2024.8.04.1000', cliente: 'Adair Lima Oliveira',                executada: 'Banco Bradesco S/A', data: '10/03/2026', total: 26479.18,  status: 'concluido', verbas: 7,  tipoDoc: 'Acórdão'  },
  { id: '0021853-56.2025.8.04.1000', cliente: 'Adriano Guerra Lopes',               executada: 'Banco Bradesco S/A', data: '01/03/2026', total: 21853.56,  status: 'pendente',  verbas: 8,  tipoDoc: 'Sentença' },
  { id: '0100822-55.2024.8.04.3101', cliente: 'Carlemberg Dias Vieira',             executada: 'Banco Bradesco S/A', data: '20/02/2026', total: 100822.55, status: 'concluido', verbas: 9,  tipoDoc: 'Acórdão'  },
  { id: '0195952-02.2024.8.04.1000', cliente: 'Carlos Alberto Mota de Jesus',       executada: 'Banco Bradesco S/A', data: '15/02/2026', total: 195952.02, status: 'pendente',  verbas: 12, tipoDoc: 'Acórdão'  },
  { id: '0130278-20.2024.8.04.3101', cliente: 'George Pedraca Leal',                executada: 'Banco Bradesco S/A', data: '05/02/2026', total: 130278.20, status: 'concluido', verbas: 11, tipoDoc: 'Sentença' },
]

function Badge({ status }) {
  if (status === 'concluido') return <span className="badge badge-success"><CheckCircle2 size={10} />Pago</span>
  return <span className="badge badge-warning"><Clock size={10} />Pendente</span>
}

function TipoDocBadge({ tipo }) {
  const isAcordao = tipo === 'Acórdão'
  return (
    <span style={{
      background: isAcordao ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--secondary))',
      border: `1px solid ${isAcordao ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border))'}`,
      color: isAcordao ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
      borderRadius: '8px',
      padding: '2px 8px',
      fontSize: '12px',
      fontWeight: 500,
    }}>{tipo}</span>
  )
}

export default function Historico() {
  const navigate = useNavigate()
  const [busca,  setBusca]  = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [sort,   setSort]   = useState({ col: 'data', dir: 'desc' })

  const filtered = TODOS
    .filter(c => {
      const q = busca.toLowerCase()
      const match = !q || c.cliente.toLowerCase().includes(q) || c.id.includes(q) || c.executada.toLowerCase().includes(q)
      const statusMatch = filtro === 'todos' || c.status === filtro
      return match && statusMatch
    })
    .sort((a, b) => {
      let va = a[sort.col], vb = b[sort.col]
      if (sort.col === 'total') { va = Number(va); vb = Number(vb) }
      const r = va > vb ? 1 : va < vb ? -1 : 0
      return sort.dir === 'asc' ? r : -r
    })

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' })
  }

  function SortIcon({ col }) {
    if (sort.col !== col) return <ChevronUp size={11} style={{ opacity: 0.2 }} />
    return sort.dir === 'asc'
      ? <ChevronUp size={11} style={{ color: 'hsl(var(--primary))' }} />
      : <ChevronDown size={11} style={{ color: 'hsl(var(--primary))' }} />
  }

  const totalPend = filtered.filter(c => c.status === 'pendente').reduce((a, c) => a + c.total, 0)
  const totalConc = filtered.filter(c => c.status === 'concluido').reduce((a, c) => a + c.total, 0)

  const thSort = (col, label) => (
    <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label} <SortIcon col={col} />
      </span>
    </th>
  )

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
            EXECUÇÃO · HISTÓRICO
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Histórico de Cálculos
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
            {TODOS.length} cálculos registrados no sistema
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/novo')} style={{ height: '40px', fontSize: '13px' }}>
          <Plus size={15} /> Novo Cálculo
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Em Aberto',   value: fmt(totalPend), sub: `${filtered.filter(c=>c.status==='pendente').length} processos`,  color: 'var(--warning)' },
          { label: 'Recebido',    value: fmt(totalConc), sub: `${filtered.filter(c=>c.status==='concluido').length} processos`, color: 'var(--success)' },
          { label: 'Total Geral', value: fmt(totalPend + totalConc), sub: `${filtered.length} mostrados`,                       color: 'hsl(var(--foreground))' },
        ].map((s, i) => (
          <div key={s.label} className="card fade-up" style={{ padding: '16px 20px', animationDelay: `${i * 0.05}s`, opacity: 0 }}>
            <p className="kpi-label">{s.label}</p>
            <p className="mono kpi-value" style={{ fontSize: '20px', color: s.color, margin: '4px 0 2px' }}>{s.value}</p>
            <p className="kpi-sub">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card fade-up stagger-3">
        {/* Filters */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--muted-foreground))',
              pointerEvents: 'none',
            }} />
            <input
              className="input-lex input-icon"
              placeholder="Buscar por cliente, processo ou executada..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {/* Segmented control */}
          <div className="seg-ctrl">
            {[
              { v: 'todos',     l: `Todos ${TODOS.length}`   },
              { v: 'pendente',  l: `Pendente ${TODOS.filter(c=>c.status==='pendente').length}` },
              { v: 'concluido', l: `Pago ${TODOS.filter(c=>c.status==='concluido').length}`    },
            ].map(f => (
              <button key={f.v} className={`seg-btn${filtro === f.v ? ' active' : ''}`} onClick={() => setFiltro(f.v)}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <Search size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum resultado encontrado</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {thSort('id', 'Processo')}
                  {thSort('cliente', 'Cliente')}
                  <th>Executada</th>
                  <th>Doc.</th>
                  <th style={{ textAlign: 'center' }}>Verbas</th>
                  <th style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('total')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      Total <SortIcon col="total" />
                    </span>
                  </th>
                  <th>Status</th>
                  {thSort('data', 'Data')}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.025}s forwards`, opacity: 0 }}>
                    <td>
                      <span className="mono" style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                        {c.id.substring(0, 14)}…
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.cliente}
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>{c.executada}</td>
                    <td><TipoDocBadge tipo={c.tipoDoc} /></td>
                    <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>{c.verbas}</td>
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
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'hsl(var(--muted-foreground))',
                          padding: '4px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center',
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
          )}
        </div>

        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid hsl(var(--border))',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))',
        }}>
          <span>{filtered.length} de {TODOS.length} registros</span>
          <span>Dados demonstrativos</span>
        </div>
      </div>
    </div>
  )
}
