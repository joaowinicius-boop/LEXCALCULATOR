import { Printer, FileText, Download, Scale } from 'lucide-react'
import { fmtBRL, fmtFator, fmtPct, fmtData, INDICE_NOME } from '../utils/calcularJuridico.js'
import { imprimir, baixarWord } from '../utils/exportar.js'

const TIPO_LABEL = {
  dano_moral: 'Danos Morais',
  dano_material: 'Danos Materiais',
  honorarios: 'Honorários Sucumbenciais',
  outro: 'Outra Verba',
}

const JUROS_LABEL = {
  fixo_1: 'Juros de mora fixos de 1% ao mês',
  taxa_legal: 'Juros de mora à taxa legal (SELIC − IPCA, Lei 14.905/2024)',
  selic: 'Juros pela taxa SELIC',
  nenhum: 'Sem juros de mora',
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '4px 8px', color: '#475569', fontWeight: 500, width: '38%', borderBottom: '1px solid #e2e8f0' }}>{label}</td>
      <td style={{ padding: '4px 8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>{value}</td>
    </tr>
  )
}

function VerbaTabela({ item }) {
  const { verba, resultado } = item
  return (
    <div style={{ marginBottom: '22px' }} className="verba-block">
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
        {TIPO_LABEL[verba.tipo] || verba.descricao || 'Verba'}
        {verba.emDobro && <span style={{ marginLeft: 8, fontSize: 11, color: '#b45309' }}>(repetição do indébito — em dobro)</span>}
      </h3>
      <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748b' }}>
        Correção: {INDICE_NOME[verba.indice] || verba.indice} · {JUROS_LABEL[verba.juros?.tipo] || ''}
        {verba.juros?.dataInicio ? ` (a partir de ${fmtData(verba.juros.dataInicio)})` : ''}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            {['Tipo', 'Data', 'Valor', 'Fator', 'Valor corrigido', '% Juros', 'Juros', 'Total'].map((h, i) => (
              <th key={h} style={{ border: '1px solid #cbd5e1', padding: '5px 7px', textAlign: i > 1 ? 'right' : 'left', color: '#334155', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultado.linhas.map((l, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', color: '#64748b' }}>{l.tipoLinha}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px' }}>{fmtData(l.data)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right' }} className="mono">{fmtBRL(l.valor)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right' }} className="mono">{fmtFator(l.fator)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right' }} className="mono">{fmtBRL(l.valorCorrigido)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right' }} className="mono">{fmtPct(l.percentualJuros)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right' }} className="mono">{fmtBRL(l.valorJuros)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '4px 7px', textAlign: 'right', fontWeight: 600 }} className="mono">{fmtBRL(l.total)}</td>
            </tr>
          ))}
          <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
            <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '5px 7px' }}>Subtotal</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '5px 7px', textAlign: 'right' }} className="mono">{fmtBRL(resultado.principalCorrigido)}</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '5px 7px' }} />
            <td style={{ border: '1px solid #cbd5e1', padding: '5px 7px', textAlign: 'right' }} className="mono">{fmtBRL(resultado.totalJuros)}</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '5px 7px', textAlign: 'right' }} className="mono">{fmtBRL(resultado.subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function Relatorio({ relatorio }) {
  if (!relatorio) return null
  const { meta = {}, geradoEm, proc } = relatorio

  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      {/* Ações — não imprimem */}
      <div className="no-print" style={{ display: 'flex', gap: '10px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 5 }}>
        <button className="btn-primary" onClick={imprimir} style={{ height: 38, fontSize: 13 }}>
          <Printer size={14} /> Imprimir / Salvar PDF
        </button>
        <button className="btn-secondary" onClick={() => baixarWord('relatorio-print', `Calculo_${meta.processo || 'atualizacao'}`)} style={{ fontSize: 13 }}>
          <FileText size={14} /> Baixar Word (.doc)
        </button>
        <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>
          Para PDF: clique em Imprimir e escolha “Salvar como PDF”.
        </span>
      </div>

      {/* Documento imprimível */}
      <div id="relatorio-print" style={{ maxWidth: '820px', margin: '0 auto', padding: '28px 32px', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }}>
        {/* Cabeçalho com marca */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0ea5e9', paddingBottom: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>LEX CALCULATOR</p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Nicolas Gomes Sociedade Individual de Advocacia</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>Cálculo de Atualização de Débitos</p>
            <p style={{ margin: 0 }}>Relatório gerado em {geradoEm}</p>
          </div>
        </div>

        {/* Dados do Cliente / Cálculo */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', margin: '0 0 6px' }}>Dados do Cálculo</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, fontSize: 12 }}>
          <tbody>
            <Row label="Cliente (exequente)" value={meta.cliente || '—'} />
            <Row label="Processo nº" value={meta.processo || '—'} />
            <Row label="Parte executada" value={meta.executada || '—'} />
            {meta.vara && <Row label="Vara / Juízo" value={meta.vara} />}
            <Row label="Termo final (data do cálculo)" value={fmtData(proc.termoFinal)} />
          </tbody>
        </table>

        {/* Resultado / Totais */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', margin: '0 0 6px' }}>Resultado</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 22, fontSize: 12 }}>
          <tbody>
            <Row label="Principal corrigido" value={<span className="mono">{fmtBRL(proc.principal)}</span>} />
            <Row label="Juros de mora" value={<span className="mono">{fmtBRL(proc.juros)}</span>} />
            {proc.honorariosPercentual > 0 && (
              <Row label={`Honorários de sucumbência (${fmtPct(proc.honorariosPercentual)})`} value={<span className="mono">{fmtBRL(proc.honorarios)}</span>} />
            )}
            <tr style={{ background: '#ecfeff' }}>
              <td style={{ padding: '8px', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #0ea5e9' }}>TOTAL GERAL ATUALIZADO</td>
              <td style={{ padding: '8px', fontWeight: 800, color: '#0369a1', fontSize: 16, borderTop: '2px solid #0ea5e9' }} className="mono">{fmtBRL(proc.totalGeral)}</td>
            </tr>
          </tbody>
        </table>

        {/* Detalhamento por verba */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', margin: '0 0 10px' }}>Débitos — Detalhamento das Parcelas</h2>
        {proc.resultados.map((item, i) => <VerbaTabela key={i} item={item} />)}

        {/* Metodologia */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 10.5, color: '#64748b', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#475569' }}>Metodologia</p>
          <p style={{ margin: 0 }}>
            Correção monetária pelo fator acumulado do índice oficial (IBGE/Banco Central), do mês do desconto
            até o último mês fechado antes do termo final. Juros de mora conforme determinação da sentença/acórdão.
            Nos casos de repetição do indébito (em dobro), cada parcela é computada em duplicidade. Índices obtidos
            das séries oficiais do Banco Central (SGS).
          </p>
        </div>
      </div>

      {/* CSS de impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #relatorio-print { max-width: 100% !important; padding: 0 !important; }
          .verba-block { page-break-inside: avoid; }
          aside, header, nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
