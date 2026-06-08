# Edge Functions (Supabase) — projeto `gnebvpqmaxxyzuxjrjid`

Funções no ar (deployadas via MCP/Console):

| Função | O que faz | Auth | Secret |
|---|---|---|---|
| `indices` | Proxy das séries do Banco Central (SGS: INPC=188, IPCA=433, SELIC=4390). | anon (Bearer) | — |
| `calcular` | Motor de atualização (espelha `src/utils/calcularJuridico.js`). Recebe `{processo, verbas[], termoFinal?, honorariosPercentual?, incluirHtml?}` e devolve totais + parcelas (+ `html`/`htmlPorVerba` quando `incluirHtml`). | anon (Bearer) | — |
| `extrair-doc` | Extração por IA (Claude API, `claude-opus-4-8`, tool_use forçado). Recebe `{documentos:[{base64,mediaType,nome}], texto?}` e devolve `{processo, verbas}` no contrato do sistema. | anon (Bearer) | **ANTHROPIC_API_KEY** |

## Configurar o secret da IA (necessário para `extrair-doc`)

No painel Supabase: **Project Settings → Edge Functions → Secrets** (ou **Edge Functions → Manage secrets**) e adicione:

```
ANTHROPIC_API_KEY = sk-ant-...   (sua chave do Console Anthropic)
```

Ou via CLI: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

Enquanto o secret não estiver setado, `extrair-doc` responde:
`{"ok":false,"error":"Secret ANTHROPIC_API_KEY não configurado no Supabase."}`

> O código-fonte das funções está versionado no histórico de deploy do projeto.
> Posso commitar os `index.ts` completos aqui sob `supabase/functions/<nome>/` se quiser o repo como fonte única.
