import { useEffect, useState } from 'react'
import { LifeBuoy, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { NOME_TIPO, STATUS_TICKET, abrirTicket, linksAnexos, listarTickets, responderTicket } from '../lib/tickets.js'

const COR_STATUS = { aberto: 'var(--warning)', em_andamento: 'hsl(199 89% 55%)', resolvido: 'var(--success)' }
const fmtQuando = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const pill = (cor) => ({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: `1px solid ${cor}`, color: cor, whiteSpace: 'nowrap' })

export default function Tickets() {
  const { user } = useAuth()
  const admin = !!user?.app_metadata?.lex_admin
  const [tickets, setTickets] = useState(null)
  const [links, setLinks] = useState({})
  const [filtro, setFiltro] = useState('todos')
  const [erro, setErro] = useState('')

  async function carregar() {
    setErro('')
    try {
      const t = await listarTickets()
      setTickets(t)
      setLinks(await linksAnexos(t.flatMap(x => (x.anexos || []).map(a => a.path))))
    } catch (e) { setErro(e.message); setTickets(t => t || []) }
  }
  useEffect(() => { carregar() }, [])
  // ticket novo enviado pelo formulário: recarrega a lista
  useEffect(() => {
    window.addEventListener('lex:ticket-enviado', carregar)
    return () => window.removeEventListener('lex:ticket-enviado', carregar)
  }, [])

  const lista = (tickets || []).filter(t => filtro === 'todos' || t.status === filtro)
  const conta = (s) => (tickets || []).filter(t => t.status === s).length

  return (
    <div style={{ padding: '24px 28px', maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Tickets</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            Erros, melhorias, sugestões e dúvidas sobre o Lex. {admin ? 'Você vê todos e pode responder.' : 'Você vê os seus e as respostas.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={carregar} aria-label="Atualizar"><RefreshCw size={14} /></button>
          <button className="btn-primary" onClick={() => abrirTicket()}><LifeBuoy size={14} /> Abrir ticket</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['todos', `Todos ${(tickets || []).length}`], ...Object.entries(STATUS_TICKET).map(([k, l]) => [k, `${l} ${conta(k)}`])].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} className={filtro === k ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12.5, padding: '5px 12px' }}>{l}</button>
        ))}
      </div>

      {erro && <p role="alert" style={{ color: 'var(--error)', fontSize: 13 }}>Não consegui carregar os tickets: {erro}</p>}
      {tickets === null && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: -2 }} /> Carregando…</p>}
      {tickets && !lista.length && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Nenhum ticket aqui.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.map(t => <TicketCard key={t.id} t={t} links={links} admin={admin} onSalvo={carregar} />)}
      </div>
    </div>
  )
}

function TicketCard({ t, links, admin, onSalvo }) {
  const [status, setStatus] = useState(t.status)
  const [resposta, setResposta] = useState(t.resposta || '')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const ctx = t.contexto || {}
  const mudou = status !== t.status || resposta !== (t.resposta || '')

  async function salvar() {
    setSalvando(true); setMsg('')
    try { await responderTicket(t.id, { status, resposta }); setMsg('Salvo.'); onSalvo() } catch (e) { setMsg('Erro: ' + e.message) } finally { setSalvando(false) }
  }

  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={pill('hsl(var(--primary))')}>{NOME_TIPO[t.tipo] || t.tipo}</span>
        <span style={pill(COR_STATUS[t.status])}>{STATUS_TICKET[t.status]}</span>
        <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{fmtQuando(t.created_at)}{t.autor ? ` · ${t.autor}` : ''}</span>
      </div>

      {ctx.erro && <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--error)' }}>Erro: {ctx.erro}</p>}
      {t.descricao && <p style={{ margin: '10px 0 0', fontSize: 14, whiteSpace: 'pre-wrap' }}>{t.descricao}</p>}

      {(t.anexos || []).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          {t.anexos.map(a => !links[a.path] ? <span key={a.path} style={{ fontSize: 12 }}>{a.nome} (link indisponível)</span>
            : a.tipo === 'imagem'
              ? <a key={a.path} href={links[a.path]} target="_blank" rel="noreferrer" title={a.nome}><img src={links[a.path]} alt={a.nome} style={{ height: 90, maxWidth: 160, objectFit: 'cover', borderRadius: 6, border: '1px solid hsl(var(--border))' }} /></a>
              : <audio key={a.path} src={links[a.path]} controls style={{ height: 34 }} />)}
        </div>
      )}

      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>Detalhes técnicos</summary>
        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 6, lineHeight: 1.5 }}>
          <div>Tela: {ctx.pagina || '—'}{ctx.passo ? ` · passo ${ctx.passo} do cálculo` : ''}</div>
          {ctx.ultimoErroJs && <div>Último erro da página: {ctx.ultimoErroJs}</div>}
          {ctx.calculo && <div>Cálculo: {ctx.calculo.cliente || '—'} {ctx.calculo.processo ? `· ${ctx.calculo.processo}` : ''} · {(ctx.calculo.verbas || []).length} verba(s)</div>}
          <div>Navegador: {ctx.navegador || '—'}</div>
          {ctx.calculo && admin && (
            <button className="btn-secondary" style={{ fontSize: 11.5, padding: '3px 8px', marginTop: 6 }}
              onClick={() => navigator.clipboard.writeText(JSON.stringify(ctx.calculo, null, 2))}>Copiar dados do cálculo (JSON)</button>
          )}
        </div>
      </details>

      {admin ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid hsl(var(--border))', display: 'grid', gridTemplateColumns: '170px 1fr auto', gap: 8, alignItems: 'start' }}>
          <select className="input-lex" aria-label="Status do ticket" value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_TICKET).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <textarea className="input-lex" rows={2} aria-label="Resposta" placeholder="Resposta para quem abriu (opcional)" value={resposta} onChange={e => setResposta(e.target.value)} style={{ resize: 'vertical' }} />
          <button className="btn-primary" onClick={salvar} disabled={!mudou || salvando} style={{ opacity: (!mudou || salvando) ? 0.5 : 1 }}>Salvar</button>
          {msg && <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 12, color: msg.startsWith('Erro') ? 'var(--error)' : 'var(--success)' }}>{msg}</p>}
        </div>
      ) : t.resposta && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'hsl(var(--secondary))', borderRadius: 8, fontSize: 13 }}>
          <strong>Resposta{t.respondido_em ? ` (${fmtQuando(t.respondido_em)})` : ''}:</strong> {t.resposta}
        </div>
      )}
    </div>
  )
}
