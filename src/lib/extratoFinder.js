// Ponte LEX FINDER -> LEX CALCULATOR.
// Roda o parser multi-banco do LEX FINDER (client-side) sobre o(s) extrato(s) e
// devolve as cobranças indevidas já no formato de parcelas do dano material.
import { parseDocumentoPDF, analyzeAll } from '../lexfinder/parser.js'

function isoFromBR(d) {
  if (!d) return ''
  const m = String(d).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const m2 = String(d).match(/^(\d{2})\/(\d{2})\/(\d{2})$/) // DD/MM/AA
  if (m2) return `20${m2[3]}-${m2[2]}-${m2[1]}`
  return d
}

/**
 * @param files  File ou File[] de extrato(s) bancário(s) (PDF)
 * @param onProgress (page,total,ocr) => void
 * @returns { clientName, banco, parcelas:[{data,valor,categoria,historico}], categorias:[{id,label,qtd,total}], total }
 */
export async function analisarExtrato(files, onProgress) {
  const arr = Array.isArray(files) ? files : [files]
  const todas = []
  let clientName = '', banco = ''
  for (const f of arr) {
    const res = await parseDocumentoPDF(f, onProgress)
    if (res?.unsupported) throw new Error(`Banco não suportado pelo LEX FINDER: ${res.bankName || '?'}`)
    if (res?.clientName && res.clientName !== '—') clientName = res.clientName
    if (res?.banco) banco = res.banco
    todas.push(...(res?.transactions || []))
  }

  const g = analyzeAll(todas)
  const parcelas = []
  const categorias = []
  for (const k of Object.keys(g)) {
    const { cat, items } = g[k]
    let qtd = 0, soma = 0
    for (const it of items) {
      if (it.valor == null) continue
      parcelas.push({ data: isoFromBR(it.data), valor: it.valor, categoria: cat.label, historico: it.historico })
      qtd++; soma += it.valor
    }
    if (qtd) categorias.push({ id: cat.id, label: cat.label, qtd, total: soma })
  }
  parcelas.sort((a, b) => (a.data || '').localeCompare(b.data || ''))
  categorias.sort((a, b) => b.total - a.total)
  const total = parcelas.reduce((a, p) => a + p.valor, 0)
  return { clientName, banco, parcelas, categorias, total }
}
