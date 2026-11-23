import { supabase } from './supabase.js'

/**
 * Tickets do Lex: bugs, melhorias, sugestões e dúvidas, com texto, áudio e imagem.
 * Anexos vão para a pasta privada "tickets" do Storage (tickets/<user id>/<ticket id>/...)
 * e a linha em public.tickets. Quem responde: app_metadata.lex_admin = true.
 */
export const TIPOS_TICKET = [
  { v: 'bug', l: 'Bug / erro' },
  { v: 'melhoria', l: 'Melhoria' },
  { v: 'sugestao', l: 'Sugestão' },
  { v: 'duvida', l: 'Dúvida' },
  { v: 'outro', l: 'Outro' },
]
export const NOME_TIPO = Object.fromEntries(TIPOS_TICKET.map(t => [t.v, t.l]))
export const STATUS_TICKET = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido' }
export const MAX_ANEXOS = 6
export const MAX_BYTES = 15 * 1024 * 1024   // limite da pasta "tickets" no Storage

// O que vai junto no ticket para reproduzir o problema: a tela, o passo e os dados do
// cálculo (o NovoCalculo informa via definirContextoTicket) e o último erro de JS da página.
let contextoAtual = {}
let ultimoErroJs = ''
export function definirContextoTicket(c) { contextoAtual = c || {} }
if (typeof window !== 'undefined') {
  window.addEventListener('error', e => { ultimoErroJs = String(e.message || e.error || '') })
  window.addEventListener('unhandledrejection', e => { ultimoErroJs = String(e.reason?.message || e.reason || '') })
}
export function contextoTicket(extra = {}) {
  return {
    pagina: window.location.pathname,
    ...contextoAtual,
    ...(ultimoErroJs ? { ultimoErroJs } : {}),
    ...extra,
    navegador: navigator.userAgent,
    quando: new Date().toISOString(),
  }
}

/** Abre o formulário de ticket de qualquer lugar (ex.: { tipo: 'bug', erro: mensagem }). */
export function abrirTicket(opts = {}) {
  window.dispatchEvent(new CustomEvent('lex:ticket', { detail: opts }))
}

const nomeSeguro = (n) => String(n || 'arquivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80)

/** anexos: [{ tipo: 'imagem'|'audio', arquivo: File }] */
export async function enviarTicket({ tipo, descricao, autor, anexos = [], contexto = {} }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sua sessão expirou. Entre de novo para abrir o ticket.')
  const id = crypto.randomUUID()
  const salvos = []
  for (const [i, a] of anexos.entries()) {
    const path = `${session.user.id}/${id}/${i + 1}-${nomeSeguro(a.arquivo.name)}`
    const { error } = await supabase.storage.from('tickets')
      .upload(path, a.arquivo, { contentType: (a.arquivo.type || 'application/octet-stream').split(';')[0] })
    if (error) throw new Error(`Não consegui enviar o anexo "${a.arquivo.name}": ${error.message}`)
    salvos.push({ tipo: a.tipo, path, nome: a.arquivo.name, tamanho: a.arquivo.size })
  }
  const { error } = await supabase.from('tickets').insert({
    id, tipo, descricao: descricao?.trim() || null, autor: autor?.trim() || null, anexos: salvos, contexto,
  })
  if (error) throw new Error(`Não consegui registrar o ticket: ${error.message}`)
  return id
}

export async function listarTickets() {
  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/** Links temporários (1 h) para ver/ouvir os anexos. Retorna { path: url }. */
export async function linksAnexos(paths) {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from('tickets').createSignedUrls(paths, 3600)
  if (error) throw new Error(error.message)
  return Object.fromEntries((data || []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]))
}

export async function responderTicket(id, { status, resposta }) {
  const { error } = await supabase.from('tickets').update({
    status, resposta: resposta?.trim() || null, respondido_em: resposta?.trim() ? new Date().toISOString() : null,
  }).eq('id', id)
  if (error) throw new Error(error.message)
}
