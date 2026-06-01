import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmt } from '../utils/calcular.js'
import {
  Search, Plus, CheckCircle2, Clock, ChevronUp, ChevronDown,
  ArrowRight, Download
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
  if (status === 'concluido')
    return <span className="badge-green"><CheckCircle2 size={10} />Pago</span>
  return <span className="badge-yellow"><Clock size={10} />Pendente</span>
}

export default function Historico() {
  const navigate = useNavigate()
  const [busca,   setBusca]   = useState('')
  const [filtro,  setFiltro]  = useState('todos')
  const [sort,    setSort]    = useState({ col: 'data', dir: 'desc' })

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
      ? <ChevronUp size={11} style={{ color: 'var(--gold)' }} />
      : <ChevronDown size={11} style={{ color: 'var(--gold)' }} />
  }

  const totalPendente  = filtered.filter(c => c.status === 'pendente').reduce((a,c) => a + c.total, 0)
  const totalConcluido = filtered.filter(c => c.status === 'concluido').reduce((a,c) => a + c.total, 0)

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="cinzel" style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)', fontWeight: 700 }}>
            <span style={{ color: 'var(--gold)' }}>§</span> Histórico de Cálculos
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {TODOS.length} cálculos no total
          </p>
        </div>
        <button className="btn-gold" onClick={() => navigate('/novo')}>
          <Plus size={15} />
          Novo Cálculo
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card fade-up" style={{ padding: '1rem 1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Em aberto</p>
          <p className="mono" style={{ margin: '0.3rem 0 0', fontSize: '1.3rem', fontWeight: 600, color: 'var(--gold-light)' }}>{fmt(totalPendente)}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.filter(c=>c.status==='pendente').length} processos</p>
        </div>
        <div className="card fade-up" style={{ padding: '1rem 1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recebido</p>
          <p className="mono" style={{ margin: '0.3rem 0 0', fontSize: '1.3rem', fontWeight: 600, color: '#4ADE80' }}>{fmt(totalConcluido)}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.filter(c=>c.status==='concluido').length} processos</p>
        </div>
        <div className="card fade-up" style={{ padding: '1rem 1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total geral</p>
          <p className="mono" style={{ margin: '0.3rem 0 0', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)' }}>{fmt(totalPendente + totalConcluido)}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.length} mostrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card fade-up" style={{ marginBottom: '0' }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-gold"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Buscar por cliente, processo ou executada..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {[
              { v: 'todos',    l: 'Todos'    },
              { v: 'pendente', l: 'Pendente' },
              { v: 'concluido',l: 'Pago'     },
            ].map(f => (
              <button
                key={f.v}
                onClick={() => setFiltro(f.v)}
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: '99px',
                  border: `1px solid ${filtro === f.v ? 'var(--gold)' : 'var(--border)'}`,
                  background: filtro === f.v ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: filtro === f.v ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  fontFamily: 'Outfit, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>Nenhum resultado encontrado</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Processo <SortIcon col="id" /></span>
                  </th>
                  <th onClick={() => toggleSort('cliente')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Cliente <SortIcon col="cliente" /></span>
                  </th>
                  <th>Executada</th>
                  <th>Doc. Base</th>
                  <th style={{ textAlign: 'center' }}>Verbas</th>
                  <th onClick={() => toggleSort('total')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>Total <SortIcon col="total" /></span>
                  </th>
                  <th>Status</th>
                  <th onClick={() => toggleSort('data')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Data <SortIcon col="data" /></span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.03}s forwards`, opacity: 0 }}>
                    <td>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {c.id.substring(0, 13)}...
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '220px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.cliente}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.executada}</td>
                    <td>
                      <span style={{
                        background: c.tipoDoc === 'Acórdão' ? 'rgba(59,111,240,0.1)' : 'var(--bg-elevated)',
                        border: `1px solid ${c.tipoDoc === 'Acórdão' ? 'rgba(59,111,240,0.25)' : 'var(--border)'}`,
                        color: c.tipoDoc === 'Acórdão' ? '#7BA7F7' : 'var(--text-muted)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                      }}>
                        {c.tipoDoc}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.verbas}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(c.total)}</span>
                    </td>
                    <td><Badge status={c.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{c.data}</td>
                    <td>
                      <button
                        onClick={() => navigate('/novo')}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-dim)', padding: '0.25rem', borderRadius: '4px',
                          transition: 'color 0.1s', display: 'flex', alignItems: 'center',
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
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{filtered.length} de {TODOS.length} registros</span>
          <span>Dados demonstrativos</span>
        </div>
      </div>
    </div>
  )
}
