// Checagem da compensação (node scripts/teste-compensacao.mjs). Série fictícia de 1% ao mês.
import assert from 'node:assert/strict'
import { calcularProcesso } from '../src/utils/calcularJuridico.js'

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

console.log('compensação ok')
