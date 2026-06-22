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

const MES_NUM = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
}

/**
 * Layout MATRIZ: linhas = meses (JANEIRO..DEZEMBRO, podendo repetir), colunas = anos.
 * Ex.: "TABELA PARCELA CRED PESSOAL": MESES | 2019 | 2020 | 2021 | 2022 | 2024.
 * Gera uma parcela por célula preenchida (dia 28, neutro p/ correção mensal).
 */
function extrairMatriz(rows, totalSimples = null) {
  let hdr = -1, anos = []   // anos[i] = { col, ano }
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const found = []
    rows[i].forEach((c, j) => {
      const n = typeof c === 'number' ? c : parseInt(String(c).trim(), 10)
      if (Number.isInteger(n) && n >= 1990 && n <= 2100 && String(c).trim().length === 4) found.push({ col: j, ano: n })
    })
    if (found.length >= 2 || (found.length === 1 && /mes/.test(norm(rows[i][0])))) { hdr = i; anos = found; break }
  }
  if (hdr < 0 || !anos.length) return null

  // Duas leituras: ESTRITA (só células numéricas — espelha o SOMA do Excel, que ignora
  // texto) e SOLTA (aceita números formatados como texto). Escolhe a que bate com o
  // VALOR TOTAL declarado; sem total, prefere a estrita.
  const coletar = (aceitaTexto) => {
    const out = []
    for (let i = hdr + 1; i < rows.length; i++) {
      const mes = MES_NUM[norm(rows[i][0])]
      if (!mes) continue                                 // ignora VALOR ANUAL/TOTAL/etc.
      for (const { col, ano } of anos) {
        const c = rows[i][col]
        const v = aceitaTexto ? parseNum(c) : (typeof c === 'number' && isFinite(c) ? Math.round(c * 100) / 100 : null)
        if (v != null && v > 0) out.push({ data: `${ano}-${String(mes).padStart(2, '0')}-28`, valor: v, descricao: '' })
      }
    }
    return out
  }
  const soma = (arr) => Math.round(arr.reduce((a, p) => a + p.valor, 0) * 100) / 100
  const estrita = coletar(false), solta = coletar(true)
  let parcelas = estrita.length ? estrita : solta
  if (totalSimples != null) {
    const tol = Math.max(0.02, totalSimples * 0.001)
    if (Math.abs(soma(estrita) - totalSimples) <= tol) parcelas = estrita
    else if (Math.abs(soma(solta) - totalSimples) <= tol) parcelas = solta
  }
  if (!parcelas.length) return null
  parcelas.sort((a, b) => a.data.localeCompare(b.data))
  return parcelas
}

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

  let parcelas = []
  let totalSimples = null, totalDobro = null

  for (let i = (hdr >= 0 ? hdr + 1 : 0); i < rows.length; i++) {
    const r = rows[i]
    const txt = norm(r.join(' '))
    if (/em\s*dobro/.test(txt)) { const n = valorDaLinha(r); if (n != null) totalDobro = n; continue }
    if (/(valor\s*total|total\s*geral|^total\b|\btotal\b)/.test(txt) && !/parc|anual/.test(txt)) {
      const n = valorDaLinha(r); if (n != null) { totalSimples = n; continue }
    }
    const data = dataDaLinha(r)
    const valor = valorDaLinha(r)
    if (data && valor != null && valor > 0) {
      parcelas.push({ data, valor, descricao: colDesc >= 0 ? String(r[colDesc] || '').trim() : '' })
      continue
    }
    // Linha SEM rótulo logo após o TOTAL cujo valor ≈ 2× o total => é o "em dobro"
    if (!data && totalSimples != null && totalDobro == null && valor != null) {
      if (Math.abs(valor - totalSimples * 2) <= Math.max(0.05, totalSimples * 0.01)) totalDobro = valor
    }
  }

  // Layout matriz (meses × anos) quando não há colunas Data/Valor por linha
  if (!parcelas.length) {
    const m = extrairMatriz(rows, totalSimples)
    if (m) parcelas = m
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

// Plataforma LEX FINDER (análise de extratos) — usada na fase de execução para
// detectar os descontos NOVOS que continuaram durante o trâmite do processo.
// URL definida por variável de ambiente (VITE_LEXFINDER_URL) — NUNCA hardcode de
// deploy de terceiros. Vazio = botão "Abrir LEX FINDER" oculto até configurar.
export const LEXFINDER_URL = import.meta.env.VITE_LEXFINDER_URL || 'https://lexfinder-black.vercel.app'

/**
 * Mescla descontos NOVOS (ex.: vindos do LEX FINDER) numa lista existente,
 * sem duplicar (chave data+valor). Devolve a lista consolidada e ordenada.
 */
export function mesclarDescontos(existentes, novos) {
  const norm2 = (v) => Math.round((parseFloat(String(v).replace(',', '.')) || 0) * 100) / 100
  const chave = (p) => `${p.data}|${norm2(p.valor)}`
  const vistos = new Set((existentes || []).map(chave))
  const out = [...(existentes || [])]
  let add = 0
  for (const p of (novos || [])) {
    if (!p?.data || !(norm2(p.valor) > 0)) continue
    const k = chave(p)
    if (vistos.has(k)) continue
    vistos.add(k); out.push({ data: p.data, valor: p.valor, descricao: p.descricao || '' }); add++
  }
  out.sort((a, b) => String(a.data).localeCompare(String(b.data)))
  return { parcelas: out, adicionados: add }
}

/**
 * Exporta uma "nova tabela" consolidada de descontos como .xlsx, no MESMO
 * formato que o parser lê (Data | Descrição | Operação | Valor + VALOR TOTAL +
 * VALOR EM DOBRO) — pronta para anexar à petição / salvar na pasta do cliente.
 */
export async function exportarTabelaXlsx(parcelas, { emDobro = false, nomeArquivo = 'TABELA DE DESCONTOS' } = {}) {
  const XLSX = await import('xlsx')
  const num = (v) => Math.round((parseFloat(String(v).replace(',', '.')) || 0) * 100) / 100
  const fmtData = (s) => { const [y, m, d] = String(s).split('-'); return d ? `${d}/${m}/${y}` : s }
  const linhas = (parcelas || []).filter(p => p.data && num(p.valor) > 0)
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))
  const total = Math.round(linhas.reduce((a, p) => a + num(p.valor), 0) * 100) / 100
  const aoa = [['Data', 'Descrição', 'Operação', 'Valor']]
  for (const p of linhas) aoa.push([fmtData(p.data), p.descricao || '', '', num(p.valor)])
  aoa.push([])
  aoa.push(['VALOR TOTAL', '', '', total])
  if (emDobro) aoa.push(['VALOR EM DOBRO', '', '', Math.round(total * 2 * 100) / 100])
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Descontos')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const url = URL.createObjectURL(new Blob([out], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = url; a.download = `${nomeArquivo}.xlsx`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
