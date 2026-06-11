import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmt } from '../utils/calcular.js'
import { useCalculos } from '../hooks/useCalculos.js'
import {
  Search, Plus, CheckCircle2, Clock,
  ChevronUp, ChevronDown, ArrowRight, Loader2, Trash2
} from 'lucide-react'

export const STATUS_OPCOES = [
  { v: 'pendente',    l: 'Em aberto',   cor: 'var(--warning)' },
  { v: 'protocolado', l: 'Protocolado', cor: 'hsl(var(--primary))' },
  { v: 'concluido',   l: 'Pago',        cor: 'var(--success)' },
  { v: 'arquivado',   l: 'Arquivado',   cor: 'hsl(var(--muted-foreground))' },
]
const statusInfo = (v) => STATUS_OPCOES.find(o => o.v === v) || STATUS_OPCOES[0]

// Seletor de status inline — clique e troque direto na linha
function StatusSelect({ status, onChange }) {
  const info = statusInfo(status)
  return (
    <select value={info.v} onChange={e => onChange(e.target.value)}
      title="Alterar status"
      style={{
        background: 'hsl(var(--secondary))', color: info.cor, fontWeight: 600,
        border: `1px solid ${info.cor}`, borderRadius: '999px', padding: '3px 8px',
        fontSize: '12px', cursor: 'pointer', appearance: 'auto',
      }}>
      {STATUS_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )
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
  const { calculos, loading, excluirCalculo, atualizarStatus } = useCalculos()
  const [excluindo, setExcluindo] = useState(null)

  async function handleExcluir(c) {
    if (!window.confirm(`Excluir o cálculo de "${c.cliente}"? Esta ação não pode ser desfeita.`)) return
    setExcluindo(c.id)
    try { await excluirCalculo(c.id) }
    catch (e) { alert('Erro ao excluir: ' + e.message) }
    finally { setExcluindo(null) }
  }
  const [busca,  setBusca]  = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [sort,   setSort]   = useState({ col: 'created_at', dir: 'desc' })

  // Adapta campos do Supabase para o formato da tabela
  const TODOS = calculos.map(c => ({
    id:       c.id,
    processo: c.processo || '—',
    cliente:  c.cliente,
    executada:c.executada,
    data:     new Date(c.created_at).toLocaleDateString('pt-BR'),
    total:    c.total_atualizado ?? 0,
    status:   c.status,
    verbas:   c.verbas?.length ?? 0,
    tipoDoc:  c.tipo_documento === 'acordao' ? 'Acórdão' : 'Sentença',
    created_at: c.created_at,
    raw: c,
  }))

  const filtered = TODOS
    .filter(c => {
      const q = busca.toLowerCase()
      const match = !q || c.cliente.toLowerCase().includes(q) || c.processo.toLowerCase().includes(q) || c.executada.toLowerCase().includes(q)
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
              { v: 'todos',       l: `Todos ${TODOS.length}` },
              { v: 'pendente',    l: `Em aberto ${TODOS.filter(c=>c.status==='pendente').length}` },
              { v: 'protocolado', l: `Protocolado ${TODOS.filter(c=>c.status==='protocolado').length}` },
              { v: 'concluido',   l: `Pago ${TODOS.filter(c=>c.status==='concluido').length}` },
              { v: 'arquivado',   l: `Arquivado ${TODOS.filter(c=>c.status==='arquivado').length}` },
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
                  {thSort('processo', 'Processo')}
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
                      <span className="mono" style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                        {c.processo}
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
                    <td><StatusSelect status={c.status} onChange={(v) => atualizarStatus(c.id, v)} /></td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', whiteSpace: 'nowrap' }}>{c.data}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                          onClick={() => navigate('/novo', { state: { abrir: c.raw } })}
                          title="Abrir o cálculo"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--primary))'}
                          onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={() => handleExcluir(c)}
                          disabled={excluindo === c.id}
                          title="Excluir"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--error, crimson)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                        >
                          {excluindo === c.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                        </button>
                      </div>
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
          <span>{loading ? 'Carregando…' : 'Sincronizado com o banco'}</span>
        </div>
      </div>
    </div>
  )
}
