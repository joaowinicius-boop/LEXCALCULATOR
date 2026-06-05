import { Printer, FileText } from 'lucide-react'
import RelatorioCJ from '../components/RelatorioCJ.jsx'
import { imprimir, baixarWord } from '../utils/exportar.js'

const TIPO_LABEL = {
  dano_moral: 'Danos Morais',
  dano_material: 'Danos Materiais',
  honorarios: 'Honorários',
  outro: 'Outra Verba',
}

export default function Relatorio({ relatorio }) {
  if (!relatorio) return null
  const { meta = {}, geradoEm, proc } = relatorio

  return (
    <div className="cj-doc" style={{ background: '#e2e8f0', minHeight: '100%' }}>
      {/* Ações — não imprimem */}
      <div className="no-print" style={{ display: 'flex', gap: '10px', padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 5, alignItems: 'center' }}>
        <button className="btn-primary" onClick={imprimir} style={{ height: 38, fontSize: 13 }}>
          <Printer size={14} /> Imprimir / Salvar PDF
        </button>
        {proc.resultados.map((item, i) => (
          <button key={i} className="btn-secondary" onClick={() => baixarWord(`rel-doc-${i}`, `Calculo_${TIPO_LABEL[item.verba.tipo] || 'verba'}_${meta.processo || ''}`)} style={{ fontSize: 13 }}>
            <FileText size={14} /> Word — {TIPO_LABEL[item.verba.tipo]}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {proc.resultados.length} relatório(s). Para PDF, use Imprimir → “Salvar como PDF”.
        </span>
      </div>

      {/* Um relatório CJ completo por verba */}
      {proc.resultados.map((item, i) => (
        <div id={`rel-doc-${i}`} key={i} className="cj-report-wrap">
          <RelatorioCJ
            meta={meta}
            geradoEm={geradoEm}
            termoFinal={proc.termoFinal}
            verba={item.verba}
            resultado={item.resultado}
          />
        </div>
      ))}

      <style>{`
        .cj-sheet {
          background: #fff;
          width: 21cm;
          min-height: 29.7cm;
          margin: 22px auto;
          padding: 1.5cm 1.7cm 2.2cm;
          box-shadow: 0 2px 14px rgba(0,0,0,.18);
          position: relative;
          box-sizing: border-box;
          color: #0f172a;
          font-family: 'Inter', Arial, sans-serif;
        }
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
