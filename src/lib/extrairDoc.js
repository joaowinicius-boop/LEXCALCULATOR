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
 * Envia documentos (PDF/imagem) e/ou texto para a Edge Function `extrair-doc`,
 * que usa a IA (Claude) para devolver { processo, verbas } no contrato do sistema.
 */
export async function extrairDocumentos({ documentos = [], texto = '' }) {
  const invoke = supabase.functions.invoke('extrair-doc', { body: { documentos, texto } })
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('A IA demorou demais para responder. Tente enviar menos páginas (só a inicial e o dispositivo) ou um PDF menor.')), 125000))

  const { data, error } = await Promise.race([invoke, timeout])
  if (error) {
    let msg = error.message || 'Falha ao chamar a IA'
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error } catch { /* ignore */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data // { ok, processo, verbas, usage }
}
