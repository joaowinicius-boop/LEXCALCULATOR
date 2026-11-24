# Melhorias pedidas — reunião de 11/11/2026

Fontes: áudio da reunião (só a 1ª metade foi gravada) + papel anotado na reunião.
Atualizado em 23/11/2026.

| # | Melhoria | O que foi pedido | Status | Tamanho |
|---|---|---|---|---|
| 1 | Relatório TJDF | Declaração no fim do relatório: "cálculos feitos com os parâmetros do TJDFT", para dar validade. Se a sentença mandar expressamente usar a ferramenta do TJDFT, fazer direto nela (exceção). | **Feito** (16/11): `DECLARACAO_TJDFT` no fim do relatório (Detalhes), na petição HTML e no .docx. | Pequeno |
| 2 | Multa do art. 523 | 10% multa + 10% honorários se não pagar no prazo voluntário. **JEC: só os 10% da multa.** Usada no pedido de penhora. **Não entra no total salvo/dashboard** (banco às vezes prova depois que pagou no prazo). | **Feito** (16/11): caixas "Multa de 10%" e "Honorários de 10%" no passo 3; base = débitos − créditos (com juros, sem sucumbência, padrão do CJ); relatório e petição mostram o total com o 523; `totalGeral`/dashboard não muda. | Pequeno |
| 3 | Tickets / reportar erro | Botão dentro do Lex para pedir suporte ou reportar erro com print. | **Feito** (23/11): aba Tickets + botão fixo "Ticket" em todas as telas e "Reportar este erro" nas mensagens de erro (e tela que quebra). Tipos: bug, melhoria, sugestão, dúvida, outro. Texto, áudio gravado no navegador, imagens (anexo ou Ctrl+V), em qualquer combinação. Vai junto: tela, passo e dados do cálculo, erro. Anexos na pasta privada `tickets` do Supabase. Quem responde (status + resposta): `app_metadata.lex_admin` — hoje a conta do Dr. Nicolas. SQL em `supabase/migrations/20261123_tickets.sql`. Sem aviso por e-mail/WhatsApp ainda. | Médio |
| 4 | Compensação | Abater o valor efetivamente sacado/recebido pelo cliente (empréstimo). Hoje fazem no Cálculo Jurídico (CJ) porque o Lex não tem. | **Feito** (a704038, 16/11): "Compensação — valores recebidos" no passo 3; corrige e aplica juros pelos critérios do dano material; abate só do material (excedente não abate o moral); honorários sobre os débitos antes da compensação; relatório (Créditos), petição e .docx. Testado no ar. Juros ainda pela contagem atual (decisão 1 do mapa). | Médio |
| 5 | Amortização | Cliente já pagou: amortiza o saldo devedor (os saques); sobra saldo a pagar. Comum em RMC. | **Método 1 feito** (18/11): dano material com "Forma de cálculo → Conversão em empréstimo": valor e data do empréstimo, taxa % a.m., saques complementares; relatório "Revisão da RMC/RCC" com a evolução do saldo; petição explica o resultado. Bate centavo a centavo com caso real do CJ (saldo 716,48). Saldo devedor do cliente não abate outras verbas. Faltam métodos 2 e 3 (decisões 1, 3 e 4 do mapa) e a taxa do Bacen. | Grande |
| 6 | Descontar só do material | Compensação/amortização abatem só do dano material, nunca do moral. | Feito para a compensação (#4). | — |
| 7 | Mapear o Cálculo Jurídico | Ver as telas de compensação/amortização do CJ para copiar a metodologia (como a correção, validada com erro zero). Acesso: login do Dr. Nicolas Gomes ou acesso temporário do Victor. | **Feito** (16/11): ver `docs/calculo-juridico-mapa.md`. Faltam as decisões da seção 6 do mapa. | Pré-requisito de 4 e 5 |
| 8 | Leitura de documentos com Gemini | Trocar a IA do modo Automático de OpenAI para Gemini (API liberada no e-mail corporativo). | **Feito** (a2dbc29, 16/11): `gemini-3.1-flash-lite` com fallback `gemini-3.8-flash`, `GEMINI_API_KEY` na Vercel, testado no ar. Login da leitura validado no Supabase (75d0b1e). Chave no **plano gratuito** do projeto AI Studio "Lex Calculator": falta a empresa vincular faturamento (LGPD + cota). | Médio |
| 9 | Banco na conta da RA | Sublíder tech do NG: banco deve ficar na conta Supabase da RA, não no plano gratuito do João. Pedido: projeto "LexCalculator" numa organização da RA, João como Administrator. Depois Claude clona o LEXCALCULATOR (tabelas, RLS, funções, usuário, cálculos) e troca o endereço no app. | **Feito** (23/11): projeto "LexCalculator" na organização LexGroup [Desenvolvimento] (zdfvykmhddritwqjrnvi). Estrutura, RLS, funções, usuário (mesma senha) e cálculos copiados pelo SQL Editor; app aponta para ele. Edge function `indices` virou `api/indices.js` na Vercel. Banco antigo (gnebvpqmaxxyzuxjrjid) intacto como reserva. João é membro, não admin (não dá para ligar o conector nem publicar edge functions). | Médio |

## Dúvidas em aberto

- **"Ligar com o Bacen"**: provavelmente a taxa média do consignado que o CJ sugere na Revisão RMC (ver mapa, seção 2). Série SGS exata a confirmar.
- **Tickets**: quem responde além da conta do Dr. Nicolas (dar `lex_admin` a outra conta) e se precisa de aviso por e-mail/WhatsApp quando abrir ticket.
- Edge function `extrair-doc` no Supabase ainda usa OpenAI, mas o app não a chama (usa `/api/extrair-doc` da Vercel). Pode ser apagada quando migrar o banco.

## Respostas da execução (24/11/2026)

1. **Juros**: contar ao pé da letra desde a data fixada (em geral a citação). Lex passou a contar **pro rata die** (meses completos + dias restantes / 30, como o CJ). Cálculos já feitos ficam como estão; refaz só se forem impugnados.
2. **Saque maior que o material**: confirmado, não abate do moral nem dos honorários (já é assim).
3. **Método 2, mês da virada**: em aberto (vai discutir com o Pablo).
4. **Dobro**: sempre desde o início do dano material, sem marco do Tema 929 (já é assim).
5. **Taxa do Bacen**: vai mostrar como o CJ sugere e procurar a fonte.
6. **Mais usados**: métodos 1 e 2. Método 3 fica por último.
