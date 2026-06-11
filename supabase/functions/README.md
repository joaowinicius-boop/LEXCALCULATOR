# Edge Functions (Supabase) — projeto `gnebvpqmaxxyzuxjrjid`

Funções no ar (deployadas via MCP/Console):

| Função | O que faz | Auth | Secret |
|---|---|---|---|
| `indices` | Proxy das séries do Banco Central (SGS: INPC=188, IPCA=433, SELIC=4390). | anon (Bearer) | — |
| `calcular` | Motor de atualização (espelha `src/utils/calcularJuridico.js`). Recebe `{processo, verbas[], termoFinal?, honorariosPercentual?, incluirHtml?}` e devolve totais + parcelas (+ `html`/`htmlPorVerba` quando `incluirHtml`). | anon (Bearer) | — |
| `extrair-doc` | Extração por IA (**OpenAI** `gpt-4o`, function calling forçado). Recebe `{documentos:[{base64,mediaType,nome}], texto?}` e devolve `{processo, verbas}` no contrato do sistema. O front extrai o TEXTO dos PDFs (pdfjs) e envia em `texto` (rápido); imagens vão por visão. | anon (Bearer) | **OPENAI_API_KEY** |

## Configurar o secret da IA (necessário para `extrair-doc`)

No painel Supabase: **Project Settings → Edge Functions → Secrets** (ou **Edge Functions → Manage secrets**) e adicione:

```
OPENAI_API_KEY = sk-...   (sua chave do platform.openai.com)
```

Ou via CLI: `supabase secrets set OPENAI_API_KEY=sk-...`

Enquanto o secret não estiver setado, `extrair-doc` responde:
`{"ok":false,"error":"Secret OPENAI_API_KEY não configurado no Supabase."}`

> O código-fonte das funções está versionado no histórico de deploy do projeto.
> Posso commitar os `index.ts` completos aqui sob `supabase/functions/<nome>/` se quiser o repo como fonte única.

## Segurança (aplicada em todas as funções)

| Proteção | Detalhe |
|---|---|
| Autenticação | `extrair-doc` exige usuário LOGADO (anon = 401) — a chave anônima é pública e não pode queimar crédito de IA. `calcular`/`indices` aceitam anon (integrações n8n), mas com rate limit. |
| Rate limit | `extrair-doc` 10/h por usuário · `calcular` 60/h · `indices` 240/h por usuário/IP. Implementado via tabela `rate_limits` + função `hit_rate_limit` (security definer, acessível só pelo service role). 429 ao estourar. |
| Limites de payload | extração: ≤5 documentos, ≤~12MB; cálculo: ≤25 verbas, ≤2.500 parcelas. O front valida antes de enviar. |
| CORS | restrito a `https://lexcalculator.vercel.app` + `http://localhost:*` (server-to-server, como o n8n, não usa CORS e segue funcionando). |
| BACEN | séries buscadas em blocos de 9 anos (limite de 10 anos do SGS) com retry. |
| n8n | para usar `extrair-doc` via n8n, autentique antes: `POST /auth/v1/token?grant_type=password` com um usuário do sistema e use o `access_token` como Bearer. |
