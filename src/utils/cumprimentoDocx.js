/**
 * cumprimentoDocx.js — gera a petição de Cumprimento de Sentença como .docx REAL,
 * a partir do modelo do escritório (public/modelo_cumprimento.docx), que preserva
 * o TIMBRADO NG (cabeçalho com logo/contatos/marca d'água) e a formatação original
 * (Cambria 12, recuos, tabela de débitos).
 *
 * O modelo contém tokens ((ASSIM)) no word/document.xml; aqui só substituímos os
 * tokens e devolvemos o arquivo — Word abre como se tivesse sido feito no modelo.
 */
import { fmtBRL, fmtData } from './calcularJuridico.js'
import { valorExtenso } from './cumprimento.js'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const escXml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function dataExtensa(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

/** Monta o mapa token → valor a partir do cálculo consolidado (proc) + metadados. */
export function variaveisCumprimento(meta = {}, proc) {
  const moral = proc.resultados.filter(r => r.verba.tipo === 'dano_moral')
  const material = proc.resultados.filter(r => r.verba.tipo === 'dano_material')

  // Valor original (como lançado): nas linhas o "em dobro" já duplica — para o
  // MORAL_ORIG queremos o valor fixado; para MATERIAL_ORIG o valor da inicial (em dobro).
  const sum = (arr, f) => arr.reduce((a, r) => a + f(r), 0)
  const moralOrig = sum(moral, r => r.resultado.linhas.filter(l => l.tipoLinha === 'Principal').reduce((a, l) => a + l.valor, 0))
  const moralAtu = sum(moral, r => r.resultado.subtotal)
  const materialOrig = sum(material, r => r.resultado.linhas.reduce((a, l) => a + l.valor, 0)) // inclui dobro (valor da inicial)
  const materialAtu = sum(material, r => r.resultado.subtotal)

  const honorarios = proc.honorarios || 0
  const honPct = proc.honorariosPercentual || 0
  const total = proc.totalGeral

  return {
    VARA: (meta.vara || '____ VARA DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE MANAUS/AM').toUpperCase(),
    PROCESSO: meta.processo || '____________',
    CLIENTE: (meta.cliente || '____________').toUpperCase(),
    MORAL_ORIG: moral.length ? fmtBRL(moralOrig) : '—',
    MORAL_ATU: moral.length ? fmtBRL(moralAtu) : '—',
    MATERIAL_ORIG: material.length ? fmtBRL(materialOrig) : '—',
    MATERIAL_ATU: material.length ? fmtBRL(materialAtu) : '—',
    HONORARIOS: honorarios > 0 ? fmtBRL(honorarios) : 'Não arbitrados',
    HON_PCT: honPct > 0 ? `${String(honPct).replace('.', ',')}%` : '—',
    TOTAL_EXT: `${fmtBRL(total)} (${valorExtenso(total)})`,
    DATA_EXT: dataExtensa(),
  }
}

/** Baixa a petição .docx com timbrado, preenchida com os valores do cálculo. */
export async function baixarCumprimentoDocx(meta = {}, proc, filename) {
  const resp = await fetch('/modelo_cumprimento.docx')
  if (!resp.ok) throw new Error('Modelo do escritório não encontrado (modelo_cumprimento.docx).')
  const buf = await resp.arrayBuffer()

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buf)
  let xml = await zip.file('word/document.xml').async('string')

  const vars = variaveisCumprimento(meta, proc)
  for (const [k, v] of Object.entries(vars)) {
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
