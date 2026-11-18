import { Fragment } from 'react'
import { Scale } from 'lucide-react'
import { fmtBRL, fmtFator, fmtPct, fmtData, INDICE_NOME } from '../utils/calcularJuridico.js'
import {
  LABEL_JUROS, OPCOES_CORRECAO, OPCOES_MULTA, OPCOES_ART523, DETALHES_CALCULO, DECLARACAO_TJDFT,
} from '../data/textosRelatorio.js'

const TIPO_UP = {
  dano_moral: 'DANOS MORAIS',
  dano_material: 'DANOS MATERIAIS',
  honorarios: 'HONORÁRIOS SUCUMBENCIAIS',
  outro: 'OUTRA VERBA',
}

const S = {
  h2: { fontSize: '12.5pt', fontWeight: 700, color: '#0369a1', margin: '14px 0 6px', borderBottom: '1px solid #e2e8f0', paddingBottom: 3 },
  h3: { fontSize: '11pt', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px' },
  kv: { width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: 8 },
  kvLabel: { padding: '3px 6px', color: '#334155', borderBottom: '1px solid #eef2f7', width: '62%' },
  kvVal: { padding: '3px 6px', color: '#0f172a', borderBottom: '1px solid #eef2f7', textAlign: 'right', fontWeight: 600 },
  th: { border: '1px solid #cbd5e1', padding: '4px 5px', background: '#eef4fa', color: '#334155', fontWeight: 600, fontSize: '8.5pt' },
  td: { border: '1px solid #e2e8f0', padding: '3px 5px', fontSize: '8.5pt' },
  tdr: { border: '1px solid #e2e8f0', padding: '3px 5px', fontSize: '8.5pt', textAlign: 'right' },
}

function Foot({ geradoEm }) {
  return (
    <div className="cj-foot">
      <span>LEX CALCULATOR · Nicolas Gomes Sociedade Individual de Advocacia</span>
      <span>Relatório gerado em {geradoEm}</span>
    </div>
  )
}

function Cabecalho({ titulo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0ea5e9', paddingBottom: 10, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={18} color="#fff" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '13pt' }}>LEX CALCULATOR</p>
          <p style={{ margin: 0, fontSize: '8.5pt', color: '#64748b' }}>Nicolas Gomes Sociedade Individual de Advocacia</p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{titulo}</p>
    </div>
  )
}

// Revisão da RMC/RCC — conversão em empréstimo (método 1 do CJ): evolução do saldo devedor.
function RelatorioConversao({ meta, geradoEm, termoFinal, verba, resultado: r }) {
  const devedor = r.saldoDevedor > 0.005
  const cols = ['Nº', 'Data', 'Valor descontado', 'Saldo anterior', 'Taxa', 'Juros', 'Amortização', 'Saques compl.', 'Saldo atual']
  return (
    <article className="cj-report">
      <section className="cj-sheet">
        <Cabecalho titulo="Revisão da RMC/RCC" />

        <h2 style={S.h2}>Dados do Cliente</h2>
        <KV rows={[['Nome', meta.cliente || '—'], ['Processo nº', meta.processo || '—'], ['Parte executada', meta.executada || '—']]} />

        <h2 style={S.h2}>Dados do Cálculo</h2>
        <KV rows={[
          ['Nome do cálculo', `Conversão do cartão consignado em empréstimo (método 1)${verba.descricao ? ` — ${verba.descricao}` : ''}`],
          ['Data base', fmtData(termoFinal)],
          ['Valor do empréstimo (valor efetivamente recebido)', fmtBRL(r.valorEmprestimo)],
          ...(verba.dataEmprestimo ? [['Data do empréstimo', fmtData(verba.dataEmprestimo)]] : []),
          ['Taxa de juros do contrato', `${fmtPct(r.taxa)} ao mês`],
          ['Descontos lançados', String(r.linhas.length)],
        ]} />

        <h2 style={S.h2}>Resultado</h2>
        <KV rows={[
          ['Total descontado', fmtBRL(r.totalDescontos)],
          ['Parte dos descontos que pagou juros do contrato', fmtBRL(r.jurosContrato)],
          ['Parte dos descontos que amortizou o empréstimo', fmtBRL(r.totalAmortizacao)],
          ...(r.totalSaques ? [['(+) Saques complementares', fmtBRL(r.totalSaques)]] : []),
          ['Saldo devedor final', fmtBRL(r.saldoFinal)],
          devedor
            ? ['Saldo devedor remanescente (a pagar pela parte Exequente)', fmtBRL(r.saldoDevedor)]
            : ['Valor a restituir à parte Exequente', fmtBRL(r.aRestituir)],
        ]} />
        <p style={{ margin: '4px 0 0', fontSize: '8.5pt', color: '#334155', lineHeight: 1.45 }}>
          O contrato de cartão de crédito consignado (RMC/RCC) foi recalculado como empréstimo consignado, a partir do valor
          efetivamente recebido. Em cada desconto, aplicam-se juros à taxa do contrato sobre o saldo devedor anterior; o restante
          do desconto amortiza o saldo, e os saques complementares somam-se a ele. Saldo negativo indica pagamento a maior, sobre
          o qual a mesma taxa continua a incidir em favor do consumidor.
        </p>

        <h2 style={S.h2}>Evolução do Saldo Devedor</h2>
        <table className="cj-deb">
          <thead><tr>{cols.map((h, i) => <th key={i} className={i >= 2 ? 'r' : ''}>{h}</th>)}</tr></thead>
          <tbody>
            {r.linhas.map(l => (
              <tr key={l.n}>
                <td>{l.n}</td>
                <td className="nw">{fmtData(l.data)}</td>
                <td className="r mono">{fmtBRL(l.valor)}</td>
                <td className="r mono">{fmtBRL(l.saldoAnterior)}</td>
                <td className="r mono">{fmtPct(l.taxa)}</td>
                <td className="r mono">{fmtBRL(l.juros)}</td>
                <td className="r mono">{fmtBRL(l.amortizacao)}</td>
                <td className="r mono">{fmtBRL(l.saque)}</td>
                <td className="r mono" style={{ fontWeight: 700 }}>{fmtBRL(l.saldo)}</td>
              </tr>
            ))}
            <tr className="tot">
              <td colSpan={2}>Totais</td>
              <td className="r mono">{fmtBRL(r.totalDescontos)}</td>
              <td></td><td></td>
              <td className="r mono">{fmtBRL(r.jurosContrato)}</td>
              <td className="r mono">{fmtBRL(r.totalAmortizacao)}</td>
              <td className="r mono">{fmtBRL(r.totalSaques)}</td>
              <td className="r mono">{fmtBRL(r.saldoFinal)}</td>
            </tr>
          </tbody>
        </table>
        <Foot geradoEm={geradoEm} />
      </section>
    </article>
  )
}

function KV({ rows }) {
  return (
    <table style={S.kv}><tbody>
      {rows.map(([l, v], i) => (
        <tr key={i}><td style={S.kvLabel}>{l}</td><td style={S.kvVal}>{v}</td></tr>
      ))}
    </tbody></table>
  )
}

export default function RelatorioCJ({ meta = {}, geradoEm, termoFinal, verba, resultado, compensacao, art523 }) {
  if (resultado.metodo === 'conversao') return <RelatorioConversao meta={meta} geradoEm={geradoEm} termoFinal={termoFinal} verba={verba} resultado={resultado} />
  const indiceNome = INDICE_NOME[verba.indice] || verba.indice
  const jurosLabel = LABEL_JUROS[verba.juros?.tipo] || 'Não aplicado'
  const jurosInicio = verba.juros?.dataInicio
  const principal = resultado.principalCorrigido
  const juros = resultado.totalJuros
  const subtotal = resultado.subtotal
  // Compensação (créditos) só vem para o relatório do dano material
  const cred = compensacao?.linhas?.length ? compensacao : null
  const compensado = cred?.compensado || 0
  const liquido = subtotal - compensado
  // Art. 523 (se marcado): 10% sobre o líquido desta verba. Só informativo — não entra no total salvo.
  const multa523 = art523?.multa ? liquido * 0.1 : 0
  const hon523 = art523?.honorarios ? liquido * 0.1 : 0
  const nomeCalculo = `Cálculo de Atualização de Débitos — ${TIPO_UP[verba.tipo] || 'VERBA'}`

  // Memória de cálculo — taxas explícitas (para o magistrado conferir a conta)
  const valorOriginal = resultado.linhas.reduce((a, l) => a + l.valor, 0)
  const correcaoValor = principal - valorOriginal
  const correcaoPct = valorOriginal ? (correcaoValor / valorOriginal) * 100 : 0
  const pctJuros = resultado.percentualJuros
  const datasParc = resultado.linhas.map(l => l.data).filter(Boolean).sort()
  const corrDe = datasParc[0]

  const opcoesJuros = [
    ['Juros de Mora', jurosLabel],
    ['Juros a partir de', jurosInicio ? fmtData(jurosInicio) : '—'],
    ['Aplicar juros de mora pro-rata die', 'Não'],
    ['Calcular os juros de mora sobre os juros compensatórios?', 'Não'],
    ['Calcular os juros de mora de forma capitalizada e mensal?', 'Não'],
    ['Tem juros Compensatórios/Remuneratórios?', 'Não'],
  ]

  function footnote(l) {
    const jt = verba.juros?.tipo
    const jdesc = (jt && jt !== 'nenhum')
      ? `Juros (${LABEL_JUROS[jt]}, ${fmtPct(l.percentualJuros)}, de ${fmtData(jurosInicio)} até ${fmtData(termoFinal)}), `
      : 'Juros (não aplicado), '
    return `${jdesc}Correção Monetária (${indiceNome}, ${fmtPct(l.percentualCorrecao)}, de ${fmtData(l.data)} até ${fmtData(termoFinal)}), Juros Compensatórios (não aplicado)`
  }

  return (
    <article className="cj-report">
      {/* ─────────── SHEET 1 ─────────── */}
      <section className="cj-sheet cj-break">
        <Cabecalho titulo="Cálculo de Atualização de Débitos" />

        <h2 style={S.h2}>Dados do Cliente</h2>
        <KV rows={[['Nome', meta.cliente || '—'], ['Processo nº', meta.processo || '—'], ['Parte executada', meta.executada || '—']]} />

        <h2 style={S.h2}>Dados do Cálculo</h2>
        <KV rows={[
          ['Nome do cálculo', nomeCalculo],
          ['Termo final', fmtData(termoFinal)],
          ['Índice de correção monetária', indiceNome],
        ]} />

        <h2 style={S.h2}>Resumo do Cálculo (memória)</h2>
        <KV rows={[
          verba.emDobro
            ? ['Soma dos descontos (valor simples)', fmtBRL(valorOriginal / 2)]
            : [verba.tipo === 'dano_material' ? 'Valor original (soma das parcelas)' : 'Valor arbitrado na sentença', fmtBRL(valorOriginal)],
          ...(verba.emDobro ? [['Restituição em dobro (art. 42, p. único, CDC)', `2×  →  ${fmtBRL(valorOriginal)}`]] : []),
          [`Correção monetária — ${verba.indice}${corrDe ? ` (de ${fmtData(corrDe)} a ${fmtData(termoFinal)})` : ''}`, `+ ${fmtPct(correcaoPct)}  →  ${fmtBRL(principal)}`],
          [`Juros de mora — ${jurosLabel}${jurosInicio && verba.juros?.tipo !== 'nenhum' ? ` (desde ${fmtData(jurosInicio)})` : ''}`, pctJuros > 0 ? `+ ${fmtPct(pctJuros)}  →  ${fmtBRL(juros)}` : 'Não aplicado'],
          ['Subtotal atualizado', fmtBRL(subtotal)],
        ]} />

        <h2 style={S.h2}>Opções do Cálculo</h2>
        <h3 style={S.h3}>Correção monetária</h3>
        <KV rows={OPCOES_CORRECAO} />
        <h3 style={S.h3}>Juros de Mora</h3>
        <KV rows={opcoesJuros} />
        <h3 style={S.h3}>Multa</h3>
        <KV rows={OPCOES_MULTA} />
        <Foot geradoEm={geradoEm} />
      </section>

      {/* ─────────── SHEET 2 ─────────── */}
      <section className="cj-sheet cj-break">
        <h2 style={S.h2}>Multa do Art. 523 do CPC</h2>
        <KV rows={[
          ['Aplicar multa moratória de 10%', art523?.multa ? 'Sim' : 'Não'],
          ['Aplicar multa de honorários advocatícios de 10%', art523?.honorarios ? 'Sim' : 'Não'],
          ...OPCOES_ART523,
        ]} />

        <h2 style={S.h2}>Resultado</h2>
        <KV rows={[['Total geral', fmtBRL(liquido)]]} />

        <h2 style={S.h2}>Totais</h2>
        <KV rows={[
          ['Principal', fmtBRL(subtotal)],
          ...(cred ? [['(−) Compensação (créditos)', '− ' + fmtBRL(compensado)]] : []),
          ['Honorários de Sucumbência', fmtBRL(0)],
          ['Subtotal', fmtBRL(liquido)],
          ['Honorários Contratuais', fmtBRL(0)],
          ['Valor Total Geral', fmtBRL(liquido)],
          ...(multa523 ? [['Multa do Art. 523, §1º, CPC (10%)', fmtBRL(multa523)]] : []),
          ...(hon523 ? [['Honorários do Art. 523, §1º, CPC (10%)', fmtBRL(hon523)]] : []),
          ...(multa523 || hon523 ? [['Total com o Art. 523 (se não houver pagamento voluntário)', fmtBRL(liquido + multa523 + hon523)]] : []),
        ]} />

        <h2 style={S.h2}>Débitos e Créditos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
          <thead>
            <tr>
              <th style={S.th}></th>
              <th style={{ ...S.th, textAlign: 'right' }}>Débitos</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Créditos</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Principal (Inicial + Correção)', principal, cred?.totalCorrigido || 0],
              ['Juros', juros, cred?.totalJuros || 0],
              ['Multa', 0, 0], ['Custas', 0, 0], ['Despesas', 0, 0],
            ].map(([l, v, c], i) => (
              <tr key={i}>
                <td style={S.td}>{l}</td>
                <td style={S.tdr} className="mono">{fmtBRL(v)}</td>
                <td style={S.tdr} className="mono">{fmtBRL(c)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
              <td style={S.td}>Totais (sem multas 523 e honorários)</td>
              <td style={S.tdr} className="mono">{fmtBRL(subtotal)}</td>
              <td style={S.tdr} className="mono">{fmtBRL(cred?.total || 0)}</td>
            </tr>
          </tbody>
        </table>
        <Foot geradoEm={geradoEm} />
      </section>

      {/* ─────────── SHEET 3 ─────────── */}
      <section className="cj-sheet cj-break">
        <h2 style={S.h2}>Débitos</h2>
        <table className="cj-deb">
          <colgroup>
            {[8, 11, 10, 11, 10, 12, 8, 10, 8, 12].map((w, i) => <col key={i} style={{ width: w + '%' }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="grp" colSpan={4}>Parcelas</th>
              <th className="grp" colSpan={2}>Correção monetária</th>
              <th className="grp" colSpan={2}>Juros de Mora</th>
              <th className="grp" colSpan={2}>Total</th>
            </tr>
            <tr>
              {['Tipo', 'Descrição', 'Data', 'Valor', 'Fator', 'Valor', 'Percentual', 'Valor', 'Multa', 'Valor Total'].map((h, i) => (
                <th key={i} className={i >= 3 ? 'r' : ''}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultado.linhas.map((l, i) => (
              <Fragment key={i}>
                <tr>
                  <td>Principal</td>
                  <td>{l.tipoLinha === 'Repetição de Indébito' ? 'Repetição de Indébito' : (verba.descricao || '—')}</td>
                  <td className="nw">{fmtData(l.data)}</td>
                  <td className="r mono">{fmtBRL(l.valor)}</td>
                  <td className="r mono">{fmtFator(l.fator)}<br /><span style={{ fontSize: '6.5pt', color: '#64748b' }}>{fmtPct(l.percentualCorrecao)}</span></td>
                  <td className="r mono">{fmtBRL(l.valorCorrigido)}</td>
                  <td className="r mono">{fmtPct(l.percentualJuros)}</td>
                  <td className="r mono">{fmtBRL(l.valorJuros)}</td>
                  <td className="r mono">{fmtBRL(0)}</td>
                  <td className="r mono" style={{ fontWeight: 700 }}>{fmtBRL(l.total)}</td>
                </tr>
                <tr>
                  <td className="foot" colSpan={10}>{footnote(l)}</td>
                </tr>
              </Fragment>
            ))}
            <tr className="tot">
              <td colSpan={4}>Total</td>
              <td></td>
              <td className="r mono">{fmtBRL(principal)}</td>
              <td></td>
              <td className="r mono">{fmtBRL(juros)}</td>
              <td className="r mono">{fmtBRL(0)}</td>
              <td className="r mono">{fmtBRL(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <h2 style={S.h2}>Créditos</h2>
        {!cred ? (
          <p style={{ fontSize: '9pt', color: '#64748b', margin: '4px 0' }}>Nenhuma parcela.</p>
        ) : (
          <>
            <table className="cj-deb">
              <thead>
                <tr>
                  {['Descrição', 'Data', 'Valor', 'Fator', 'Valor corrigido', 'Juros %', 'Juros', 'Total'].map((h, i) => (
                    <th key={i} className={i >= 2 ? 'r' : ''}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cred.linhas.map((l, i) => (
                  <tr key={i}>
                    <td>{l.descricao}</td>
                    <td className="nw">{fmtData(l.data)}</td>
                    <td className="r mono">{fmtBRL(l.valor)}</td>
                    <td className="r mono">{fmtFator(l.fator)}</td>
                    <td className="r mono">{fmtBRL(l.valorCorrigido)}</td>
                    <td className="r mono">{fmtPct(l.percentualJuros)}</td>
                    <td className="r mono">{fmtBRL(l.valorJuros)}</td>
                    <td className="r mono" style={{ fontWeight: 700 }}>{fmtBRL(l.total)}</td>
                  </tr>
                ))}
                <tr className="tot">
                  <td colSpan={4}>Total</td>
                  <td className="r mono">{fmtBRL(cred.totalCorrigido)}</td>
                  <td></td>
                  <td className="r mono">{fmtBRL(cred.totalJuros)}</td>
                  <td className="r mono">{fmtBRL(cred.total)}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '8.5pt', color: '#334155', margin: '6px 0 0', lineHeight: 1.45 }}>
              Compensação dos valores recebidos pela parte Exequente, corrigidos pelo mesmo índice e com os mesmos juros de mora
              do dano material, abatidos exclusivamente do dano material.
              {cred.naoCompensado > 0.005 && ` O valor excedente (${fmtBRL(cred.naoCompensado)}) não foi abatido, pois a compensação está limitada ao dano material.`}
            </p>
          </>
        )}
        <Foot geradoEm={geradoEm} />
      </section>

      {/* ─────────── SHEET 4 — Detalhes ─────────── */}
      <section className="cj-sheet">
        <h2 style={S.h2}>Detalhes do Cálculo</h2>
        {DETALHES_CALCULO.map((sec, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <h3 style={{ ...S.h3, color: '#0369a1' }}>{sec.titulo}</h3>
            {sec.paragrafos.map((p, j) => (
              <p key={j} style={{ margin: '0 0 4px', fontSize: '9pt', color: '#334155', lineHeight: 1.45 }}>{p}</p>
            ))}
          </div>
        ))}
        <p style={{ margin: '12px 0 0', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '9pt', color: '#0f172a', lineHeight: 1.45 }}>
          {DECLARACAO_TJDFT}
        </p>
        <Foot geradoEm={geradoEm} />
      </section>
    </article>
  )
}
