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

// ─── Números pt-BR ──────────────────────────────────────────────────────────
/**
 * Converte valor digitado pelo usuário em número, aceitando os formatos
 * brasileiros: "2.000,00" (milhar+decimal), "2.000" (milhar), "2000,00",
 * "0,88", além de "39.50" e "2000". NUNCA lê "2.000" como 2 — a regra é:
 * ponto seguido de grupos de exatamente 3 dígitos (sem vírgula) = milhar.
 */
export function parseValorBR(x) {
  if (typeof x === 'number') return isFinite(x) ? x : 0
  let s = String(x ?? '').trim().replace(/R\$\s*/i, '').replace(/\s+/g, '')
  if (!s) return 0
  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')
  if (temVirgula && temPonto) s = s.replace(/\./g, '').replace(',', '.')
  else if (temVirgula) s = s.replace(',', '.')
  else if (temPonto && /^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

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

/**
 * Meses de juros entre duas datas, pro rata die (como o CJ): meses completos desde o dia exato
 * de início + dias que sobram / 30. Ex.: 01/12/2022 → 25/06/2025 = 30 + 24/30 = 30,8.
 * Decisão da execução (24/11/2026): juros contados ao pé da letra desde a data fixada.
 */
export function mesesJuros(inicio, fim) {
  const a = parseISO(inicio), b = parseISO(fim)
  if (b <= a) return 0
  // aniversário de n meses depois do início (31/01 + 1 mês = 28 ou 29/02)
  const aniversario = (n) => new Date(a.getFullYear(), a.getMonth() + n,
    Math.min(a.getDate(), new Date(a.getFullYear(), a.getMonth() + n + 1, 0).getDate()))
  let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (aniversario(meses) > b) meses -= 1
  const marco = aniversario(meses)
  const dias = Math.round((b - marco) / 86400000)
  return Math.max(0, meses + dias / 30)
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
      pct += mesesJuros(ini, fimAntigo) * 1
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
  return mesesJuros(juros.dataInicio, termoFinal) * taxa
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
  if (verba.modo === 'conversao') return calcularConversaoEmprestimo(verba)
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
 * Revisão da RMC/RCC — Método 1 do Cálculo Jurídico ("conversão em empréstimo").
 * O cartão é recalculado como consignado comum, a partir do valor efetivamente recebido:
 *   a cada desconto: juros = saldo anterior × taxa do contrato;
 *                    amortização = desconto − juros;
 *                    saldo = saldo anterior − amortização + saques complementares do período.
 * Saldo negativo = pagamento a maior; a taxa continua correndo sobre ele, a favor do cliente
 * (como no CJ). Precisão cheia, sem arredondar por linha (o CJ faz assim). Como no CJ, o saldo
 * final não é atualizado da última parcela até o termo final.
 * Cada saque complementar entra na linha do 1º desconto do mesmo mês ou posterior (depois
 * do último desconto, entra na última linha).
 * @param verba { valorEmprestimo, taxa (% a.m.), parcelas [{data, valor}], saques [{data, valor}] }
 */
export function calcularConversaoEmprestimo(verba) {
  const taxa = (Number(verba.taxa) || 0) / 100
  const parcelas = (verba.parcelas || []).filter(p => p.data).slice().sort((a, b) => a.data.localeCompare(b.data))
  const saques = (verba.saques || []).filter(q => q.data && Number(q.valor) > 0).slice().sort((a, b) => a.data.localeCompare(b.data))
  let saldo = Number(verba.valorEmprestimo) || 0
  let iq = 0
  const linhas = parcelas.map((p, i) => {
    const valor = Number(p.valor) || 0
    const saldoAnterior = saldo
    const juros = saldoAnterior * taxa
    const amortizacao = valor - juros
    let saque = 0
    const ultima = i === parcelas.length - 1
    while (iq < saques.length && (ultima || saques[iq].data.slice(0, 7) <= p.data.slice(0, 7))) saque += Number(saques[iq++].valor)
    saldo = saldoAnterior - amortizacao + saque
    return { n: i + 1, data: p.data, valor, saldoAnterior, taxa: taxa * 100, juros, amortizacao, saque, saldo }
  })
  const soma = (k) => linhas.reduce((a, l) => a + l[k], 0)
  const aRestituir = Math.max(0, -saldo)
  return {
    metodo: 'conversao',
    linhas,
    valorEmprestimo: Number(verba.valorEmprestimo) || 0,
    taxa: taxa * 100,
    totalDescontos: soma('valor'),
    jurosContrato: soma('juros'),
    totalAmortizacao: soma('amortizacao'),
    totalSaques: soma('saque'),
    saldoFinal: saldo,
    aRestituir,                       // banco deve ao cliente
    saldoDevedor: Math.max(0, saldo), // cliente ainda deve (não abate das outras verbas)
    // campos que o resto do app soma: o que vai para a execução é só o valor a restituir
    principalCorrigido: aRestituir,
    totalJuros: 0,
    subtotal: aRestituir,
    percentualJuros: 0,
  }
}

/**
 * Consolida várias verbas + honorários de sucumbência (% sobre total corrigido).
 * @param verbas array de verbas (cada uma já com .serie/.juros)
 * @param opts { termoFinal, honorariosPercentual?, creditos? }
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
  // Honorários sobre o total já corrigido (principal + juros), ANTES da compensação —
  // é como o escritório faz no Cálculo Jurídico (base = débitos, não débitos − créditos).
  const honorarios = subtotalSemHonorarios * (honorariosPct / 100)

  const compensacao = calcularCompensacao(opts.creditos, resultados, termoFinal)
  const totalGeral = subtotalSemHonorarios + honorarios - compensacao.compensado

  // Art. 523, §1º, CPC: 10% de multa e/ou 10% de honorários se não pagar no prazo
  // voluntário (JEC: só a multa). Base = débitos − créditos, sem os honorários de
  // sucumbência (padrão do CJ). Fica FORA do totalGeral (que vai para o dashboard).
  const a523 = opts.art523 || {}
  const base523 = subtotalSemHonorarios - compensacao.compensado
  const multa523 = a523.multa ? base523 * 0.1 : 0
  const honorarios523 = a523.honorarios ? base523 * 0.1 : 0
  const art523 = { multa: !!a523.multa, honorarios: !!a523.honorarios, base: base523,
    valorMulta: multa523, valorHonorarios: honorarios523, totalComMulta: totalGeral + multa523 + honorarios523 }

  return {
    termoFinal,
    resultados,
    principal,
    juros,
    honorarios,
    honorariosPercentual: honorariosPct,
    compensacao,
    art523,
    totalGeral,
  }
}

/**
 * Compensação (o "Crédito" do Cálculo Jurídico): valores que o cliente RECEBEU do banco
 * (saque/TED do empréstimo). Cada crédito é corrigido desde a sua data e recebe os mesmos
 * juros do dano material (mesmo índice, mesma taxa, mesmo início), e o total abate
 * SOMENTE o dano material — nunca o moral. O que passar do material não é abatido.
 * @param creditos [{ data, valor, descricao? }]
 */
export function calcularCompensacao(creditos, resultados, termoFinal) {
  const vazio = { linhas: [], totalCorrigido: 0, totalJuros: 0, total: 0, compensado: 0, naoCompensado: 0, baseMaterial: 0 }
  const validos = (creditos || []).filter(c => c?.data && Number(c.valor) > 0)
  // No modo conversão o empréstimo recebido já está no cálculo: não compensa de novo.
  const material = resultados.filter(r => r.verba.tipo === 'dano_material' && r.verba.modo !== 'conversao')
  if (!validos.length || !material.length) return vazio

  const ref = material[0].verba            // critérios do material (índice, juros)
  const pctJuros = percentualJuros(ref.juros, termoFinal)
  const linhas = validos.map(c => {
    const valor = Number(c.valor)
    const fator = fatorCorrecao(ref.serie, c.data, termoFinal)
    const valorCorrigido = valor * fator
    const valorJuros = valorCorrigido * (pctJuros / 100)
    return { data: c.data, descricao: c.descricao || 'Valor recebido', valor, fator, valorCorrigido, percentualJuros: pctJuros, valorJuros, total: valorCorrigido + valorJuros }
  })
  const total = linhas.reduce((a, l) => a + l.total, 0)
  const baseMaterial = material.reduce((a, r) => a + r.resultado.subtotal, 0)
  const compensado = Math.min(total, baseMaterial)
  return {
    linhas,
    totalCorrigido: linhas.reduce((a, l) => a + l.valorCorrigido, 0),
    totalJuros: linhas.reduce((a, l) => a + l.valorJuros, 0),
    total,
    compensado,
    naoCompensado: total - compensado,
    baseMaterial,
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
