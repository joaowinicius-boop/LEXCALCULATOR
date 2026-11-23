import { Component, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy, X, Mic, Square, Paperclip, Trash2, Send, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { TIPOS_TICKET, MAX_ANEXOS, MAX_BYTES, abrirTicket, contextoTicket, enviarTicket } from '../lib/tickets.js'

const MAX_GRAVACAO_SEG = 300
const fmtSeg = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * Botão fixo "Ticket" (todas as telas) + formulário. Abre também por abrirTicket(),
 * por exemplo a partir de uma mensagem de erro. Montado uma vez no Layout.
 */
export default function TicketCentral() {
  const [aberto, setAberto] = useState(null)   // null | { tipo?, erro? }
  useEffect(() => {
    const ouvir = (e) => setAberto(e.detail || {})
    window.addEventListener('lex:ticket', ouvir)
    return () => window.removeEventListener('lex:ticket', ouvir)
  }, [])
  return (
    <>
      <button className="btn-primary no-print" onClick={() => setAberto({})} title="Reportar um erro, sugerir uma melhoria ou tirar uma dúvida"
        style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 900, height: 42, borderRadius: 999, padding: '0 16px', fontSize: 13, boxShadow: '0 6px 20px rgba(0,0,0,.35)' }}>
        <LifeBuoy size={16} /> Ticket
      </button>
      {aberto && <TicketModal inicial={aberto} onClose={() => setAberto(null)} />}
    </>
  )
}

