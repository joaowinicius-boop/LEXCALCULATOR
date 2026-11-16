# Mapa do Cálculo Jurídico (CJ) — o que o NG usa e como replicar no Lex

Levantado em 16/11/2026 no `app.calculojuridico.com.br` (login do escritório), só leitura.
Nenhum cálculo do escritório foi alterado. Nomes de clientes omitidos de propósito.

## 1. Como o escritório usa o CJ

Quase todos os cálculos são de dois tipos, muitas vezes em par para o mesmo cliente:

1. **Revisão da RMC ou RCC** — analisa o cartão consignado com 3 métodos (seção 2).
2. **Atualização de Débitos e Liquidação** — o cálculo do cumprimento de sentença: descontos
   (em dobro), dano material, dano moral, **o saque recebido como crédito (compensação)**,
   honorários e multa do 523 (seção 3).

Fluxo observado: o time faz a Revisão RMC (descobre valor do empréstimo, taxa, saldo) e depois
monta a Atualização lançando os descontos como débitos e o **SAQUE** (valor do empréstimo que o
cliente recebeu) como crédito. Ex. real: empréstimo de R$ 2.686,92 na Revisão RMC aparece como
crédito "SAQUE" de R$ 2.686,92 na Atualização do mesmo cliente.

Outros tipos disponíveis na conta (pouco ou não usados): Revisão de Empréstimos/SFH; Atualização –
Restituição de descontos indevidos (Fraude INSS); Restituição de tarifas abusivas; Ações
Tributárias; Rescisão Trabalhista.

## 2. Revisão da RMC/RCC (cartão consignado)

### Entradas
| Campo | Exemplo | Observação |
|---|---|---|
| Data base do cálculo | 25/06/2025 | termo final |
| Valor do empréstimo | 1.164,10 | o saque inicial do cartão |
| Data de obtenção | 19/10/2022 | |
| Taxa do consignado (% a.m.) | 1,93 | botão "Taxa Média de Juros Bacen (séries temporais): X% Aplicar" sugere a taxa do mês do contrato; INSS IN 28/2008: teto 2,14% (empréstimo) / 3,06% (cartão); RCC só existe a partir de 13/12/2022 |
| Parcelas | data, valor descontado, **saques complementares** | uma linha por desconto mensal (RMC) |
| Correção / juros da restituição | INPC; 1% a.m.; **pro rata die**; juros desde o vencimento de cada parcela ou data fixa | métodos 2 e 3 |
| Em dobro | sim/não | repetição do indébito |
| Modulação Tema 929 STJ | sim/não | dobro só para descontos após o marco |
| Dano moral | valor, início da correção, início e % dos juros, índice | calculado à parte |
| Honorários | fixo ou % sobre o devido | |

Taxas sugeridas pelo CJ vistas nos cálculos: 03/2019 → 1,89%; 09/2022 → 1,90%; 10/2022 → 1,93%.
**Série SGS exata não identificada**: a 25468 (consignado INSS, % a.m.) é a mais próxima, mas não
bate nos três meses. Tratar a taxa como campo editável com sugestão.

### Os 3 métodos
**Método 1 — Conversão em empréstimo** (o que o time chama de "amortização"): recalcula o cartão como
se fosse um consignado comum.
```
saldo_0 = valor do empréstimo
para cada desconto i:
  juros_i       = saldo_(i-1) × taxa
  amortização_i = desconto_i − juros_i
  saldo_i       = saldo_(i-1) − amortização_i + saque_complementar_i
resultado = −saldo_final   (negativo = cliente ainda deve; positivo = banco deve)
```
Conferido: 1.164,10 × 1,93% = 22,47; 59,21 − 22,47 = 36,74; saldo 1.127,36 ✓.
Se o saldo fica negativo, o método 1 **continua aplicando a taxa do contrato sobre o saldo
negativo** (os juros passam a correr a favor do cliente).

