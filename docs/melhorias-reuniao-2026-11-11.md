# Melhorias pedidas — reunião de 11/11/2026

Fontes: áudio da reunião (só a 1ª metade foi gravada) + papel anotado na reunião.
Atualizado em 16/11/2026.

| # | Melhoria | O que foi pedido | Status | Tamanho |
|---|---|---|---|---|
| 1 | Relatório TJDF | Declaração no fim do relatório: "cálculos feitos com os parâmetros do TJDFT", para dar validade. Se a sentença mandar expressamente usar a ferramenta do TJDFT, fazer direto nela (exceção). | A fazer. Relatório (`RelatorioCJ.jsx`, `textosRelatorio.js`) não traz a declaração. | Pequeno |
| 2 | Multa do art. 523 | 10% multa + 10% honorários se não pagar no prazo voluntário. **JEC: só os 10% da multa.** Usada no pedido de penhora. **Não entra no total salvo/dashboard** (banco às vezes prova depois que pagou no prazo). | A fazer. `OPCOES_ART523` em `textosRelatorio.js` fixas em "Não"; sem cálculo. | Pequeno |
| 3 | Tickets / reportar erro | Botão dentro do Lex para pedir suporte ou reportar erro com print. | A fazer. Falta definir destino (ver dúvidas). | Médio |
| 4 | Compensação | Abater o valor efetivamente sacado/recebido pelo cliente (empréstimo). Hoje fazem no Cálculo Jurídico (CJ) porque o Lex não tem. | **Feito** (a704038, 16/11): "Compensação — valores recebidos" no passo 3; corrige e aplica juros pelos critérios do dano material; abate só do material (excedente não abate o moral); honorários sobre os débitos antes da compensação; relatório (Créditos), petição e .docx. Testado no ar. Juros ainda pela contagem atual (decisão 1 do mapa). | Médio |
| 5 | Amortização | Cliente já pagou: amortiza o saldo devedor (os saques); sobra saldo a pagar. Comum em RMC. | Mapeado (Revisão RMC, métodos 1–3). Pronto para implementar após decisões. | Grande |
| 6 | Descontar só do material | Compensação/amortização abatem só do dano material, nunca do moral. | Feito para a compensação (#4). | — |
| 7 | Mapear o Cálculo Jurídico | Ver as telas de compensação/amortização do CJ para copiar a metodologia (como a correção, validada com erro zero). Acesso: login do Dr. Nicolas Gomes ou acesso temporário do Victor. | **Feito** (16/11): ver `docs/calculo-juridico-mapa.md`. Faltam as decisões da seção 6 do mapa. | Pré-requisito de 4 e 5 |
| 8 | Leitura de documentos com Gemini | Trocar a IA do modo Automático de OpenAI para Gemini (API liberada no e-mail corporativo). | **Feito** (a2dbc29, 16/11): `gemini-3.1-flash-lite` com fallback `gemini-3.8-flash`, `GEMINI_API_KEY` na Vercel, testado no ar. Login da leitura validado no Supabase (75d0b1e). Chave no **plano gratuito** do projeto AI Studio "Lex Calculator": falta a empresa vincular faturamento (LGPD + cota). | Médio |
| 9 | Banco na conta da RA | Sublíder tech do NG: banco deve ficar na conta Supabase da RA, não no plano gratuito do João. Pedido: projeto "LexCalculator" numa organização da RA, João como Administrator. Depois Claude clona o LEXCALCULATOR (tabelas, RLS, funções, usuário, cálculos) e troca o endereço no app. | Aguardando a RA criar o projeto (ticket do João). | Médio |

## Dúvidas em aberto

- **"Ligar com o Bacen"**: provavelmente a taxa média do consignado que o CJ sugere na Revisão RMC (ver mapa, seção 2). Série SGS exata a confirmar.
- **Tickets**: para onde vão (tela admin no Lex, e-mail, WhatsApp) e quem responde.
- Edge function `extrair-doc` no Supabase ainda usa OpenAI, mas o app não a chama (usa `/api/extrair-doc` da Vercel). Pode ser apagada quando migrar o banco.
