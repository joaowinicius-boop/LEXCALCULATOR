// LEX CALCULATOR — extração por IA (Google Gemini, leitura nativa de PDF).
// Função serverless da Vercel (same-origin). A chave fica em process.env.GEMINI_API_KEY
// (só no ambiente do servidor — nunca no código). Exige usuário autenticado
// (JWT do Supabase no header Authorization) e limita tamanho/quantidade de docs.

import { SUPABASE_URL, SUPABASE_ANON } from "../src/lib/supabase.js"

export const config = { maxDuration: 60 }

// flash-lite: estável e rápido (~5 s) nos testes de 16/11/2026; os flash maiores davam 503
// ou ~50 s. GEMINI_MODEL na Vercel troca o principal sem mexer no código.
const MODELOS = [process.env.GEMINI_MODEL || "gemini-3.1-flash-lite", "gemini-3.8-flash"]

// Pergunta ao próprio Supabase Auth se o token é de um usuário logado de verdade
// (confere assinatura e expiração). Antes só líamos o payload, e um token forjado passava.
async function usuarioLogado(req) {
  const tok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  if (!tok) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${tok}` } })
    return r.ok && !!(await r.json())?.id
  } catch { return false }
}

const SYSTEM = `Você é um extrator de dados de petições e decisões judiciais brasileiras para CUMPRIMENTO DE SENTENÇA. Leia os documentos e chame a função registrar_calculo.

REGRAS OBRIGATÓRIAS:
- COMPLETUDE: inclua SEMPRE todas as verbas da parte dispositiva: DANO MORAL, DANO MATERIAL e HONORÁRIOS quando arbitrados em VALOR FIXO. NUNCA omita o dano moral.
- DISPOSITIVO PREVALECE: se a fundamentação e o DISPOSITIVO divergirem (ex.: fundamentação fala R$ 4.000 e o dispositivo "arbitrar em R$ 1.000"), use SEMPRE o valor do DISPOSITIVO (o item "CONDENAR/arbitrar/DOU PROVIMENTO para...").
- HONORÁRIOS EM PERCENTUAL (ex.: "honorários de 20% sobre o valor da condenação", art. 55 da Lei 9.099/95): NÃO crie verba — informe processo.honorariosPercentual = 20. Só crie verba 'honorarios' se for valor FIXO em reais. Em Juizado sem condenação em honorários, deixe vazio.

- ENDEREÇAMENTO (vara): o cumprimento de sentença corre no JUÍZO DE ORIGEM (1º grau). Copie o endereçamento da PETIÇÃO INICIAL (ex.: "Vara do Juizado Especial Cível da Comarca de Coari/AM") — NÃO use a Turma Recursal do acórdão. Se a inicial tiver lacuna ("____ª Vara"), omita o número e devolva o restante. NUNCA deixe vara vazia se a inicial tiver o endereçamento.

- DANO MORAL e HONORÁRIOS FIXOS: UMA parcela {data, valor}; data = data da decisão que ARBITROU (se o acórdão arbitrou/reformou, data do acórdão). NÃO use periodoInicio/periodoFim/valorTotalSimples/valorEmDobro para eles.

- DANO MATERIAL / descontos (restituição): a inicial traz um QUADRO de descontos, normalmente tabela ESCANEADA. ⚠️ NUNCA transcreva linha a linha — você inventa/duplica meses. Leia o RODAPÉ e copie OS DOIS totais em campos SEPARADOS:
   • valorTotalSimples = linha "VALOR TOTAL"/"TOTAL" (soma SIMPLES).
   • valorEmDobro = linha "VALOR EM DOBRO"/"ART. 42 CDC" (≈ 2× o simples).
   NÃO faça contas nem escolha entre eles. Se o número estiver ilegível/incerto, deixe os campos vazios (o usuário anexa a planilha). Informe periodoInicio/periodoFim (1º e último desconto da rubrica recorrente) e parcelas=[].
   OBS: se há PLANILHA (.xlsx) anexada, o sistema lê os descontos dela — foque no contexto jurídico.

- ÍNDICE de correção monetária: o que a DECISÃO determinar para cada verba (INPC, IPCA, SELIC). ⚠️ ATENÇÃO Lei 14.905/2024: se a decisão mandar atualizar pela "Lei 14.905/2024", pela "taxa legal" ou pelo "art. 406 do CC" (inclusive expressões como "conforme o marco temporal definido pela Lei 14.905" ou remessa à ferramenta do TJDFT/juriscalc), então o índice de correção é IPCA E jurosTipo=taxa_legal — o IPCA é o índice oficial de correção dessa lei e os juros legais são SELIC menos IPCA. Só use INPC (padrão) se a decisão NÃO especificar índice algum NEM invocar a Lei 14.905/taxa legal — NUNCA invente SELIC/IPCA por conta própria. Dano moral "exclusivamente SELIC" => indice=SELIC e jurosTipo=nenhum.

- JUROS DE MORA (TAXA) — mapeie verba por verba:
   • ⚠️ CLÁUSULA GERAL: se a decisão tiver uma determinação GERAL de atualização/juros pela "Lei 14.905/2024" / "taxa legal" / "art. 406 do CC" / "marco temporal da Lei 14.905" (que vale para TODA a condenação), então jurosTipo=taxa_legal para TODAS as verbas — INCLUSIVE as que só citam "juros desde o evento danoso"/Súmula 54 ou "desde o arbitramento"/Súmula 362. Súmulas 54/362 definem só o INÍCIO dos juros, NÃO a taxa. Não rebaixe para fixo_1 só porque a verba cita a Súmula 54.
   • Só use fixo_1 quando a decisão fixar EXPRESSAMENTE "juros de 1% ao mês" / "1% (um por cento)" para aquela verba (e SEM cláusula geral da Lei 14.905).
   • "juros pela SELIC" englobando correção => selic.  • sem juros => nenhum.
   jurosInicio: "da citação" => data da citação (se não constar, vazio); "do evento danoso"/Súmula 54 => data do 1º desconto (mês/ano => dia 01); "do arbitramento"/"a partir desta data"/Súmula 362 => data da PRÓPRIA decisão (acórdão). NÃO invente datas.

- emDobro = true para restituição em dobro (art. 42 CDC) ou linha "VALOR EM DOBRO". NUNCA dobre você mesmo.
- NÃO crie verba para astreintes nem multa do art. 523.
- Datas ISO AAAA-MM-DD; números com ponto decimal, sem R$.
- Documento-base: acórdão se reformou; o que ele não alterou segue a sentença ("permanecendo incólume"). Metadados: processo (número CNJ da AÇÃO DE ORIGEM), cliente, executada, vara, datas (dataDecisao = data da decisão-base; dataCitacao se constar).`

const SCHEMA = {
  type: "object",
  properties: {
    processo: { type: "object", properties: {
      processo: { type: "string" }, cliente: { type: "string" }, executada: { type: "string" }, vara: { type: "string", description: "Juízo de ORIGEM (1º grau) da inicial — nunca a Turma Recursal." },
      tipoDocumento: { type: "string", enum: ["sentenca", "acordao"] },
      dataDecisao: { type: "string" }, dataTransito: { type: "string" }, dataCitacao: { type: "string" }, dataAjuizamento: { type: "string" },
      honorariosPercentual: { type: "number", description: "Honorários sucumbenciais em % sobre a condenação (ex.: 20). Vazio se não houver." } } },
    verbas: { type: "array", items: { type: "object", properties: {
      tipo: { type: "string", enum: ["dano_moral", "dano_material", "honorarios", "outro"] },
      descricao: { type: "string" },
      indice: { type: "string", enum: ["INPC", "IPCA", "SELIC"] },
      emDobro: { type: "boolean" },
      jurosTipo: { type: "string", enum: ["fixo_1", "taxa_legal", "selic", "nenhum"] },
      jurosInicio: { type: "string" },
      valorTotalSimples: { type: "number", description: "Só dano material: linha 'VALOR TOTAL' (soma SIMPLES)." },
      valorEmDobro: { type: "number", description: "Só dano material: linha 'VALOR EM DOBRO' (2x o simples). Não calcule; copie." },
      totalDeclarado: { type: "number", description: "Deixe vazio (o sistema deriva)." },
      periodoInicio: { type: "string" }, periodoFim: { type: "string" },
      parcelas: { type: "array", items: { type: "object", properties: { data: { type: "string" }, valor: { type: "number" } }, required: ["data", "valor"] } },
    }, required: ["tipo", "indice", "emDobro", "jurosTipo", "parcelas"] } },
  },
  required: ["verbas"],
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" })

  if (!(await usuarioLogado(req))) {
    return res.status(401).json({ ok: false, error: "Faça login para usar a extração por IA." })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ ok: false, error: "Chave do Gemini não cadastrada — abrir ticket para o time tech." })

  try {
    const body = typeof req.body === "object" && req.body ? req.body : JSON.parse(req.body || "{}")
    const documentos = Array.isArray(body.documentos) ? body.documentos : []
    let texto = typeof body.texto === "string" ? body.texto : ""

    if (documentos.length > 5) return res.status(400).json({ ok: false, error: "Máximo de 5 documentos por extração." })
    const totalB64 = documentos.reduce((a, d) => a + (d?.base64?.length || 0), 0)
    if (totalB64 > 5_500_000) return res.status(400).json({ ok: false, error: "Documentos muito grandes. Envie só a inicial e a decisão (ou PDFs menores) — o limite aqui é ~4 MB no total." })
    if (texto.length > 100_000) texto = texto.slice(0, 100_000)

    const parts = []
    for (const d of documentos) {
      if (!d?.base64) continue
      const mt = d.mediaType || "application/pdf"
      if (mt === "application/pdf" || mt.startsWith("image/")) parts.push({ inline_data: { mime_type: mt, data: d.base64 } })
    }
    if (texto.trim()) parts.push({ text: "Texto auxiliar:\n\n" + texto })
    if (!parts.length) return res.status(400).json({ ok: false, error: "Nada para extrair. Envie um PDF ou imagem." })
    parts.push({ text: "Extraia e chame registrar_calculo. Lembretes: dispositivo prevalece sobre a fundamentação; vara = juízo de ORIGEM da inicial (nunca Turma Recursal); honorários em % => processo.honorariosPercentual (sem verba); índice omisso => INPC, MAS Lei 14.905/2024 ou 'taxa legal' => indice=IPCA + jurosTipo=taxa_legal; '1% ao mês' => fixo_1; 'a partir desta data' => data do acórdão." })

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 55000)
    const corpo = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts }],
      tools: [{ functionDeclarations: [{ name: "registrar_calculo", description: "Registra processo e verbas.", parameters: SCHEMA }] }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["registrar_calculo"] } },
      generationConfig: { temperature: 0, maxOutputTokens: 8000 },
    })
    let r, data
    try {
      // Modelo congestionado (503) ou cota estourada (429): tenta o próximo da lista.
      for (const modelo of MODELOS) {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method: "POST", signal: ctrl.signal,
          headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
          body: corpo,
        })
        data = await r.json()
        if (r.status !== 503 && r.status !== 429) break
      }
    } catch (e) {
      if (e?.name === "AbortError") return res.status(504).json({ ok: false, error: "A leitura demorou demais. Envie só a inicial e a sentença, ou um PDF menor." })
      throw e
    } finally { clearTimeout(timer) }

    if (!r.ok) return res.status(502).json({ ok: false, error: `Gemini ${r.status}: ${data?.error?.message || "erro"}` })
    const out = (data?.candidates?.[0]?.content?.parts || []).find(p => p.functionCall)?.functionCall?.args
    if (!out) return res.status(502).json({ ok: false, error: "IA não retornou os dados estruturados." })
    return res.status(200).json({ ok: true, processo: out.processo || null, verbas: out.verbas || [], usage: data.usageMetadata })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
