/**
 * cumprimento.js — gera a petição de Cumprimento de Sentença (modelo Nicolas Gomes),
 * consolidando os valores já calculados (proc) em HTML pronto para Word/impressão.
 */
import { fmtBRL, fmtData } from './calcularJuridico.js'

const ESCRITORIO = {
  advogado: 'NICOLAS SANTOS CARVALHO GOMES',
  oab: 'OAB/AM 8.926',
  sociedade: 'NICOLAS GOMES SOCIEDADE INDIVIDUAL DE ADVOCACIA (OAB/AM 796/2022)',
  banco: 'SICREDI (748)', agencia: '0802', conta: '79472-8', cnpj: '46.533.658/0001-60',
}
const TIPO_LABEL = {
  dano_moral: 'DANOS MORAIS', dano_material: 'DANOS MATERIAIS',
  honorarios: 'HONORÁRIOS SUCUMBENCIAIS', outro: 'OUTRA VERBA',
}
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

// ─── Valor por extenso (R$) ────────────────────────────────────────────────────
export function valorExtenso(valor) {
  const v = Math.round((Number(valor) || 0) * 100)
  const reais = Math.floor(v / 100), centavos = v % 100
  const u = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dez = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const cem = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
  const ate999 = (n) => {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    let s = ''
    const c = Math.floor(n / 100), r = n % 100
    if (c) s += cem[c]
    if (r) {
      if (s) s += ' e '
      if (r < 20) s += u[r]
      else { s += dez[Math.floor(r / 10)]; if (r % 10) s += ' e ' + u[r % 10] }
    }
    return s
  }
  const inteiro = (n) => {
    if (n === 0) return 'zero'
    const mi = Math.floor(n / 1000000), mil = Math.floor((n % 1000000) / 1000), r = n % 1000
    const partes = []
    if (mi) partes.push(ate999(mi) + (mi === 1 ? ' milhão' : ' milhões'))
    if (mil) partes.push(mil === 1 ? 'mil' : ate999(mil) + ' mil')
    if (r) partes.push(ate999(r))
    if (partes.length <= 1) return partes.join('')
    const ult = (r && (r < 100 || r % 100 === 0)) // regra do "e" antes do último grupo
    return partes.slice(0, -1).join(', ') + (ult ? ' e ' : ' ') + partes[partes.length - 1]
  }
  let txt = `${inteiro(reais)} ${reais === 1 ? 'real' : 'reais'}`
  if (centavos) txt += ` e ${inteiro(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`
  return txt
}

