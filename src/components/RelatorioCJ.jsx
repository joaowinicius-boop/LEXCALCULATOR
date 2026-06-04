import { Fragment } from 'react'
import { Scale } from 'lucide-react'
import { fmtBRL, fmtFator, fmtPct, fmtData, INDICE_NOME } from '../utils/calcularJuridico.js'
import {
  LABEL_JUROS, OPCOES_CORRECAO, OPCOES_MULTA, OPCOES_ART523, DETALHES_CALCULO,
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

function KV({ rows }) {
  return (
    <table style={S.kv}><tbody>
      {rows.map(([l, v], i) => (
        <tr key={i}><td style={S.kvLabel}>{l}</td><td style={S.kvVal}>{v}</td></tr>
      ))}
    </tbody></table>
  )
}

export default function RelatorioCJ({ meta = {}, geradoEm, termoFinal, verba, resultado }) {
  const indiceNome = INDICE_NOME[verba.indice] || verba.indice
  const jurosLabel = LABEL_JUROS[verba.juros?.tipo] || 'Não aplicado'
  const jurosInicio = verba.juros?.dataInicio
  const principal = resultado.principalCorrigido
  const juros = resultado.totalJuros
  const subtotal = resultado.subtotal
  const nomeCalculo = `Cálculo de Atualização de Débitos — ${TIPO_UP[verba.tipo] || 'VERBA'}`

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
      ? `Juros (${LABEL_JUROS[jt]}, de ${fmtData(jurosInicio)} até ${fmtData(termoFinal)}), `
      : 'Juros (não aplicado), '
    return `${jdesc}Correção Monetária (${indiceNome}, de ${fmtData(l.data)} até ${fmtData(termoFinal)}), Juros Compensatórios (não aplicado)`
  }

  return (
    <article className="cj-report">
      {/* ─────────── SHEET 1 ─────────── */}
      <section className="cj-sheet cj-break">
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
          <p style={{ margin: 0, fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>Cálculo de Atualização de Débitos</p>
        </div>

        <h2 style={S.h2}>Dados do Cliente</h2>
        <KV rows={[['Nome', meta.cliente || '—'], ['Processo nº', meta.processo || '—'], ['Parte executada', meta.executada || '—']]} />

        <h2 style={S.h2}>Dados do Cálculo</h2>
        <KV rows={[
          ['Nome do cálculo', nomeCalculo],
          ['Termo final', fmtData(termoFinal)],
          ['Índice de correção monetária', indiceNome],
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
        <KV rows={OPCOES_ART523} />

        <h2 style={S.h2}>Resultado</h2>
        <KV rows={[['Total geral', fmtBRL(subtotal)]]} />

        <h2 style={S.h2}>Totais</h2>
        <KV rows={[
          ['Principal', fmtBRL(subtotal)],
          ['Honorários de Sucumbência', fmtBRL(0)],
          ['Subtotal', fmtBRL(subtotal)],
          ['Honorários Contratuais', fmtBRL(0)],
          ['Valor Total Geral', fmtBRL(subtotal)],
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
              ['Principal (Inicial + Correção)', principal],
              ['Juros', juros],
              ['Multa', 0], ['Custas', 0], ['Despesas', 0],
            ].map(([l, v], i) => (
              <tr key={i}>
                <td style={S.td}>{l}</td>
                <td style={S.tdr} className="mono">{fmtBRL(v)}</td>
                <td style={S.tdr} className="mono">{fmtBRL(0)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
              <td style={S.td}>Totais (sem multas 523 e honorários)</td>
              <td style={S.tdr} className="mono">{fmtBRL(subtotal)}</td>
              <td style={S.tdr} className="mono">{fmtBRL(0)}</td>
            </tr>
          </tbody>
        </table>
        <Foot geradoEm={geradoEm} />
      </section>

      {/* ─────────── SHEET 3 ─────────── */}
      <section className="cj-sheet cj-break">
        <h2 style={S.h2}>Débitos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th} colSpan={4}>Parcelas</th>
              <th style={S.th} colSpan={2}>Correção monetária</th>
              <th style={S.th} colSpan={2}>Juros de Mora</th>
              <th style={S.th} colSpan={2}>Total</th>
            </tr>
            <tr>
              {['Tipo', 'Descrição', 'Data', 'Valor', 'Fator', 'Valor', 'Percentual', 'Valor', 'Multa', 'Valor Total'].map((h, i) => (
                <th key={i} style={{ ...S.th, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultado.linhas.map((l, i) => (
              <Fragment key={i}>
                <tr>
                  <td style={S.td}>Principal</td>
                  <td style={S.td}>{l.tipoLinha === 'Repetição de Indébito' ? 'Repetição de Indébito' : (verba.descricao || '—')}</td>
                  <td style={S.td}>{fmtData(l.data)}</td>
                  <td style={S.tdr} className="mono">{fmtBRL(l.valor)}</td>
                  <td style={S.tdr} className="mono">{fmtFator(l.fator)}</td>
                  <td style={S.tdr} className="mono">{fmtBRL(l.valorCorrigido)}</td>
                  <td style={S.tdr} className="mono">{fmtPct(l.percentualJuros)}</td>
                  <td style={S.tdr} className="mono">{fmtBRL(l.valorJuros)}</td>
                  <td style={S.tdr} className="mono">{fmtBRL(0)}</td>
                  <td style={{ ...S.tdr, fontWeight: 700 }} className="mono">{fmtBRL(l.total)}</td>
                </tr>
                <tr>
                  <td colSpan={10} style={{ ...S.td, fontSize: '7.5pt', color: '#64748b', borderTop: 'none' }}>{footnote(l)}</td>
                </tr>
              </Fragment>
            ))}
            <tr style={{ fontWeight: 700, background: '#eef4fa' }}>
              <td style={S.td} colSpan={4}>Total</td>
              <td style={S.td}></td>
              <td style={S.tdr} className="mono">{fmtBRL(principal)}</td>
              <td style={S.td}></td>
              <td style={S.tdr} className="mono">{fmtBRL(juros)}</td>
              <td style={S.tdr} className="mono">{fmtBRL(0)}</td>
              <td style={S.tdr} className="mono">{fmtBRL(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <h2 style={S.h2}>Créditos</h2>
        <p style={{ fontSize: '9pt', color: '#64748b', margin: '4px 0' }}>Nenhuma parcela.</p>
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
        <Foot geradoEm={geradoEm} />
      </section>
    </article>
  )
}
