/**
 * extrair.js — Motor de extração de parâmetros do dispositivo da sentença/acórdão
 *
 * FASE 1: Extração via regex (padrões TJAM calibrados nos casos reais)
 * FASE 2: Substituir `extrairDoDispositivo` por chamada à Edge Function Claude API
 *         O contrato de retorno é IDÊNTICO nas duas fases — o resto do sistema não muda.
 *
 * Contrato de retorno:
 * {
 *   verbas: [{
 *     tipo: 'dano_moral' | 'dano_material' | 'honorarios' | 'outro',
 *     valorOriginal: string (float como string, ex: "4000.00"),
 *     emDobro: boolean,
 *     indice: 'SELIC' | 'IPCA' | 'INPC',
 *     termoInicial: 'decisao' | 'ajuizamento' | 'citacao' | 'personalizado',
 *     incluirJuros: boolean,
 *     // metadados de diagnóstico (não afetam cálculo)
 *     _emDobroNaSentenca: boolean,  // em dobro já aplicado na sentença
 *     _ipcaSelic: boolean,          // padrão IPCA→SELIC após citação (TJAM)
 *     _extraido: true,
 *   }],
 *   confianca: 'alta' | 'media' | 'baixa' | 'nenhuma',
 *   avisos: string[],
 * }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const R$ = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi

function parseValorBR(s) {
  return parseFloat(s.trim().replace(/\./g, '').replace(',', '.'))
}

function formatFloat(n) {
  return n.toFixed(2)
}

function detectarIndice(ctx) {
  const c = ctx.toLowerCase()
  // IPCA → SELIC (padrão TJAM dano material): detecta os dois, retorna IPCA como primário
  if (/\bipca\b/.test(c) && /\bselic\b/.test(c)) return 'IPCA'
  if (/\bipca/.test(c)) return 'IPCA'
  if (/\bselic\b/.test(c)) return 'SELIC'
  if (/\binpc\b/.test(c)) return 'INPC'
  return 'SELIC' // padrão TJAM
}

function detectarTermo(ctx) {
  const c = ctx.toLowerCase()
  if (/a\s+partir\s+do\s+ajuizamento|desde\s+o\s+ajuizamento|data\s+do\s+ajuizamento|propositura\s+da\s+demanda/.test(c)) return 'ajuizamento'
  if (/a\s+partir\s+da\s+cita[çc][aã]o|desde\s+a\s+cita[çc][aã]o|ap[oó]s\s+a\s+cita[çc][aã]o|data\s+da\s+cita[çc][aã]o/.test(c)) return 'citacao'
  if (/data\s+da\s+libera[çc][aã]o|data\s+da\s+senten[çc]a|data\s+do\s+arbitramento|prol[ae][çc][aã]o|a\s+contar\s+da\s+senten[çc]a/.test(c)) return 'decisao'
  if (/evento\s+danoso|primeiro\s+desconto|primeira\s+cobran[çc]a/.test(c)) return 'personalizado'
  return 'decisao'
}

function isIpcaSelic(ctx) {
  const c = ctx.toLowerCase()
  return /\bipca\b.{1,150}\bselic\b/.test(c) || /ap[oó]s.{1,40}cita[çc][aã]o.{1,60}selic/i.test(c)
}

function extrairPrimeiroValor(texto) {
  R$.lastIndex = 0
  const m = R$.exec(texto)
  return m ? m[1] : null
}

function todosValores(texto) {
  const vals = []
  R$.lastIndex = 0
  let m
  while ((m = R$.exec(texto)) !== null) vals.push(m[1])
  return vals
}

// ─── Análise de cláusula ──────────────────────────────────────────────────────

function analisarClausula(clause) {
  const c = clause.toLowerCase()

  // Detectar tipo
  const eDanoMoral =
    /danos?\s*morais?/.test(c) ||
    /indeniza[çc][aã]o\s+por\s+dano\s+moral/.test(c) ||
    /dano\s+moral\s+in\s+re\s+ipsa/.test(c)

  const eDanoMaterial =
    /danos?\s*materiais?/.test(c) ||
    /em\s+dobro/.test(c) ||
    /repeti[çc][aã]o\s+do\s+ind[eé]bito/.test(c) ||
    /restituir.{0,60}indevid/.test(c) ||
    /devolu[çc][aã]o.{0,40}descontos/.test(c) ||
    /valores\s+indevidamente\s+descontados/.test(c)

  const eHonorarios =
    /honor[áa]rios\s+(?:advocat[íi]cios|sucumbenciais)/.test(c) ||
    /honor[áa]rios\s+de\s+advogado/.test(c)

  const emDobroNaSentenca = /em\s+dobro|repeti[çc][aã]o\s+do\s+ind[eé]bito/.test(c)

  let tipo = null
  if (eDanoMoral) tipo = 'dano_moral'
  else if (eDanoMaterial) tipo = 'dano_material'
  else if (eHonorarios) tipo = 'honorarios'

  if (!tipo) return null

  // Valor: pegar o PRIMEIRO R$ mencionado na cláusula
  const valorStr = extrairPrimeiroValor(clause)
  if (!valorStr) return null

  const valor = parseValorBR(valorStr)
  if (!valor || valor <= 0) return null

  const indice = detectarIndice(clause)
  let termo = detectarTermo(clause)

  // Heurística: dano material no padrão TJAM quase sempre começa no ajuizamento
  if (tipo === 'dano_material' && termo === 'decisao') {
    termo = 'ajuizamento'
  }

  return {
    tipo,
    valorOriginal: formatFloat(valor),
    emDobro: false, // o valor condenado já incorpora o dobro quando houver
    indice,
    termoInicial: termo,
    incluirJuros: tipo !== 'honorarios',
    _emDobroNaSentenca: emDobroNaSentenca,
    _ipcaSelic: isIpcaSelic(clause),
    _extraido: true,
  }
}

// ─── Função principal (Fase 1 — regex) ───────────────────────────────────────
// Para Fase 2: substitua o corpo desta função por uma chamada à Edge Function
// que chama Claude API com structured output. O contrato de retorno é o mesmo.

export function extrairDoDispositivo(texto) {
  if (!texto?.trim()) return { verbas: [], confianca: 'nenhuma', avisos: [] }

  // Normalizar
  const t = texto.replace(/\r\n|\r/g, ' ').replace(/\s+/g, ' ').trim()

  const verbas = []
  const avisos = []
  const tiposEncontrados = new Set()
  const valoresUsados = new Set()

  // ── Estratégia 1: dividir por CONDENAR (padrão mais comum no TJAM) ────────
  // "CONDENAR a parte requerida a pagar R$4.000,00 ... danos morais"
  const partes = t.split(/(?=\bCONDENAR\b)/gi).filter(p => p.trim().length > 20)

  if (partes.length > 1) {
    for (const parte of partes) {
      const resultado = analisarClausula(parte)
      if (!resultado) continue
      if (tiposEncontrados.has(resultado.tipo)) continue
      if (valoresUsados.has(resultado.valorOriginal)) continue
      tiposEncontrados.add(resultado.tipo)
      valoresUsados.add(resultado.valorOriginal)
      verbas.push(resultado)
    }
  }

  // ── Estratégia 2: busca por padrões específicos no texto completo ──────────
  // Útil quando não há "CONDENAR" explícito (acórdãos, redação diferente)

  if (!tiposEncontrados.has('dano_moral')) {
    // "R$ X,XX a título de danos morais" ou "danos morais... R$ X,XX"
    const patterns = [
      /R\$\s*[\d.,]+[^.!;]{0,100}(?:danos?\s*morais?|indeniza[çc][aã]o\s+(?:por|a\s+t[íi]tulo\s+de)\s+dano\s+moral)/gi,
      /(?:danos?\s*morais?|indeniza[çc][aã]o\s+moral)[^.!;]{0,100}R\$\s*[\d.,]+/gi,
    ]
    for (const p of patterns) {
      const matches = [...t.matchAll(p)]
      if (!matches.length) continue
      const m = matches[0]
      const valorStr = extrairPrimeiroValor(m[0])
      if (!valorStr || valoresUsados.has(valorStr)) continue
      const valor = parseValorBR(valorStr)
      if (!valor) continue
      // Janela de contexto em torno do match para detectar índice/termo
      const pos = m.index
      const ctx = t.substring(Math.max(0, pos - 30), Math.min(t.length, pos + 350))
      valoresUsados.add(valorStr)
      tiposEncontrados.add('dano_moral')
      verbas.push({
        tipo: 'dano_moral',
        valorOriginal: formatFloat(valor),
        emDobro: false,
        indice: detectarIndice(ctx),
        termoInicial: detectarTermo(ctx),
        incluirJuros: true,
        _emDobroNaSentenca: false,
        _ipcaSelic: isIpcaSelic(ctx),
        _extraido: true,
      })
      break
    }
  }

  if (!tiposEncontrados.has('dano_material')) {
    const patterns = [
      // "restituir em dobro... R$X"
      /(?:restituir|devolver|devolu[çc][aã]o)[^.!;]{0,60}dobro[^.!;]{0,150}R\$\s*[\d.,]+/gi,
      // "R$X... em dobro"
      /R\$\s*[\d.,]+[^.!;]{0,80}em\s+dobro/gi,
      // "repetição do indébito... R$X"
      /repeti[çc][aã]o\s+do\s+ind[eé]bito[^.!;]{0,150}R\$\s*[\d.,]+/gi,
      // "danos materiais... R$X"
      /danos?\s*materiais?[^.!;]{0,120}R\$\s*[\d.,]+/gi,
    ]
    for (const p of patterns) {
      const matches = [...t.matchAll(p)]
      if (!matches.length) continue
      const m = matches[0]
      const valorStr = extrairPrimeiroValor(m[0])
      if (!valorStr || valoresUsados.has(valorStr)) continue
      const valor = parseValorBR(valorStr)
      if (!valor) continue
      const pos = m.index
      const ctx = t.substring(Math.max(0, pos - 30), Math.min(t.length, pos + 350))
      valoresUsados.add(valorStr)
      tiposEncontrados.add('dano_material')
      verbas.push({
        tipo: 'dano_material',
        valorOriginal: formatFloat(valor),
        emDobro: false,
        indice: detectarIndice(ctx),
        termoInicial: detectarTermo(ctx) === 'decisao' ? 'ajuizamento' : detectarTermo(ctx),
        incluirJuros: true,
        _emDobroNaSentenca: /em\s+dobro|ind[eé]bito/i.test(m[0]),
        _ipcaSelic: isIpcaSelic(ctx),
        _extraido: true,
      })
      break
    }
  }

  if (!tiposEncontrados.has('honorarios')) {
    const patterns = [
      /honor[áa]rios\s+(?:advocat[íi]cios|sucumbenciais)[^.!;]{0,120}R\$\s*[\d.,]+/gi,
      /R\$\s*[\d.,]+[^.!;]{0,80}honor[áa]rios/gi,
    ]
    for (const p of patterns) {
      const matches = [...t.matchAll(p)]
      if (!matches.length) continue
      const m = matches[0]
      const valorStr = extrairPrimeiroValor(m[0])
      if (!valorStr || valoresUsados.has(valorStr)) continue
      const valor = parseValorBR(valorStr)
      if (!valor) continue
      const pos = m.index
      const ctx = t.substring(Math.max(0, pos - 30), Math.min(t.length, pos + 200))
      valoresUsados.add(valorStr)
      tiposEncontrados.add('honorarios')
      verbas.push({
        tipo: 'honorarios',
        valorOriginal: formatFloat(valor),
        emDobro: false,
        indice: 'SELIC',
        termoInicial: detectarTermo(ctx),
        incluirJuros: false,
        _emDobroNaSentenca: false,
        _ipcaSelic: false,
        _extraido: true,
      })
      break
    }
  }

  // ── Avisos ────────────────────────────────────────────────────────────────
  if (verbas.some(v => v._ipcaSelic)) {
    avisos.push(
      'Padrão IPCA→SELIC detectado: correção começa pelo IPCA (desde o ajuizamento) e muda para SELIC após a citação. ' +
      'O calculador aplica IPCA durante todo o período — para precisão, considere verificar no Cálculo Jurídico.'
    )
  }
  if (verbas.some(v => v._emDobroNaSentenca)) {
    avisos.push(
      'Dano material "em dobro": o valor extraído já é o valor condenado (dobro aplicado pela sentença). ' +
      'O calculador aplica apenas correção monetária sobre esse valor.'
    )
  }

  const confianca =
    verbas.length === 0 ? 'nenhuma' :
    verbas.length >= 2 && verbas.some(v => v.tipo === 'dano_moral') ? 'alta' :
    verbas.length >= 1 ? 'media' : 'baixa'

  return { verbas, confianca, avisos }
}