// ─── Petição ────────────────────────────────────────────────────────────────────
export function gerarCumprimentoHtml(meta = {}, proc, opts = {}) {
  const esc_ = ESCRITORIO
  const moral = proc.resultados.filter(r => r.verba.tipo === 'dano_moral')
  const material = proc.resultados.filter(r => r.verba.tipo === 'dano_material')
  const tipoDoc = (meta.tipoDocumento === 'acordao') ? 'acórdão' : 'sentença'

  const sumSub = (arr) => arr.reduce((a, r) => a + r.resultado.subtotal, 0)
  const sumPrincipalOriginal = (arr) => arr.reduce((a, r) =>
    a + (r.verba.parcelas?.reduce?.((x, p) => x + (parseFloat(String(p.valor).replace(',', '.')) || 0), 0)
      ?? r.resultado.linhas.reduce((x, l) => x + (l.tipoLinha === 'Principal' ? l.valor : 0), 0)), 0)

  const linhasPlanilha = proc.resultados.map(r => `
    <tr>
      <td class="b">${esc(TIPO_LABEL[r.verba.tipo] || 'VERBA')}${r.verba.descricao ? ' — ' + esc(r.verba.descricao) : ''}</td>
      <td class="right mono">${fmtBRL(r.resultado.subtotal)}</td>
    </tr>`).join('')

  const honorarios = proc.honorarios || 0
  const total = proc.totalGeral
  const dataExt = (() => { const d = new Date(); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` })()
  const comarca = meta.vara || 'Comarca de Manaus/AM'
  const cidade = (opts.cidade || 'Manaus')

  const descMaterial = material.length
    ? `Conforme ${tipoDoc}, a parte Executada foi condenada a <b>ressarcir em dobro</b>, a título de danos materiais, os valores indevidamente descontados da parte Exequente, devidamente atualizados.`
    : ''
  const descMoral = moral.length
    ? `${material.length ? 'Quanto aos' : 'Conforme ' + tipoDoc + ', no que tange aos'} danos morais, estes foram fixados e atualizados conforme planilha anexa.`
    : ''
  const descHon = honorarios > 0
    ? `Os honorários advocatícios sucumbenciais foram arbitrados em ${(proc.honorariosPercentual || 0).toLocaleString('pt-BR')}% sobre o valor da condenação, ora atualizados.`
    : 'Os honorários advocatícios sucumbenciais não foram arbitrados.'

  return `
  <div class="center b" style="font-size:12pt">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ${esc(comarca).toUpperCase()}</div>
  <p>&nbsp;</p>
  <p><b>Processo nº ${esc(meta.processo || '____________')}</b></p>
  <p>&nbsp;</p>
  <p style="text-indent:2cm"><b>${esc(meta.cliente || '____________')}</b>, já qualificado(a) nos autos do processo em epígrafe, por intermédio de seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, considerando o trânsito em julgado, requerer o <b>CUMPRIMENTO DE SENTENÇA</b>, nos termos do art. 523 do CPC, em desfavor de <b>${esc(meta.executada || '____________')}</b>, pelos fundamentos a seguir.</p>

  <p class="b">I. DOS CÁLCULOS DA EXECUÇÃO</p>
  <p style="text-indent:2cm">${descMaterial} ${descMoral} ${descHon}</p>
  <p style="text-indent:2cm">Assim, apresenta-se a planilha de débitos, atualizada até ${fmtData(proc.termoFinal)}, calculada com índices oficiais (IBGE/Banco Central):</p>

  <table>
    <thead><tr><th>VERBA</th><th class="right">VALOR ATUALIZADO</th></tr></thead>
    <tbody>
      ${linhasPlanilha}
      ${honorarios > 0 ? `<tr><td class="b">HONORÁRIOS DE SUCUMBÊNCIA (${(proc.honorariosPercentual || 0).toLocaleString('pt-BR')}%)</td><td class="right mono">${fmtBRL(honorarios)}</td></tr>` : ''}
      <tr><td class="b">TOTAL ATUALIZADO</td><td class="right b mono">${fmtBRL(total)}</td></tr>
    </tbody>
  </table>
  <p style="text-indent:2cm">Total da execução: <b>${fmtBRL(total)}</b> (${valorExtenso(total)}).</p>

  <p style="text-indent:2cm">Ante o exposto, requer-se a intimação da parte Executada para, no prazo de 15 (quinze) dias úteis, efetuar e <b>COMPROVAR o pagamento voluntário</b> da quantia de <b>${fmtBRL(total)}</b> (${valorExtenso(total)}), sob pena de incidência da multa de 10% e dos honorários advocatícios de 10%, nos termos do art. 523, §1º, do CPC, além de penhora de bens.</p>

  <p style="text-indent:2cm">Para fins de pagamento voluntário, seguem os dados bancários do escritório:</p>
  <p>Favorecido: <b>${esc_.sociedade}</b><br>
  Advogado: ${esc_.advogado} — ${esc_.oab}<br>
  Banco: ${esc_.banco} · Agência: ${esc_.agencia} · Conta Corrente: ${esc_.conta}<br>
  CNPJ: ${esc_.cnpj}</p>

  <p style="text-indent:2cm">Caso não ocorra o pagamento voluntário, pugna-se, desde já, pelo prosseguimento do <b>cumprimento forçado</b> da obrigação, com o acréscimo das penalidades previstas no art. 523, §1º e §3º, do CPC, devendo o competente alvará ser expedido em favor do patrono do Autor.</p>

  <p class="b">II. DOS REQUERIMENTOS</p>
  <p style="text-indent:2cm">Requer, portanto: (a) a intimação da parte Executada para pagamento voluntário no valor de <b>${fmtBRL(total)}</b> (${valorExtenso(total)}), conforme cálculo anexo; (b) não havendo pagamento, a aplicação da multa e honorários do art. 523, §1º, do CPC, e o início dos atos de constrição patrimonial.</p>

  <p>Nestes termos,<br>Pede deferimento.</p>
  <p>${esc(cidade)}, ${dataExt}.</p>
  <p>&nbsp;</p>
  <p class="center">________________________________________<br><b>${esc_.advogado}</b><br>${esc_.oab}</p>
  `
}
