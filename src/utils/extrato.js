/**
 * extrato.js — análise de extratos bancários DENTRO do LEX CALCULATOR.
 *
 * Usa o motor do LEX FINDER (vendorizado em src/lexfinder) rodando no próprio
 * navegador do calculator — um sistema só, um login só, sem trocar de URL/aba.
 * Detecta cobranças indevidas por rubrica (PDF.js + OCR fallback) e devolve os
 * descontos {data ISO, valor} para somar à verba de dano material.
 */
import { parseDocumentoPDF, analyzeAll } from '../lexfinder/parser.js'

const toISO = (br) => {
  const m = String(br || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (br || '')
}
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

/**
 * Analisa um ou mais extratos (File[] PDF) e devolve as cobranças agrupadas por
 * rubrica/categoria.
 * @returns {Promise<{ grupos, meta, naoSuportado }>}
 *   grupos: [{ id, label, fundamento, total, qtd, items:[{data,valor,historico}] }]
 */
export async function analisarExtratos(files, onProgress) {
  const transTodas = []
  let meta = null, naoSuportado = null
  for (let i = 0; i < files.length; i++) {
    onProgress?.({ etapa: 'lendo', arquivo: files[i].name, idx: i + 1, total: files.length })
    const r = await parseDocumentoPDF(files[i], (page, total, ocr) =>
      onProgress?.({ etapa: ocr ? 'ocr' : 'lendo', arquivo: files[i].name, page, totalPaginas: total, idx: i + 1, total: files.length }))
    if (r?.unsupported) { naoSuportado = r.bankName || 'desconhecido'; continue }
    if (!meta) meta = { cliente: r?.clientName, banco: r?.bankName }
    for (const t of (r?.transactions || [])) transTodas.push(t)
  }
  onProgress?.({ etapa: 'classificando' })
  const grouped = analyzeAll(transTodas)
  const grupos = Object.values(grouped).map(({ cat, items }) => {
    const its = items
      .filter(it => typeof it.valor === 'number' && it.valor > 0)
      .map(it => ({ data: toISO(it.data), valor: round2(it.valor), historico: it.historico || cat.descricao || cat.label }))
      .filter(it => /^\d{4}-\d{2}-\d{2}$/.test(it.data))
      .sort((a, b) => a.data.localeCompare(b.data))
    return {
      id: cat.id, label: cat.label, fundamento: cat.fundamento,
      naoReembolsavel: !!cat.naoReembolsavel,
      qtd: its.length, total: round2(its.reduce((s, it) => s + it.valor, 0)), items: its,
    }
  }).filter(g => g.qtd > 0).sort((a, b) => b.total - a.total)
  return { grupos, meta, naoSuportado }
}
