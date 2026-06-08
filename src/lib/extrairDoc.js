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
  const { data, error } = await supabase.functions.invoke('extrair-doc', {
    body: { documentos, texto },
  })
  if (error) throw new Error(error.message || 'Falha ao chamar a IA')
  if (data?.error) throw new Error(data.error)
  return data // { ok, processo, verbas, usage }
}
