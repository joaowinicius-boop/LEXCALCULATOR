// ─── Taxas mensais aproximadas (2026) ─────────────────────────────────────────
// Nota: em produção, buscar da API do Banco Central (SGS/SIDRA)
export const TAXAS = {
  SELIC: 0.010733, // ~13.75% a.a. → (1.1375)^(1/12) - 1
  IPCA:  0.003936, // ~4.83%  a.a. → (1.0483)^(1/12) - 1
  INPC:  0.004124, // ~5.02%  a.a. → (1.0502)^(1/12) - 1
}
const JUROS_MORA = 0.01 // 1% ao mês (art. 406 CC / art. 52, §1º CDC)

export function mesesEntre(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0
  const d1 = new Date(dataInicio + 'T00:00:00')
  const d2 = new Date(dataFim   + 'T00:00:00')
  const anos  = d2.getFullYear() - d1.getFullYear()
  const meses = d2.getMonth()    - d1.getMonth()
  const dias  = d2.getDate()     - d1.getDate()
  const total = anos * 12 + meses + (dias / 30)
  return Math.max(0, total)
}

export function calcularVerba(verba, dataTermino) {
  const hoje = dataTermino || new Date().toISOString().split('T')[0]
  const valorBase = parseFloat(verba.valorOriginal) || 0
  if (!valorBase) return null

  // Termo inicial da correção monetária
  let dataCorrecao = verba.dataPersonalizada || hoje
  if (verba.termoInicial === 'decisao')      dataCorrecao = verba.dataDecisao      || hoje
  else if (verba.termoInicial === 'citacao') dataCorrecao = verba.dataCitacao      || hoje
  else if (verba.termoInicial === 'ajuizamento') dataCorrecao = verba.dataAjuizamento || hoje

  const mesesCorrecao = mesesEntre(dataCorrecao, hoje)
  const taxa           = TAXAS[verba.indice] ?? 0
  const fatorCorrecao  = Math.pow(1 + taxa, mesesCorrecao)

  // Juros de mora
  let fatorJuros = 1
  let mesesJuros = 0
  if (verba.incluirJuros && verba.dataCitacao) {
    mesesJuros  = mesesEntre(verba.dataCitacao, hoje)
    fatorJuros  = 1 + JUROS_MORA * mesesJuros // juros simples
  }

  let valorCorrigido = valorBase * fatorCorrecao
  let valorJuros     = valorCorrigido * (fatorJuros - 1)
  let valorAtualizado = valorCorrigido + valorJuros

  if (verba.emDobro) valorAtualizado *= 2

  return {
    valorOriginal:  valorBase,
    valorCorrecao:  valorCorrigido - valorBase,
    valorJuros,
    valorAtualizado,
    mesesCorrecao:  Math.round(mesesCorrecao),
    mesesJuros:     Math.round(mesesJuros),
    fatorCorrecao:  ((fatorCorrecao - 1) * 100).toFixed(2),
    emDobro:        verba.emDobro,
  }
}

export function calcularTotal(verbas, dataTermino) {
  return verbas.reduce((acc, v) => {
    const res = calcularVerba(v, dataTermino)
    return acc + (res?.valorAtualizado ?? 0)
  }, 0)
}

export const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export const fmtDate = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export const TIPO_VERBA = {
  dano_moral:    'Dano Moral',
  dano_material: 'Dano Material',
  honorarios:    'Honorários Sucumbenciais',
  outro:         'Outra Verba',
}

export const INDICE_LABEL = {
  SELIC: 'SELIC',
  IPCA:  'IPCA-E',
  INPC:  'INPC',
}

export const TERMO_LABEL = {
  decisao:        'Data da Decisão',
  citacao:        'Data da Citação',
  ajuizamento:    'Data do Ajuizamento',
  personalizado:  'Data Personalizada',
}
