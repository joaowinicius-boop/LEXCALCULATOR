/**
 * textosRelatorio.js — textos fixos do relatório (espelhando o "Cálculo Jurídico").
 * Mantidos como dados para o relatório replicar a seção "Detalhes do Cálculo"
 * e as listas de "Opções do Cálculo".
 */

export const LABEL_JUROS = {
  fixo_1: 'Fixos de 1% ao mês',
  taxa_legal: 'Taxa legal',
  selic: 'SELIC',
  nenhum: 'Não aplicado',
}

// Linhas de "Opções do Cálculo" — Correção monetária (padrão, como no CJ)
export const OPCOES_CORRECAO = [
  ['Aplicar apenas variações positivas do índice de correção monetária', 'Não'],
  ['Usar capitalização simples na atualização monetária', 'Não'],
  ['Manter valor nominal em caso de inflação negativa', 'Não'],
]

// Linhas de Multa (padrão)
export const OPCOES_MULTA = [
  ['Percentual da Multa (%)', '0,00%'],
  ['Aplicar a multa sobre os juros de mora', 'Não'],
  ['Aplicar a multa sobre os juros compensatórios/remuneratórios', 'Não'],
  ['Aplicar a multa nos créditos?', 'Não'],
]

// Multa do Art. 523 do CPC (padrão)
export const OPCOES_ART523 = [
  ['Aplicar multa moratória de 10%', 'Não'],
  ['Aplicar multa de honorários advocatícios de 10%', 'Não'],
  ['Incluir juros de mora no cálculo da multa do Art. 523', 'Não'],
  ['Incluir custas no cálculo da multa do Art. 523', 'Não'],
  ['Incluir honorários sucumbenciais na base da multa do Art. 523', 'Não'],
  ['Incluir Multa no cálculo da multa do Art. 523', 'Não'],
  ['Incluir juros compensatórios no cálculo da multa do Art. 523', 'Não'],
]

// Seção "Detalhes do Cálculo" — textos explicativos (fiel ao CJ)
export const DETALHES_CALCULO = [
  {
    titulo: 'Valor Total Geral',
    paragrafos: [
      'O valor total geral é: Principal + Juros de Mora + Juros Compensatórios/Remuneratórios + Custas + Despesas + Multa + Honorários + Multas do art. 523, já com suas respectivas deduções (débitos − créditos).',
    ],
  },
  {
    titulo: 'Principal',
    paragrafos: [
      'Sobre os valores classificados como “Principal”, tanto nos débitos como nos créditos, incide correção monetária.',
      'O valor exibido no relatório como “Principal” representa a subtração dos débitos principais com os créditos principais, ambos corrigidos monetariamente.',
    ],
  },
  {
    titulo: 'Juros de Mora',
    paragrafos: [
      'Os juros de mora são os juros devidos em caso de atraso no pagamento da obrigação. Podem ser calculados de duas formas: simples (mensal) ou capitalizada (mensal).',
      'Momento da incidência: os juros de mora incidem a partir da data do vencimento da obrigação ou de outra data fixa, até a data da atualização do cálculo (termo final), conforme determinado na sentença ou acórdão.',
      'Base de cálculo: incide sobre o débito principal corrigido. É possível ainda incluir na base de cálculo os juros compensatórios/remuneratórios.',
    ],
  },
  {
    titulo: 'Juros Compensatórios/Remuneratórios',
    paragrafos: [
      'Os juros compensatórios (ou remuneratórios) são os que compensam financeiramente aquele que emprestou determinada quantia a alguém. Podem ser calculados de forma simples (mensal) ou capitalizada (mensal).',
      'Momento da incidência: incidem a partir da data do vencimento da obrigação ou de outra data fixa, até a data da atualização do cálculo (termo final), conforme determinado na sentença ou acórdão.',
      'Base de cálculo: incide sobre o débito principal corrigido.',
    ],
  },
  {
    titulo: 'Custas',
    paragrafos: [
      'São todos os gastos que as partes têm que realizar no decorrer do processo, desde o início até a sentença final, exceto se a parte for beneficiária da justiça gratuita.',
      'Sobre as custas incide a correção monetária, sem juros de mora.',
    ],
  },
  {
    titulo: 'Despesas',
    paragrafos: [
      'São os gastos operacionais para o desenvolvimento do processo (indenização de viagens, diárias de testemunhas, remuneração de peritos e assistentes técnicos — art. 84, CPC/2015).',
      'Sobre as despesas incide a correção monetária, sem juros de mora.',
    ],
  },
  {
    titulo: 'Multa',
    paragrafos: [
      'A expressão “multa” é usada em sentido amplo, para abranger tanto a multa por atraso no pagamento quanto qualquer outra multa processual que tenha a mesma base de cálculo (por exemplo, multa por descumprimento de cláusula penal).',
      'Base de cálculo: incide sobre o débito principal corrigido. É possível ainda incluir na base de cálculo juros de mora e/ou juros compensatórios/remuneratórios.',
    ],
  },
  {
    titulo: 'Honorários de Sucumbência',
    paragrafos: [
      'São os honorários pagos pela parte que perdeu a ação (sucumbente) ao advogado da parte vencedora. Podem ser calculados de três formas: sobre o valor total dos débitos já corrigidos; sobre a diferença dos totais de débitos e créditos; ou sobre uma quantia fixa informada como base de cálculo.',
      'Além disso, é possível incluir na base de cálculo dos honorários: juros de mora, juros compensatórios, multa e multa moratória do art. 523 do CPC.',
    ],
  },
  {
    titulo: 'Multa do art. 523 do CPC',
    paragrafos: [
      'O art. 523 do CPC/15 dispõe que, caso o devedor condenado ao pagamento de quantia certa (ou já fixada em liquidação) seja intimado e não efetue o pagamento no prazo de 15 dias, o montante da condenação será acrescido de multa de 10% + honorários de sucumbência de 10%.',
      'A base de cálculo da multa do art. 523 (multa moratória de 10% + honorários de 10%) é a mesma: em regra, ambos incidem sobre o débito principal, acrescido, se houver, das custas processuais.',
    ],
  },
]
