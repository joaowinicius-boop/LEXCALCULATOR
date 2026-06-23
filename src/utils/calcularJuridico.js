/**
 * calcularJuridico.js — Motor de atualização parcela-a-parcela
 *
 * Reproduz a metodologia do "Cálculo Jurídico" (CJ):
 *  - Correção monetária por FATOR real do índice (produto das variações mensais
 *    do mês do desconto, inclusive, até o último mês fechado antes do termo final).
 *  - Juros de mora a partir de data própria (1% a.m. fixo OU taxa legal/SELIC).
 *  - "Em dobro" (repetição do indébito): cada parcela contada 2x.
 *  - Honorários de sucumbência: % sobre o total corrigido dos débitos.
 *
 * Convenção validada com erro ZERO contra DANOSMATERIAIS.pdf (13 fatores).
 *
 * O motor é PURO: recebe as séries de índice já carregadas (mapa 'AAAA-MM' -> %).
 * A busca dos índices (BACEN) fica na camada de dados, não aqui.
 */

// ─── Datas ──────────────────────────────────────────────────────────────────
function parseISO(s) {
  if (s instanceof Date) return s
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function ym(date) {
  const dt = parseISO(date)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function prevMonthKey(key) {
  let [a, m] = key.split('-').map(Number)
  m -= 1
  if (m < 1) { m = 12; a -= 1 }
  return `${a}-${String(m).padStart(2, '0')}`
}
function nextMonthKey(key) {
  let [a, m] = key.split('-').map(Number)
  m += 1
  if (m > 12) { m = 1; a += 1 }
  return `${a}-${String(m).padStart(2, '0')}`
}

/** Meses inteiros (completados) entre duas datas, sem pro-rata. */
export function mesesInteiros(inicio, fim) {
  const a = parseISO(inicio), b = parseISO(fim)
  if (b <= a) return 0
  let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) meses -= 1
  return Math.max(0, meses)
}

// ─── Correção ───────────────────────────────────────────────────────────────
/**
 * Fator de correção pelo método CJ.
 * @param serie  mapa { 'AAAA-MM': variacao_percentual_do_mes }  (ex.: 0.39 = +0,39%)
 * @param dataParcela  data do desconto/evento (string ISO ou Date)
 * @param termoFinal   data do cálculo (string ISO ou Date)
 * @returns número (ex.: 1.586622). 1 se não houver meses no intervalo.
 */
export function fatorCorrecao(serie, dataParcela, termoFinal) {
  if (!serie) return 1
  const inicio = ym(dataParcela)                 // mês do desconto, inclusive
  const fim = prevMonthKey(ym(termoFinal))        // último mês fechado antes do termo
  if (inicio > fim) return 1
  let fator = 1
  let k = inicio
  // guarda contra loop infinito
  for (let i = 0; i < 1000; i++) {
    const v = serie[k]
    if (v !== undefined && v !== null) fator *= 1 + Number(v) / 100
    if (k === fim) break
    k = nextMonthKey(k)
    if (k > fim) break
  }
  return fator
}

/** Acumulado de uma série (ex.: SELIC) entre dois meses, em % (para juros taxa legal). */
export function acumuladoSerie(serie, dataInicio, termoFinal) {
  if (!serie) return 0
  const inicio = ym(dataInicio)
  const fim = prevMonthKey(ym(termoFinal))
  if (inicio > fim) return 0
  let fator = 1, k = inicio
  for (let i = 0; i < 1000; i++) {
    const v = serie[k]
    if (v !== undefined && v !== null) fator *= 1 + Number(v) / 100
    if (k === fim) break
    k = nextMonthKey(k)
    if (k > fim) break
  }
  return (fator - 1) * 100
}

// ─── Juros ──────────────────────────────────────────────────────────────────
// Marco temporal da Lei 14.905/2024: a taxa legal (SELIC − IPCA) vigora a partir
// de 30/08/2024 (60 dias após a publicação em 01/07/2024). Antes disso, juros de
// mora de 1% ao mês. A divisão do período nessa data espelha a ferramenta do TJDFT.
const MARCO_LEI_14905 = '2024-08-30'

/**
 * Percentual de juros de mora no período, conforme o tipo.
 * @param juros { tipo:'fixo_1'|'taxa_legal'|'nenhum', dataInicio, taxaMensal?, serieSelic? }
 */
export function percentualJuros(juros, termoFinal) {
  if (!juros || juros.tipo === 'nenhum' || !juros.dataInicio) return 0
  if (juros.tipo === 'selic') {
    // SELIC pura (juros já englobam correção — usar com índice de correção neutro)
    return acumuladoSerie(juros.serieSelic, juros.dataInicio, termoFinal)
  }
  if (juros.tipo === 'taxa_legal') {
    // Lei 14.905/2024 COM MARCO TEMPORAL (bate com a ferramenta do TJDFT):
    //   • até 29/08/2024  → juros de mora de 1% ao mês (juros simples).
    //   • a partir de 30/08/2024 → taxa legal = SELIC acumulada − IPCA acumulado.
    const ini = juros.dataInicio
    const fim = termoFinal
    let pct = 0
    // Segmento antigo (1% a.m.): de `ini` até o marco (ou até o termo, se anterior).
    if (ini < MARCO_LEI_14905) {
      const fimAntigo = fim < MARCO_LEI_14905 ? fim : MARCO_LEI_14905
      pct += mesesInteiros(ini, fimAntigo) * 1
    }
    // Segmento novo (SELIC − IPCA): do marco (ou de `ini`, se posterior) até o termo.
    if (fim >= MARCO_LEI_14905) {
      const iniNovo = ini > MARCO_LEI_14905 ? ini : MARCO_LEI_14905
      const selic = acumuladoSerie(juros.serieSelic, iniNovo, fim)
      const ipca = acumuladoSerie(juros.serieIpca, iniNovo, fim)
      pct += Math.max(0, selic - ipca)
    }
    return pct
  }
  // fixo_1 (1% a.m.) ou taxa mensal customizada, juros simples
  const taxa = juros.taxaMensal ?? 1
  return mesesInteiros(juros.dataInicio, termoFinal) * taxa
}

// ─── Cálculo por verba ────────────────────────────────────────────────────────
/**
 * @param verba {
 *   tipo, descricao,
 *   indice: 'INPC'|'IPCA'|'SELIC',
 *   serie: mapa do índice escolhido,
 *   emDobro: boolean,                       // repetição do indébito
 *   juros: { tipo, dataInicio, taxaMensal?, serieSelic? },
 *   parcelas: [{ data, valor, descricao? }] // descontos individuais
 * }
 * @param termoFinal data do cálculo (ISO)
 */
export function calcularVerbaJuridica(verba, termoFinal) {
  const pctJuros = percentualJuros(verba.juros, termoFinal)
  const linhas = []

  for (const p of verba.parcelas || []) {
    const valor = Number(p.valor) || 0
    const fator = fatorCorrecao(verba.serie, p.data, termoFinal)
    const valorCorrigido = valor * fator
    const valorJuros = valorCorrigido * (pctJuros / 100)
    const base = {
      data: p.data,
      valor,
      fator,
      percentualCorrecao: (fator - 1) * 100,
      valorCorrigido,
      percentualJuros: pctJuros,
      valorJuros,
      total: valorCorrigido + valorJuros,
    }
    linhas.push({ ...base, tipoLinha: 'Principal', descricao: p.descricao || verba.descricao })
    if (verba.emDobro) {
      linhas.push({ ...base, tipoLinha: 'Repetição de Indébito', descricao: p.descricao || verba.descricao })
    }
  }

  const principalCorrigido = linhas.reduce((a, l) => a + l.valorCorrigido, 0)
  const totalJuros = linhas.reduce((a, l) => a + l.valorJuros, 0)
  const subtotal = principalCorrigido + totalJuros

  return {
    linhas,
    principalCorrigido,
    totalJuros,
    subtotal,                 // principal corrigido + juros (sem honorários)
    percentualJuros: pctJuros,
  }
}

/**
 * Consolida várias verbas + honorários de sucumbência (% sobre total corrigido).
 * @param verbas array de verbas (cada uma já com .serie/.juros)
 * @param opts { termoFinal, honorariosPercentual? }
 */
export function calcularProcesso(verbas, opts = {}) {
  const termoFinal = opts.termoFinal || new Date().toISOString().split('T')[0]
  const resultados = (verbas || []).map(v => ({
    verba: v,
    resultado: calcularVerbaJuridica(v, termoFinal),
  }))

  const principal = resultados.reduce((a, r) => a + r.resultado.principalCorrigido, 0)
  const juros = resultados.reduce((a, r) => a + r.resultado.totalJuros, 0)
  const subtotalSemHonorarios = principal + juros

  const honorariosPct = Number(opts.honorariosPercentual) || 0
  // Honorários sobre o total já corrigido (principal + juros), conforme advogado.
  const honorarios = subtotalSemHonorarios * (honorariosPct / 100)

  return {
    termoFinal,
    resultados,
    principal,
    juros,
    honorarios,
    honorariosPercentual: honorariosPct,
    totalGeral: subtotalSemHonorarios + honorarios,
  }
}

// ─── Formatação ───────────────────────────────────────────────────────────────
export const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export const fmtFator = (v) =>
  Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })

export const fmtPct = (v) =>
  Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

export const fmtData = (s) => {
  if (!s) return '—'
  const [y, m, d] = String(s).split('-')
  return `${d}/${m}/${y}`
}

export const INDICE_NOME = {
  INPC: 'INPC - Índice Nacional de Preços ao Consumidor',
  IPCA: 'IPCA - Índice Nacional de Preços ao Consumidor Amplo',
  SELIC: 'SELIC - Taxa Referencial do Sistema Especial de Liquidação e Custódia',
}