function TicketModal({ inicial, onClose }) {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState(inicial.tipo || (inicial.erro ? 'bug' : ''))
  const [descricao, setDescricao] = useState('')
  const [autor, setAutor] = useState(() => { try { return localStorage.getItem('lexTicketAutor') || '' } catch { return '' } })
  const [anexos, setAnexos] = useState([])     // [{ id, tipo, arquivo, url }]
  const [gravando, setGravando] = useState(null)  // segundos gravados; null = parado
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const recRef = useRef(null)
  const anexosRef = useRef(anexos)
  anexosRef.current = anexos
  const [ctx] = useState(() => contextoTicket(inicial.erro ? { erro: inicial.erro } : {}))

  // ao fechar: para a gravação e libera os previews
  useEffect(() => () => {
    if (recRef.current?.state === 'recording') recRef.current.stop()
    anexosRef.current.forEach(a => URL.revokeObjectURL(a.url))
  }, [])

  function adicionar(arquivos) {
    setErro('')
    const novos = []
    for (const f of arquivos) {
      const t = f.type.startsWith('image/') ? 'imagem' : f.type.startsWith('audio/') ? 'audio' : null
      if (!t) { setErro(`"${f.name}" não é imagem nem áudio.`); continue }
      if (f.size > MAX_BYTES) { setErro(`"${f.name}" passa de 15 MB.`); continue }
      novos.push({ id: crypto.randomUUID(), tipo: t, arquivo: f, url: URL.createObjectURL(f) })
    }
    setAnexos(a => {
      const todos = [...a, ...novos]
      if (todos.length > MAX_ANEXOS) { setErro(`No máximo ${MAX_ANEXOS} anexos por ticket.`); todos.slice(MAX_ANEXOS).forEach(x => URL.revokeObjectURL(x.url)) }
      return todos.slice(0, MAX_ANEXOS)
    })
  }
  function remover(id) {
    setAnexos(a => { const x = a.find(y => y.id === id); if (x) URL.revokeObjectURL(x.url); return a.filter(y => y.id !== id) })
  }

  // Print colado com Ctrl+V vira anexo
  function colar(e) {
    const imgs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'))
    if (imgs.length) { e.preventDefault(); adicionar(imgs.map((f, i) => new File([f], `print-${Date.now()}-${i + 1}.${f.type.split('/')[1] || 'png'}`, { type: f.type }))) }
  }

  async function gravar() {
    setErro('')
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {
      setErro('Não consegui usar o microfone. Libere o microfone para este site no navegador, ou anexe um arquivo de áudio.')
      return
    }
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => window.MediaRecorder?.isTypeSupported?.(t))
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    const partes = []
    let seg = 0
    const timer = setInterval(() => { seg += 1; setGravando(seg); if (seg >= MAX_GRAVACAO_SEG) rec.stop() }, 1000)
    rec.ondataavailable = (e) => { if (e.data.size) partes.push(e.data) }
    rec.onstop = () => {
      clearInterval(timer)
      stream.getTracks().forEach(t => t.stop())
      setGravando(null)
      const tipoMime = (rec.mimeType || 'audio/webm').split(';')[0]
      const ext = tipoMime.includes('mp4') ? 'm4a' : tipoMime.split('/')[1]
      if (partes.length) adicionar([new File(partes, `audio-${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}.${ext}`, { type: tipoMime })])
    }
    recRef.current = rec
    rec.start()
    setGravando(0)
  }
  const parar = () => recRef.current?.state === 'recording' && recRef.current.stop()

  const temConteudo = descricao.trim() || anexos.length
  async function enviar() {
    if (!tipo) { setErro('Escolha o tipo do ticket.'); return }
    if (!temConteudo) { setErro('Escreva, grave um áudio ou anexe uma imagem.'); return }
    setEnviando(true); setErro('')
    try {
      try { localStorage.setItem('lexTicketAutor', autor.trim()) } catch { /* sem storage: só não lembra o nome */ }
      await enviarTicket({ tipo, descricao, autor, anexos, contexto: ctx })
      setEnviado(true)
      window.dispatchEvent(new Event('lex:ticket-enviado'))
    } catch (e) { setErro(e.message) } finally { setEnviando(false) }
  }

  const vaiJunto = [`a tela atual (${ctx.pagina})`, ctx.passo && `o passo ${ctx.passo} do cálculo e os dados preenchidos`, ctx.erro && 'a mensagem de erro'].filter(Boolean).join(', ')

  return (
    <div onClick={() => { if (!temConteudo && gravando === null) onClose() }} className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} onPaste={colar} className="card" role="dialog" aria-label="Abrir ticket"
        style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LifeBuoy size={16} color="hsl(var(--primary))" />
            <strong style={{ fontSize: 14 }}>Abrir ticket</strong>
          </div>
          <button onClick={onClose} className="btn-secondary" aria-label="Fechar" style={{ padding: '4px 8px' }}><X size={14} /></button>
        </div>

        {enviado ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <CheckCircle2 size={34} color="var(--success)" />
            <p style={{ margin: '10px 0 4px', fontSize: 15, fontWeight: 700 }}>Ticket enviado</p>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Acompanhe o andamento e a resposta na aba Tickets.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={onClose}>Voltar ao que eu estava fazendo</button>
              <button className="btn-primary" onClick={() => { onClose(); navigate('/tickets') }}>Ver tickets</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {inicial.erro && (
                <div style={{ padding: '8px 12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, color: 'var(--error)', fontSize: 12.5, display: 'flex', gap: 8 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>Erro que vai junto: {inicial.erro}</span>
                </div>
              )}

              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>Tipo <span style={{ color: 'hsl(var(--primary))' }}>*</span></p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="radiogroup" aria-label="Tipo do ticket">
                  {TIPOS_TICKET.map(t => (
                    <button key={t.v} type="button" role="radio" aria-checked={tipo === t.v} onClick={() => setTipo(t.v)}
                      className={tipo === t.v ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12.5, padding: '6px 12px' }}>{t.l}</button>
                  ))}
                </div>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Descrição
                <textarea className="input-lex" rows={4} value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Conte o que aconteceu ou a sua ideia. Pode colar um print aqui (Ctrl+V)."
                  style={{ marginTop: 6, width: '100%', resize: 'vertical', fontWeight: 400 }} />
              </label>

              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>Áudio e imagens <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>(opcional, até {MAX_ANEXOS})</span></p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {gravando !== null ? (
                    <button type="button" className="btn-danger" onClick={parar} style={{ fontSize: 12.5 }}>
                      <Square size={13} /> Parar gravação ({fmtSeg(gravando)})
                    </button>
                  ) : (
                    <button type="button" className="btn-secondary" onClick={gravar} disabled={anexos.length >= MAX_ANEXOS} style={{ fontSize: 12.5 }}>
                      <Mic size={13} /> Gravar áudio
                    </button>
                  )}
                  <label className="btn-secondary" style={{ fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Paperclip size={13} /> Anexar imagem ou áudio
                    <input type="file" accept="image/*,audio/*" multiple style={{ display: 'none' }}
                      onChange={e => { adicionar([...e.target.files]); e.target.value = '' }} />
                  </label>
                </div>
                {anexos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {anexos.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, border: '1px solid hsl(var(--border))', borderRadius: 8 }}>
                        {a.tipo === 'imagem'
                          ? <img src={a.url} alt={a.arquivo.name} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                          : <audio src={a.url} controls style={{ height: 32, flex: 1, minWidth: 0 }} />}
                        {a.tipo === 'imagem' && <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.arquivo.name}</span>}
                        <button type="button" className="btn-danger" aria-label={`Remover ${a.arquivo.name}`} onClick={() => remover(a.id)}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Seu nome <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>(para sabermos quem abriu)</span>
                <input className="input-lex" value={autor} onChange={e => setAutor(e.target.value)} placeholder="Ex.: Victor"
                  style={{ marginTop: 6, width: '100%', fontWeight: 400 }} />
              </label>

              {erro && <p role="alert" style={{ margin: 0, fontSize: 12.5, color: 'var(--error)' }}>{erro}</p>}
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ flex: 1, margin: 0, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Vai junto, para reproduzirmos: {vaiJunto}.</p>
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={enviar} disabled={enviando || gravando !== null || !tipo || !temConteudo}
                style={{ opacity: (enviando || gravando !== null || !tipo || !temConteudo) ? 0.5 : 1 }}>
                {enviando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />} Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Link "Reportar este erro" para pôr dentro das mensagens de erro. */
export function ReportarErro({ erro }) {
  return (
    <button type="button" onClick={() => abrirTicket({ tipo: 'bug', erro })}
      style={{ background: 'none', border: 'none', padding: 0, marginLeft: 6, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', whiteSpace: 'nowrap' }}>
      Reportar este erro
    </button>
  )
}

/** Se uma tela quebrar, mostra o erro com "Reportar" em vez da tela em branco. */
export class LimiteErro extends Component {
  state = { erro: null }
  static getDerivedStateFromError(erro) { return { erro } }
  render() {
    if (!this.state.erro) return this.props.children
    const msg = String(this.state.erro?.message || this.state.erro)
    return (
      <div style={{ padding: 32, maxWidth: 640 }}>
        <div style={{ padding: '14px 16px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 10, color: 'var(--error)', fontSize: 13.5 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Algo deu errado nesta tela.</p>
          <p style={{ margin: 0 }}>{msg}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn-primary" onClick={() => abrirTicket({ tipo: 'bug', erro: msg })}><LifeBuoy size={14} /> Reportar este erro</button>
          <button className="btn-secondary" onClick={() => window.location.reload()}><RotateCcw size={14} /> Recarregar a página</button>
        </div>
      </div>
    )
  }
}
