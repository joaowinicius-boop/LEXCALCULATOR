import { Fragment } from 'react'
import { Printer, FileText, Gavel, Download } from 'lucide-react'
import RelatorioCJ from '../components/RelatorioCJ.jsx'
import { imprimir, baixarWord, baixarWordHtml } from '../utils/exportar.js'
import { gerarCumprimentoHtml } from '../utils/cumprimento.js'

const TIPO_LABEL = {
  dano_moral: 'Danos Morais',
  dano_material: 'Danos Materiais',
  honorarios: 'Honorários',
  outro: 'Outra Verba',
}

function DocBanner({ n, total, title }) {
  return (
    <div className="doc-banner no-print">
      <span className="doc-pill">Documento {n} de {total}</span>
      <span className="doc-title">{title}</span>
    </div>
  )
}

export default function Relatorio({ relatorio }) {
  if (!relatorio) return null
  const { meta = {}, geradoEm, proc } = relatorio

  // Honorários não geram relatório próprio — entram na petição e nos totais.
  const reports = proc.resultados.filter(r => r.verba.tipo !== 'honorarios')
  const peticaoHtml = gerarCumprimentoHtml(meta, proc)
  const totalDocs = reports.length + 1
  const slug = (meta.processo || '').replace(/[^\d]/g, '') || 's-n'

  return (
    <div className="cj-doc" style={{ background: '#e2e8f0', minHeight: '100%' }}>
      {/* Painel de ações — não imprime */}
      <div className="no-print" style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={imprimir} style={{ height: 38, fontSize: 13 }}>
            <Printer size={14} /> Imprimir / Salvar PDF (todos)
          </button>
          <div style={{ width: 1, height: 26, background: '#cbd5e1', margin: '0 4px' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> Baixar Word:
          </span>
          <button className="btn-primary" onClick={() => baixarWordHtml(peticaoHtml, `Cumprimento_de_Sentenca_${slug}`)} style={{ height: 36, fontSize: 13, background: '#0369a1' }}>
            <Gavel size={14} /> Cumprimento de Sentença
          </button>
          {reports.map((item, i) => (
            <button key={i} className="btn-secondary" onClick={() => baixarWord(`rel-doc-${i}`, `Calculo_${TIPO_LABEL[item.verba.tipo] || 'verba'}_${slug}`)} style={{ fontSize: 13 }}>
              <FileText size={14} /> {TIPO_LABEL[item.verba.tipo]}
            </button>
          ))}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
          {totalDocs} documento(s): a petição de cumprimento + {reports.length} cálculo(s). Para PDF, use “Imprimir → Salvar como PDF”.
        </p>
      </div>

      {/* DOCUMENTO 1 — Petição de Cumprimento de Sentença */}
      <DocBanner n={1} total={totalDocs} title="Cumprimento de Sentença (petição)" />
      <div className="cj-report-wrap">
        <section className="cj-sheet peticao" dangerouslySetInnerHTML={{ __html: peticaoHtml }} />
      </div>

      {/* DOCUMENTOS 2..N — um cálculo CJ por verba */}
      {reports.map((item, i) => (
        <Fragment key={i}>
          <DocBanner n={i + 2} total={totalDocs} title={`Cálculo — ${TIPO_LABEL[item.verba.tipo]}`} />
          <div id={`rel-doc-${i}`} className="cj-report-wrap">
            <RelatorioCJ
              meta={meta}
              geradoEm={geradoEm}
              termoFinal={proc.termoFinal}
              verba={item.verba}
              resultado={item.resultado}
            />
          </div>
        </Fragment>
      ))}

      <style>{`
        .cj-sheet {
          background: #fff;
          width: 21cm;
          min-height: 29.7cm;
          margin: 8px auto 22px;
          padding: 1.5cm 1.7cm 2.2cm;
          box-shadow: 0 2px 14px rgba(0,0,0,.18);
          position: relative;
          box-sizing: border-box;
          color: #0f172a;
          font-family: 'Inter', Arial, sans-serif;
        }
        .doc-banner {
          width: 21cm; max-width: calc(100% - 16px);
          margin: 26px auto 0;
          display: flex; align-items: center; gap: 12px;
        }
        .doc-banner .doc-pill {
          background: #0f172a; color: #fff; font-size: 11px; font-weight: 700;
          letter-spacing: .5px; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;
        }
        .doc-banner .doc-title { font-size: 14px; font-weight: 700; color: #334155; }
        /* Petição (modelo Times, justificado) */
        .peticao { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.55; text-align: justify; color: #111; }
        .peticao p { margin: 0 0 10px; }
        .peticao .center { text-align: center; }
        .peticao .right { text-align: right; }
        .peticao .b { font-weight: bold; }
        .peticao .mono { font-variant-numeric: tabular-nums; }
        .peticao table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; }
        .peticao th, .peticao td { border: 1px solid #555; padding: 5px 8px; font-size: 10.5pt; }
        .peticao th { background: #eef2f7; }
        .cj-foot {
          position: absolute;
          left: 1.7cm; right: 1.7cm; bottom: 0.9cm;
          border-top: 1px solid #e2e8f0;
          padding-top: 5px;
          font-size: 7.5pt;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
        .mono { font-variant-numeric: tabular-nums; }
        .cj-deb { table-layout: fixed; width: 100%; border-collapse: collapse; }
        .cj-deb th, .cj-deb td {
          border: 1px solid #e2e8f0;
          padding: 3px 4px;
          font-size: 7.5pt;
          line-height: 1.25;
          vertical-align: top;
          word-break: break-word;
          overflow: hidden;
        }
        .cj-deb th { background: #eef4fa; color: #334155; font-weight: 600; border-color: #cbd5e1; }
        .cj-deb .grp { text-align: center; }
        .cj-deb .r { text-align: right; white-space: nowrap; }
        .cj-deb .nw { white-space: nowrap; }
        .cj-deb .foot { font-size: 7pt; color: #64748b; border-top: none; }
        .cj-deb .tot td { font-weight: 700; background: #eef4fa; border-color: #cbd5e1; }
        @media print {
          @page { size: A4; margin: 1.4cm; }
          .no-print { display: none !important; }
          .cj-doc { background: #fff !important; }
          aside, header, nav { display: none !important; }
          .cj-sheet {
            width: auto; min-height: 0; margin: 0; padding: 0 0 1.2cm;
            box-shadow: none;
          }
          .cj-break { page-break-after: always; }
          .cj-report-wrap { page-break-before: always; }
          .cj-report-wrap:first-of-type { page-break-before: avoid; }
          .cj-foot { position: static; margin-top: 14px; }
          tr, table { page-break-inside: auto; }
        }
      `}</style>
    </div>
  )
}
