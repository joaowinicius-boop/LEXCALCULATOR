# Design — Relatório de Atualização estilo "Cálculo Jurídico"

Data: 2026-06-04
Branch: `feature/relatorio-calculo-juridico`

## Objetivo

Substituir o motor de cálculo simplificado (aproximação de índice anual) por um
motor **parcela-a-parcela com índices oficiais**, e gerar um **relatório igual ao
do Cálculo Jurídico (CJ)**, com a marca do escritório, exportável em **PDF, Word e
impressão**.

Mais adiante (fora deste spec): gerar a peça de **cumprimento de sentença** no
modelo Nicolas Gomes, consumindo os totais deste relatório.

## Convenção de cálculo (VALIDADA contra os modelos do CJ)

Validado com erro ZERO contra os 13 fatores do modelo `DANOSMATERIAIS.pdf`:

- **Correção monetária (Fator):** produto das variações mensais do índice
  escolhido, do **mês do desconto (inclusive)** até o **último mês fechado antes
  do termo final**. Ex.: termo final 14/01/2026 → janela vai até 12/2025.
  - `valorCorrigido = valor * fator`
- **Juros de mora:** começam numa **data própria** (definida pela sentença, ex.:
  citação/evento danoso), independente do termo inicial da correção.
  - Tipo `fixo_1` (1% a.m.): `percentual = mesesInteiros(jurosInicio, termoFinal) * 1%`
    (sem pro-rata por padrão; "pro-rata die = Não" no CJ).
  - Tipo `taxa_legal`/`selic`: acumulado da SELIC no período (a calibrar).
  - `valorJuros = valorCorrigido * percentual`
- **"Em dobro" (repetição do indébito):** cada parcela é contada **duas vezes**
  (linha "Principal" + linha "Repetição de Indébito" idênticas).
- **Honorários de sucumbência:** percentual sobre o **total já corrigido** dos
  débitos (conforme resposta do advogado).
- **Termo final:** data em que o cálculo é feito.
- **Índice e termos:** sempre conforme a determinação da sentença/acórdão.
- **Total geral:** Σ(principal corrigido) + Σ(juros) + honorários − créditos.

## Fonte dos índices

- **Banco Central SGS** (server-side, sem CORS): INPC=188, IPCA=433, SELIC=4390.
- Buscado por uma **Edge Function** do Supabase (`indices`), com cache em tabela
  `indices_mensais (indice, ano, mes, variacao)`; botão "atualizar" e atualização
  agendada. O front lê a série e calcula localmente (transparente e testável).

## Componentes

1. `src/utils/calcularJuridico.js` — motor puro (sem rede). Entrada: parcelas,
   série do índice, config de juros, em dobro, honorários, termo final. Saída:
   detalhamento por parcela + totais (formato do relatório CJ).
2. **Camada de índices** — Edge Function `indices` (proxy+cache BACEN) + tabela.
3. `src/pages/Relatorio.jsx` (+ util de export) — renderiza o relatório no layout
   do CJ com marca do escritório; botões **Baixar PDF**, **Baixar Word (.docx)**,
   **Imprimir**.
4. **Wizard** (`NovoCalculo.jsx`) — captura por verba: índice, termo inicial da
   correção, data início dos juros + tipo, em dobro, honorários %, e a **lista de
   parcelas** (manual agora; via IA na Fase 2, lendo a inicial).

## Validação

- Caso 1 (DANOS MATERIAIS): INPC + juros 1% a.m. + em dobro → **R$ 21.336,62**.
- Caso 2 (DANOS MORAIS): IPCA + juros taxa legal → **R$ 10.878,13**.
- Caso 3 (Ana Karenina): conferência cruzada.

## Fora de escopo (agora)

- Extração automática das parcelas a partir da inicial (Fase 2 — IA).
- Multa do art. 523, custas, despesas, juros compensatórios (campos existem no CJ
  mas ficam zerados/ocultos por padrão; adicionáveis depois).
