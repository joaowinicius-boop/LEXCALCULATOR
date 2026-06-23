import { supabase } from './supabase.js'

/** Converte um File em base64 puro (sem o prefixo data:...;base64,). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/**
 * Envia documentos (PDF/imagem) e/ou texto para a função serverless `/api/extrair-doc`
 * (mesma origem, na Vercel do calculator — chave OpenAI só no servidor), que usa a IA
 * para devolver { processo, verbas } no contrato do sistema. Requer usuário logado:
 * mandamos o JWT da sessão Supabase no header Authorization para o gate de acesso.
 */
export async function extrairDocumentos({ documentos = [], texto = '' }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 65000)
  let res
  try {
    res = await fetch('/api/extrair-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ documentos, texto }),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    if (e?.name === 'AbortError') throw new Error('A IA demorou demais para responder. Tente enviar menos páginas (só a inicial e o dispositivo) ou um PDF menor.')
    throw e
  }
  clearTimeout(timer)

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) throw new Error(data?.error || `Falha ao chamar a IA (${res.status}).`)
  return data // { ok, processo, verbas, usage }
}