**Método 2 — Conversão com restituição**: igual ao 1 enquanto o saldo é positivo. A partir do mês
em que o saldo zera, cada desconto vira "valor a restituir" (em dobro, se marcado), corrigido pelo
índice e com juros de mora, em vez de render a taxa do contrato.
Peculiaridade observada no mês da virada: excedente = desconto − saldo anterior + juros do mês
(ex.: 191,45 − 176,85 + 3,34 = 17,94; ×2 = 35,89), e não desconto − (saldo + juros) = 11,26.
Parece um erro de sinal do CJ — **decidir com o time antes de copiar**.

**Método 3 — Restituição total**: todos os descontos (em dobro, se marcado) corrigidos e com juros.
**Não abate o valor do empréstimo recebido** — por isso o time faz a compensação na Atualização.
```
corrigido_i = desconto_i × fator(índice, mês do desconto → mês anterior à data base)
juros_i     = corrigido_i × meses_pro_rata(vencimento_i → data base) × 1%
```
Conferido: 30,8% = 30 meses + 24/30 de 01/12/2022 a 25/06/2025; 66,91 × 30,8% = 20,61 ✓.
Atenção: **este módulo arredonda o fator de correção para 2 casas** (59,21 × 1,13 = 66,91), o que
perde precisão. O Lex não deve copiar isso.

Exemplo de ordem de grandeza (caso de 2018, com saques complementares e dobro):
método 1 R$ 53.768; método 2 R$ 113.421; método 3 R$ 117.929 (+ dano moral em todos).

## 3. Atualização de Débitos e Liquidação

Fluxo em 6 etapas: **Configurações → Débitos e Créditos → Amortizações → Honorários → Multa e
Honorários do Art. 523 → Resultado**.

### Configurações
- Termo final; índice (INPC etc.), com "troca de índice" por período e opções: só variações
  positivas, capitalização simples, manter nominal em deflação.
- Juros de mora: Não aplicar; 1% a.m.; 0,5% a.m.; Juros legais (6%/12% a.a. + SELIC−IPCA desde
  30/08/2024, Lei 14.905); Juros legais sem a Lei 14.905; Poupança; **Taxa legal (SELIC−IPCA desde
  08/2024)**; **SELIC até 08/2024 e Taxa Legal depois (Tema 1368 STJ)**; taxa fixa personalizada.
- Juros a partir: do vencimento de cada débito; de uma data fixa; do vencimento com data de corte.
- Contagem dos juros: **pro rata**, desconsiderar dias restantes, ou **meses do calendário**
  (o que o time usa).
- Juros compensatórios, multa genérica (%), prescrição quinquenal.

### Débitos e Créditos
- Débito: tipo (Principal/Custas/Despesas), pedido (texto), vencimento, valor, **Dobrar**.
  Cada linha pode ter índice, juros e períodos próprios (ex.: dano moral com correção desde o
  arbitramento). "Dobrar" gera uma 2ª linha "– Repetição de Indébito".
- **Crédito = compensação**: "valores que não reduzem a dívida no cálculo, só no resultado final".
  O crédito é corrigido desde a sua data e recebe juros como os débitos; o total corrigido é
  subtraído no fim. Ex. real: SAQUE 12/09/2022 R$ 2.686,92 × fator 1,1911 = 3.200,49 + juros 24%
  (desde a data dos juros dos débitos) = **−3.968,61**.

### Amortizações (pagamentos do devedor)
"O valor foi pago para quitar a dívida → Amortizações. Valor a favor do devedor que só deve ser
descontado no saldo atualizado → Créditos." Três modos:
1. **Juros primeiro (art. 354 CC)** — padrão: o pagamento quita os juros vencidos na data, a sobra
   abate o principal, que volta a evoluir dali.
2. **Proporcional** — rateia entre principal e encargos.
3. **Crescimento e dedução** — a dívida evolui cheia; o pagamento é atualizado desde a sua data e
   deduzido no fechamento (equivale a um crédito).

### Honorários
Vários lançamentos; sucumbencial ou contratual; % ou valor fixo. No caso real com crédito, os 17%
incidiram sobre **principal corrigido + juros dos débitos (R$ 12.370,66), antes de abater o
crédito**. Total = 12.370,66 − 3.968,61 + 2.103,00 = 10.505,05.

