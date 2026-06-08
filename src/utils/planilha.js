/**
 * planilha.js — leitura DETERMINÍSTICA da planilha de descontos da inicial.
 *
 * A tabela da inicial é gerada a partir desta planilha (na pasta do cliente).
 * Em vez de "ler" a tabela escaneada por OCR/IA (que alucina meses), lemos a
 * planilha estruturada (.xlsx/.xls/.csv) e extraímos:
 *   - cada desconto (data + valor SIMPLES)  → parcelas
 *   - "VALOR TOTAL"     → total simples (base + conferência)
 *   - "VALOR EM DOBRO"  → confirma a repetição do indébito (art. 42 CDC)
 *
 * O valor das parcelas é o SIMPLES; o "em dobro" é aplicado pelo motor (não
 * dobramos aqui — senão contaria 4×).
 */

function parseDataBR(v) {
  if (v instanceof Date && !isNaN(v)) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  }
  const s = String(v ?? '').trim()
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)        // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)                    // ISO
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return null
}

function parseNum(v) {
  if (typeof v === 'number' && isFinite(v)) return Math.round(v * 100) / 100
  let s = String(v ?? '').trim()
  if (!s) return null
  s = s.replace(/[^\d.,-]/g, '')
  if (!s) return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')   // pt-BR: 1.234,56
  const n = parseFloat(s)
  return isFinite(n) ? Math.round(n * 100) / 100 : null
}

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/** Núcleo testável: recebe linhas (array de arrays) e devolve a extração. */
export function extrairDaPlanilhaRows(rows) {
  rows = (rows || []).filter(r => Array.isArray(r))

  // 1) localizar o cabeçalho (linha com "data" e "valor")
  let hdr = -1, colData = -1, colValor = -1, colDesc = -1
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cells = rows[i].map(norm)
    const di = cells.findIndex(c => c === 'data' || c.startsWith('data'))
    const vi = cells.findIndex(c => c === 'valor' || c.includes('valor'))
    if (di >= 0 && vi >= 0) {
      hdr = i; colData = di; colValor = vi
      colDesc = cells.findIndex(c => c.includes('descri'))
      break
    }
  }

  const valorDaLinha = (r) => {
    if (colValor >= 0) { const n = parseNum(r[colValor]); if (n != null) return n }
    for (let j = r.length - 1; j >= 0; j--) { const n = parseNum(r[j]); if (n != null) return n }  // rightmost
    return null
  }
  const dataDaLinha = (r) => {
    if (colData >= 0) { const d = parseDataBR(r[colData]); if (d) return d }
    for (const c of r) { const d = parseDataBR(c); if (d) return d }
    return null
  }

  const parcelas = []
  let totalSimples = null, totalDobro = null

  for (let i = (hdr >= 0 ? hdr + 1 : 0); i < rows.length; i++) {
    const r = rows[i]
    const txt = norm(r.join(' '))
    if (/em\s*dobro/.test(txt)) { const n = valorDaLinha(r); if (n != null) totalDobro = n; continue }
    if (/(valor\s*total|total\s*geral|^total\b|\btotal\b)/.test(txt) && !/parc/.test(txt)) {
      const n = valorDaLinha(r); if (n != null) { totalSimples = n; continue }
    }
    const data = dataDaLinha(r)
    const valor = valorDaLinha(r)
    if (data && valor != null && valor > 0) {
      parcelas.push({ data, valor, descricao: colDesc >= 0 ? String(r[colDesc] || '').trim() : '' })
    }
  }

  const somaParcelas = Math.round(parcelas.reduce((a, p) => a + p.valor, 0) * 100) / 100
  if (totalSimples == null) totalSimples = somaParcelas
  const emDobro = totalDobro != null && Math.abs(totalDobro - totalSimples * 2) < Math.max(0.05, totalSimples * 0.02)

  return { parcelas, somaParcelas, totalSimples, totalDobro, emDobro }
}

/** Lê um File (browser) de planilha e devolve a extração. */
export async function parsePlanilha(file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' })
  return extrairDaPlanilhaRows(rows)
}

export const EXT_PLANILHA = /\.(xlsx|xls|csv)$/i
export const isPlanilha = (file) => EXT_PLANILHA.test(file?.name || '')
