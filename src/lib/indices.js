import { supabase } from './supabase.js'

/**
 * Busca a série mensal de um índice oficial (INPC/IPCA/SELIC) via `/api/indices`
 * (proxy do BACEN na Vercel). Retorna mapa { 'AAAA-MM': variacao_percentual }.
 *
 * Cacheia em memória por sessão para não repetir chamadas.
 */
const _cache = new Map()

export async function buscarSerie(indice, dataInicial = '01/01/2010', dataFinal) {
  const ind = String(indice).toUpperCase()
  if (!dataFinal) {
    const n = new Date()
    dataFinal = `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`
  }
  const key = `${ind}|${dataInicial}|${dataFinal}`
  if (_cache.has(key)) return _cache.get(key)

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/indices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
    body: JSON.stringify({ indice: ind, dataInicial, dataFinal }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) throw new Error(`Falha ao buscar índice ${ind}: ${data?.error || res.status}`)

  const serie = data.serie || {}
  _cache.set(key, serie)
  return serie
}

/**
 * Carrega de uma vez as séries necessárias para um cálculo.
 * Retorna { INPC, IPCA, SELIC } (apenas os pedidos).
 */
export async function carregarSeries(indices = ['INPC', 'IPCA', 'SELIC']) {
  const unicos = [...new Set(indices.map(i => String(i).toUpperCase()))]
  const pares = await Promise.all(unicos.map(async i => [i, await buscarSerie(i)]))
  return Object.fromEntries(pares)
}
