/**
 * cumprimentoDocx.js — gera a petição de Cumprimento de Sentença como .docx REAL,
 * a partir do modelo do escritório (public/modelo_cumprimento.docx), que preserva
 * o TIMBRADO NG (cabeçalho com logo/contatos/marca d'água) e a formatação original
 * (Cambria 12, recuos, tabela de débitos).
 *
 * O modelo contém tokens ((ASSIM)) no word/document.xml. Aqui:
 *  1. removemos linhas da tabela / parágrafos de verbas que NÃO existem no caso
 *     (ex.: Juizado sem honorários — arts. 54/55 da Lei 9.099/95);
 *  2. substituímos os tokens pelos valores do cálculo;
 *  3. devolvemos o arquivo — Word abre como se tivesse sido feito no modelo.
 */
import { fmtBRL } from './calcularJuridico.js'
import { valorExtenso } from './cumprimento.js'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const escXml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function dataExtensa(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

/**
 * Remove o elemento <tag>…</tag> que contém o marcador (linha de tabela / parágrafo).
 * Casa apenas "<tag>" ou "<tag " — NUNCA prefixos como <w:trPr>/<w:pPr>, que
 * compartilham o início e corromperiam o documento.
 */
function cortarElemento(xml, marcador, tag) {
  const i = xml.indexOf(marcador)
  if (i < 0) return xml
  const ini = Math.max(xml.lastIndexOf(`<${tag}>`, i), xml.lastIndexOf(`<${tag} `, i))
  const fim = xml.indexOf(`</${tag}>`, i)
  if (ini < 0 || fim < 0) return xml
  return xml.slice(0, ini) + xml.slice(fim + tag.length + 3)
}

/** Monta tokens + lista de remoções a partir do cálculo consolidado (proc) + metadados. */
export function variaveisCumprimento(meta = {}, proc) {
  const moral = proc.resultados.filter(r => r.verba.tipo === 'dano_moral')
  const material = proc.resultados.filter(r => r.verba.tipo === 'dano_material')
  const temDobro = material.some(r => r.verba.emDobro)
  const tipoDoc = meta.tipoDocumento === 'acordao' ? 'acórdão' : 'sentença'

  const sum = (arr, f) => arr.reduce((a, r) => a + f(r), 0)
  const moralOrig = sum(moral, r => r.resultado.linhas.filter(l => l.tipoLinha === 'Principal').reduce((a, l) => a + l.valor, 0))
  const moralAtu = sum(moral, r => r.resultado.subtotal)
  const materialOrig = sum(material, r => r.resultado.linhas.reduce((a, l) => a + l.valor, 0)) // inclui dobro (valor da inicial)
  const materialAtu = sum(material, r => r.resultado.subtotal)

  const honorarios = proc.honorarios || 0
  const honPct = proc.honorariosPercentual || 0
  const total = proc.totalGeral

  const fraseMoral = moral.length
    ? `Conforme ${tipoDoc}, a parte Executada foi condenada a indenizar a parte Exequente em danos morais, no valor de ${fmtBRL(moralOrig)}.`
    : ''
  const fraseMaterial = material.length
    ? (temDobro
        ? `${moral.length ? 'Já no' : `Conforme ${tipoDoc}, no`} que diz respeito aos danos materiais, fora determinada a devolução em dobro dos descontos realizados em desfavor da parte Exequente, que perfazem ${fmtBRL(materialOrig)}.`
        : `${moral.length ? 'Já no' : `Conforme ${tipoDoc}, no`} que diz respeito aos danos materiais, fora determinada a devolução dos descontos realizados em desfavor da parte Exequente, que perfazem ${fmtBRL(materialOrig)}.`)
    : ''
  const fraseHonorarios = honorarios > 0
    ? `Os honorários advocatícios foram arbitrados ao percentual de ${String(honPct).replace('.', ',')}% sobre o valor da condenação.`
    : 'Não há honorários advocatícios sucumbenciais a executar (arts. 54 e 55 da Lei nº 9.099/95).'

  return {
    tokens: {
      VARA: (meta.vara || '____ VARA DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE MANAUS/AM').toUpperCase(),
      PROCESSO: meta.processo || '____________',
      CLIENTE: (meta.cliente || '____________').toUpperCase(),
      FRASE_MORAL: fraseMoral,
      FRASE_MATERIAL: fraseMaterial,
      FRASE_HONORARIOS: fraseHonorarios,
      MORAL_ORIG: fmtBRL(moralOrig),
      MORAL_ATU: fmtBRL(moralAtu),
      MATERIAL_ORIG: fmtBRL(materialOrig),
      MATERIAL_ATU: fmtBRL(materialAtu),
      HONORARIOS: fmtBRL(honorarios),
      HON_PCT: honPct > 0 ? `${String(honPct).replace('.', ',')}%` : '—',
      TOTAL_EXT: `${fmtBRL(total)} (${valorExtenso(total)})`,
      DATA_EXT: dataExtensa(),
    },
    temMoral: moral.length > 0,
    temMaterial: material.length > 0,
    temHonorarios: honorarios > 0,
  }
}

/** Baixa a petição .docx com timbrado, preenchida com os valores do cálculo. */
export async function baixarCumprimentoDocx(meta = {}, proc, filename) {
  const resp = await fetch('/modelo_cumprimento.docx', { cache: 'no-cache' })
  if (!resp.ok) throw new Error('Modelo do escritório não encontrado (modelo_cumprimento.docx).')
  const buf = await resp.arrayBuffer()

  // Assinatura ZIP ("PK") — evita aceitar o index.html do SPA fallback como modelo
  const sig = new Uint8Array(buf.slice(0, 2))
  if (sig[0] !== 0x50 || sig[1] !== 0x4b) throw new Error('Resposta não é um .docx válido (deploy em andamento?). Recarregue a página.')

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buf)
  let xml = await zip.file('word/document.xml').async('string')

  const { tokens, temMoral, temMaterial, temHonorarios } = variaveisCumprimento(meta, proc)

  // 1) Remoções estruturais (antes da substituição, usando os marcadores do template)
  if (!temMoral) {
    xml = cortarElemento(xml, 'DANO MORAL (principal)', 'w:tr')
    xml = cortarElemento(xml, '((MORAL_ORIG))', 'w:tr')
    xml = cortarElemento(xml, '((FRASE_MORAL))', 'w:p')
  }
  if (!temMaterial) {
    xml = cortarElemento(xml, 'DANO MATERIAL INICIAL', 'w:tr')
    xml = cortarElemento(xml, '((MATERIAL_ORIG))', 'w:tr')
    xml = cortarElemento(xml, '((FRASE_MATERIAL))', 'w:p')
  }
  if (!temHonorarios) {
    xml = cortarElemento(xml, 'HONORÁRIOS DE SUCUMBÊNCIA', 'w:tr')
    xml = cortarElemento(xml, '((HONORARIOS))', 'w:tr')
    // a frase fica: explica que não há honorários (arts. 54/55, Lei 9.099/95)
  }

  // 2) Tokens → valores
  for (const [k, v] of Object.entries(tokens)) {
    xml = xml.split(`((${k}))`).join(escXml(v))
  }
  zip.file('word/document.xml', xml)

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  })
  const nome = filename || `Cumprimento_de_Sentenca_${(meta.processo || '').replace(/[^\d]/g, '') || 's-n'}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nome}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