### Multa e honorários do art. 523
- Duas caixas independentes: **multa de 10%** e **honorários de 10%** (JEC = só a multa).
- Base: "sobre os débitos" ou "sobre os débitos menos os créditos".
- Opções da base: incluir juros de mora, custas, honorários de sucumbência, multa, juros
  compensatórios.

### Resultado e relatórios
Resultado: Valor Total Geral; Principal; Juros; Créditos (negativo); Saldo devedor atualizado;
Honorários (com a base explicada); quadro por débito/crédito (valor, fator, juros, total).
Relatórios: completo, para o cliente, **para a Justiça** (memorial), para acordo, sintético,
mês a mês, conciso; PDF ou XLSX; por data ou por pedido; notas e "detalhes do cálculo".
**Nenhum traz declaração de parâmetros do TJDFT** — no Lex isso é texto novo.

## 4. Conferência com o motor do Lex (INPC oficial, SGS 188)

| Caso | CJ | Regra do Lex (mês do evento → mês anterior ao termo) |
|---|---|---|
| Saque 09/2022 → termo 11/11/2026 | 1,1911 | 1,1911 ✓ |
| Débito 12/2024 → termo 16/11/2026 | 1,0883 | 1,0882 ✓ (arredondamento) |
| Débito 02/2025 → termo 16/11/2026 | 1,0831 | 1,0830 ✓ |

**Correção: o Lex já segue a mesma regra do CJ (Atualização).**

**Juros: diferença.** O time usa "meses do calendário": 19/02/2025 → 16/11/2026 = **21%**,
17/11/2024 → 11/11/2026 = **24%**. O `mesesInteiros` do Lex desconta um mês quando o dia do termo
é menor que o dia de início (daria 20% e 23%). A Revisão RMC usa pro rata die (30,8%).

## 5. O que replicar no Lex (proposta, por melhoria do plano)

| Melhoria | Como no CJ | Proposta no Lex |
|---|---|---|
| Juros (base de tudo) | meses do calendário / pro rata / dias restantes | Opção de contagem por cálculo, padrão "meses do calendário" para bater com o CJ. Mudar o padrão altera cálculos já feitos — decidir. |
| #4 Compensação | Crédito corrigido + juros, subtraído no fim | Lista de "créditos" (data, valor, descrição; ex.: SAQUE/TED), mesmo índice e juros dos débitos, subtraídos no total. |
| #6 Só do material | CJ abate do saldo geral | No Lex, abater só do subtotal do **dano material** (sem passar de zero; o moral fica intacto). Confirmar o que fazer se o crédito for maior que o material. |
| #5 Amortização (RMC/RCC) | Revisão RMC, métodos 1–3 | Novo modo "Revisão RMC/RCC": valor e data do empréstimo, taxa (sugestão do Bacen editável), descontos + saques complementares; tabela de evolução do saldo; métodos 1, 2 e 3 lado a lado; o escolhido alimenta o cumprimento. |
| "Ligar com o Bacen" | Sugere taxa média do mês do contrato | Buscar a série SGS na edge function `indices` (série a confirmar) e mostrar "Aplicar", com tetos do INSS como alerta. |
| #2 Multa 523 | 2 caixas, base débitos ou débitos−créditos | Duas caixas (multa 10% / honorários 10%), JEC = só multa; mostrar no relatório e na petição de penhora, **sem gravar no total do dashboard**. |
| Honorários | Base antes de abater créditos | Manter a base sobre débitos corrigidos + juros (como o CJ); explicar a base no relatório. |
| #1 Relatório TJDF | Não existe | Parágrafo final fixo no relatório e na petição. |
| Amortização de pagamentos (art. 354) | Etapa Amortizações | Só se o time precisar; não foi pedido na reunião. |

## 6. Para decidir com o time
1. Padrão de contagem dos juros (calendário x pro rata) e se recalcula o histórico.
2. Crédito maior que o dano material: zera o material e ignora o resto, ou abate do moral?
3. Método 2 do RMC: copiar a regra do mês da virada como o CJ faz, ou fazer a conta correta?
4. Tema 929 (modulação do dobro): qual marco usar.
5. Série do Bacen da taxa do consignado (pedir ao time o print de onde vem o "1,93%").
