// Checagem do motor (node scripts/teste-calculo.mjs): compensação, art. 523 e RMC/RCC método 1.
// Série fictícia de 1% ao mês nos casos de compensação/523.
import assert from 'node:assert/strict'
import { calcularProcesso, calcularConversaoEmprestimo, mesesJuros } from '../src/utils/calcularJuridico.js'

const serie = {}
for (let a = 2023; a <= 2025; a++) for (let m = 1; m <= 12; m++) serie[`${a}-${String(m).padStart(2, '0')}`] = 1
const juros = { tipo: 'fixo_1', dataInicio: '2024-01-01' }
const material = { tipo: 'dano_material', serie, emDobro: false, juros, parcelas: [{ data: '2024-01-01', valor: 1000 }] }
const moral = { tipo: 'dano_moral', serie, emDobro: false, juros, parcelas: [{ data: '2024-01-01', valor: 5000 }] }
const termoFinal = '2025-01-01'   // 12 meses de correção (01..12/2024) e 12 meses de juros
const quase = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`)

// 1) Sem créditos: nada muda.
const sem = calcularProcesso([material, moral], { termoFinal, honorariosPercentual: 10 })
quase(sem.compensacao.compensado, 0)

// 2) Crédito menor que o material: abate só o crédito; honorários continuam sobre o bruto.
const com = calcularProcesso([material, moral], { termoFinal, honorariosPercentual: 10, creditos: [{ data: '2024-01-01', valor: 500 }] })
quase(com.compensacao.total, 500 * 1.01 ** 12 * 1.12)
quase(com.honorarios, sem.honorarios)
quase(com.totalGeral, sem.totalGeral - com.compensacao.total)

// 3) Crédito maior que o material: abate até zerar o material; o moral fica intacto.
const muito = calcularProcesso([material, moral], { termoFinal, creditos: [{ data: '2024-01-01', valor: 9000 }] })
const subMaterial = muito.resultados[0].resultado.subtotal
quase(muito.compensacao.compensado, subMaterial)
quase(muito.compensacao.naoCompensado, muito.compensacao.total - subMaterial)
quase(muito.totalGeral, muito.resultados[1].resultado.subtotal)

// 4) Sem dano material: crédito é ignorado (não abate do moral).
const soMoral = calcularProcesso([moral], { termoFinal, creditos: [{ data: '2024-01-01', valor: 500 }] })
quase(soMoral.compensacao.compensado, 0)

// 5) Art. 523: base = débitos − créditos (sem honorários de sucumbência), fora do totalGeral.
const m523 = calcularProcesso([material, moral], { termoFinal, honorariosPercentual: 10, creditos: [{ data: '2024-01-01', valor: 500 }], art523: { multa: true, honorarios: true } })
const base = m523.principal + m523.juros - m523.compensacao.compensado
quase(m523.art523.valorMulta, base * 0.1)
quase(m523.art523.valorHonorarios, base * 0.1)
quase(m523.totalGeral, com.totalGeral)
quase(m523.art523.totalComMulta, com.totalGeral + base * 0.2)
// JEC: só a multa.
const jec = calcularProcesso([material, moral], { termoFinal, art523: { multa: true } })
quase(jec.art523.valorHonorarios, 0)
quase(jec.art523.totalComMulta, jec.totalGeral * 1.1)
quase(sem.art523.totalComMulta, sem.totalGeral)

// 6) RMC método 1 — caso real do Cálculo Jurídico (empréstimo 1.164,10 a 1,93% a.m.; resultado −716,48).
const centavo = (a, b) => assert.equal(Math.round(a * 100), Math.round(b * 100), `${a} != ${b}`)
const descontos = [59.21, 59.21, 59.71, 59.71, 65.10, 61.58, 61.58, 56.58, 56.58, 56.58, 56.58]
  .map((valor, i) => ({ data: `${2022 + Math.floor((11 + i) / 12)}-${String((11 + i) % 12 + 1).padStart(2, '0')}-01`, valor }))
const cj = calcularConversaoEmprestimo({ valorEmprestimo: 1164.10, taxa: 1.93, parcelas: descontos })
const saldosCJ = [1127.36, 1089.91, 1051.23, 1011.81, 966.24, 923.31, 879.55, 839.94, 799.57, 758.42, 716.48]
const jurosCJ = [22.47, 21.76, 21.04, 20.29, 19.53, 18.65, 17.82, 16.98, 16.21, 15.43, 14.64]
cj.linhas.forEach((l, i) => { centavo(l.saldo, saldosCJ[i]); centavo(l.juros, jurosCJ[i]) })
assert.equal(cj.linhas[10].data, '2023-10-01')
centavo(cj.totalDescontos, 652.42); centavo(cj.jurosContrato, 204.80); centavo(cj.totalAmortizacao, 447.62)
centavo(cj.saldoDevedor, 716.48); centavo(cj.aRestituir, 0); centavo(cj.subtotal, 0)

// 7) Saldo negativo: a taxa segue correndo a favor do cliente; saque entra na linha do seu mês.
const neg = calcularConversaoEmprestimo({ valorEmprestimo: 100, taxa: 2, saques: [{ data: '2024-02-15', valor: 50 }],
  parcelas: [{ data: '2024-01-05', valor: 80 }, { data: '2024-02-05', valor: 80 }, { data: '2024-03-05', valor: 80 }] })
quase(neg.linhas[0].saldo, 22)                       // 100 + 2 − 80
quase(neg.linhas[1].saldo, 22 * 1.02 - 80 + 50)      // −7,56 (saque de fev. na linha de fev.)
quase(neg.linhas[2].juros, neg.linhas[1].saldo * 0.02) // juros negativos
quase(neg.aRestituir, -neg.saldoFinal)
quase(neg.totalSaques, 50)

// 8) No processo: conversão vai pelo valor a restituir, não leva compensação, honorários sobre ela.
const conv = { tipo: 'dano_material', modo: 'conversao', valorEmprestimo: 100, taxa: 2, parcelas: neg.linhas.map(l => ({ data: l.data, valor: l.valor })), saques: [{ data: '2024-02-15', valor: 50 }] }
const procConv = calcularProcesso([conv, moral], { termoFinal, honorariosPercentual: 10, creditos: [{ data: '2024-01-01', valor: 500 }] })
quase(procConv.compensacao.compensado, 0)
quase(procConv.resultados[0].resultado.subtotal, neg.aRestituir)
quase(procConv.totalGeral, (neg.aRestituir + procConv.resultados[1].resultado.subtotal) * 1.1)

// Juros pro rata die (casos do CJ): meses completos + dias restantes / 30.
quase(mesesJuros('2022-12-01', '2025-06-25'), 30.8)
quase(mesesJuros('2025-02-19', '2026-11-16'), 20 + 28 / 30)
quase(mesesJuros('2024-01-31', '2024-02-29'), 1)       // fim de mês: 31/01 + 1 mês = 29/02
quase(mesesJuros('2024-01-01', '2025-01-01'), 12)

console.log('juros pro rata, compensação, art. 523 e RMC método 1 ok')
