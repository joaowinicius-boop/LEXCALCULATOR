// LEX CALCULATOR — extração por IA (OpenAI gpt-4o, leitura nativa de PDF).
// Função serverless da Vercel (same-origin). A chave fica em process.env.OPENAI_API_KEY
// (só no ambiente do servidor — nunca no código). Exige usuário autenticado
// (JWT do Supabase no header Authorization) e limita tamanho/quantidade de docs.

export const config = { maxDuration: 60 }

// Decodifica o payload do JWT do Supabase (sem verificar assinatura — só checa
// role/exp, paridade com o gate anterior) para garantir que há um usuário logado.
function quemChama(req) {
  try {
    const tok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
    const payload = tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const p = JSON.parse(Buffer.from(payload, "base64").toString("utf8"))
    const exp = (p.exp || 0) * 1000
    if (exp && Date.now() > exp) return { role: "expired", sub: "" }
    return { role: p.role || "anon", sub: p.sub || "" }
  } catch { return { role: "anon", sub: "" } }
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

- JUROS DE MORA — mapeie EXATAMENTE pelo texto, verba por verba:
   • "juros de 1% ao mês" / "1% (um por cento)" / "juros de 1%" => fixo_1 (NÃO use taxa_legal).
   • "taxa legal" / "art. 406 CC" / "Lei 14.905/2024" => taxa_legal.
   • "juros pela SELIC" englobando correção => selic.  • sem juros => nenhum.
   jurosInicio: "da citação" => data da citação (se não constar, vazio); "do evento danoso"/Súmula 54 => data do 1º desconto (mês/ano => dia 01); "do arbitramento"/"a partir desta data" => data da PRÓPRIA decisão (acórdão). NÃO invente datas.

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

  const quem = quemChama(req)
  if (quem.role !== "authenticated" || !quem.sub) {
    return res.status(401).json({ ok: false, error: "Faça login para usar a extração por IA." })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ ok: false, error: "Secret OPENAI_API_KEY não configurado no servidor." })

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
      if (mt === "application/pdf") parts.push({ type: "file", file: { filename: d.nome || "documento.pdf", file_data: `data:application/pdf;base64,${d.base64}` } })
      else if (mt.startsWith("image/")) parts.push({ type: "image_url", image_url: { url: `data:${mt};base64,${d.base64}` } })
    }
    if (texto.trim()) parts.push({ type: "text", text: "Texto auxiliar:\n\n" + texto })
    if (!parts.length) return res.status(400).json({ ok: false, error: "Nada para extrair. Envie um PDF ou imagem." })
    parts.push({ type: "text", text: "Extraia e chame registrar_calculo. Lembretes: dispositivo prevalece sobre a fundamentação; vara = juízo de ORIGEM da inicial (nunca Turma Recursal); honorários em % => processo.honorariosPercentual (sem verba); índice omisso => INPC, MAS Lei 14.905/2024 ou 'taxa legal' => indice=IPCA + jurosTipo=taxa_legal; '1% ao mês' => fixo_1; 'a partir desta data' => data do acórdão." })

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 55000)
    let r
    try {
      r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: ctrl.signal,
        headers: { "Authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o", max_tokens: 8000,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: parts }],
          tools: [{ type: "function", function: { name: "registrar_calculo", description: "Registra processo e verbas.", parameters: SCHEMA } }],
          tool_choice: { type: "function", function: { name: "registrar_calculo" } },
        }),
      })
    } catch (e) {
      if (e?.name === "AbortError") return res.status(504).json({ ok: false, error: "A leitura demorou demais. Envie só a inicial e a sentença, ou um PDF menor." })
      throw e
    } finally { clearTimeout(timer) }

    const data = await r.json()
    if (!r.ok) return res.status(502).json({ ok: false, error: `OpenAI ${r.status}: ${data?.error?.message || "erro"}` })
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0]
    if (!tc?.function?.arguments) return res.status(502).json({ ok: false, error: "IA não retornou os dados estruturados." })
    let out = {}
    try { out = JSON.parse(tc.function.arguments) } catch { return res.status(502).json({ ok: false, error: "Falha ao ler o JSON da IA." }) }
    return res.status(200).json({ ok: true, processo: out.processo || null, verbas: out.verbas || [], usage: data.usage })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
