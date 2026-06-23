import { useState, useMemo } from 'react'
import {
  Upload, Loader2, X, Search, FileText, AlertCircle, Plus,
  CheckCircle2, ArrowRightLeft, FileSpreadsheet, Trash2,
} from 'lucide-react'
import { analisarExtratos } from '../utils/extrato.js'
import { exportarTabelaXlsx } from '../utils/planilha.js'
import { fmtBRL } from '../utils/calcularJuridico.js'

/**
 * HUB de leitura de extratos (motor LEX FINDER embutido) no Passo 1.
 * Fluxo: sobe os extratos novos da execução → o sistema detecta as cobranças
 * por rubrica → o advogado corrige a tabela (excluir falso positivo, mover de
 * rubrica, adicionar manual) → "Usar no cálculo" gera uma VERBA por rubrica
 * (cada lançamento vira uma parcela). Tudo no mesmo sistema, sem trocar de URL.
 */

const itemKey = (catId, it) => `${catId}|${it.data}|${it.valor}|${(it.historico || '').slice(0, 60)}`
const fmtDataBR = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '—')
}

export default function LerExtratosHub({ onUsar }) {
  const [files, setFiles] = useState([])
  const [fase, setFase] = useState('upload')     // upload | analisando | resultado | erro
  const [prog, setProg] = useState('')
  const [grupos, setGrupos] = useState([])
  const [meta, setMeta] = useState(null)
  const [naoSup, setNaoSup] = useState(null)
  const [erro, setErro] = useState('')

  // Edições ao vivo sobre o resultado do parser
  const [excludedKeys, setExcludedKeys] = useState(new Set())
  const [manualAdds, setManualAdds] = useState({})        // { [catId]: [{data,valor,historico}] }
  const [movingItem, setMovingItem] = useState(null)      // { catId, item }
  const [selectedCats, setSelectedCats] = useState(new Set())
  const [addForm, setAddForm] = useState({})              // { [catId]: {data,valor,historico} }

  async function analisar() {
    if (!files.length) return
    setFase('analisando'); setErro('')
    try {
      const { grupos, meta, naoSuportado } = await analisarExtratos(files, (p) => {
        if (p.etapa === 'classificando') setProg('Classificando cobranças…')
        else if (p.etapa === 'ocr') setProg(`Lendo (OCR) ${p.arquivo} — pág. ${p.page}/${p.totalPaginas}…`)
        else if (p.etapa === 'lendo') setProg(`Lendo ${p.arquivo}${p.page ? ` — pág. ${p.page}/${p.totalPaginas}` : ''}…`)
      })
      setGrupos(grupos); setMeta(meta); setNaoSup(naoSuportado)
      // pré-seleciona as rubricas reembolsáveis (não marca Invest Fácil e afins)
      setSelectedCats(new Set(grupos.filter(g => !g.naoReembolsavel).map(g => g.id)))
      setFase('resultado')
    } catch (e) {
      setErro(e.message || 'Falha ao analisar os extratos.'); setFase('erro')
    }
  }

  // finalGrupos: aplica exclusões + adições manuais sobre o resultado do parser
  const finalGrupos = useMemo(() => {
    return grupos.map(g => {
      const itens = g.items.filter(it => !excludedKeys.has(itemKey(g.id, it)))
      const manuais = (manualAdds[g.id] || []).map(m => ({ ...m, _manual: true }))
      const all = [...itens, ...manuais].sort((a, b) => String(a.data).localeCompare(String(b.data)))
      const total = Math.round(all.reduce((s, it) => s + (Number(it.valor) || 0), 0) * 100) / 100
      return { ...g, items: all, qtd: all.length, total }
    }).filter(g => g.qtd > 0)
  }, [grupos, excludedKeys, manualAdds])

  const selecionados = finalGrupos.filter(g => selectedCats.has(g.id))
  const totalGeral = Math.round(selecionados.reduce((s, g) => s + g.total, 0) * 100) / 100
  const qtdGeral = selecionados.reduce((s, g) => s + g.qtd, 0)

  function excludeItem(catId, it) {
    setExcludedKeys(prev => new Set(prev).add(itemKey(catId, it)))
  }
  function toggleCat(catId) {
    setSelectedCats(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })
  }
  function addManual(catId) {
    const f = addForm[catId] || {}
    const valor = parseFloat(String(f.valor).replace(',', '.'))
    if (!f.data || !(valor > 0)) return
    setManualAdds(prev => ({ ...prev, [catId]: [...(prev[catId] || []), { data: f.data, valor: Math.round(valor * 100) / 100, historico: (f.historico || '').trim() || 'Lançamento manual' }] }))
    setAddForm(prev => ({ ...prev, [catId]: { data: '', valor: '', historico: '' } }))
  }
  function moveItem(toCatId) {
    if (!movingItem) return
    const { catId, item } = movingItem
    // remove da origem (exclusão) e adiciona como manual no destino
    setExcludedKeys(prev => new Set(prev).add(itemKey(catId, item)))
    setManualAdds(prev => ({ ...prev, [toCatId]: [...(prev[toCatId] || []), { data: item.data, valor: item.valor, historico: item.historico } ] }))
    setSelectedCats(prev => new Set(prev).add(toCatId))
    setMovingItem(null)
  }

  function exportarConsolidado() {
    try {
      const parcelas = selecionados.flatMap(g => g.items.map(it => ({ data: it.data, valor: it.valor, descricao: `[${g.label}] ${it.historico || ''}`.trim() })))
      if (!parcelas.length) { alert('Selecione ao menos uma rubrica com lançamentos.'); return }
      exportarTabelaXlsx(parcelas, { nomeArquivo: `TABELA CONSOLIDADA DE DESCONTOS${meta?.cliente ? ' - ' + meta.cliente : ''}`.toUpperCase() })
    } catch (e) {
      alert('Falha ao exportar a planilha: ' + (e?.message || e))
    }
  }

  function usar() {
    if (!selecionados.length) { alert('Selecione ao menos uma rubrica.'); return }
    onUsar(selecionados.map(g => ({
      id: g.id, label: g.label, fundamento: g.fundamento, naoReembolsavel: g.naoReembolsavel,
      items: g.items.map(it => ({ data: it.data, valor: it.valor, historico: it.historico })),
    })), meta)
  }

  const card = { background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: 10 }

  // ─── UPLOAD ──────────────────────────────────────────────────────────────
  if (fase === 'upload' || fase === 'analisando') {
    return (
      <div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
          Suba os extratos bancários novos (PDF) do período do processo. O sistema detecta as cobranças indevidas por rubrica — você confere/corrige a tabela e cada rubrica vira uma verba do cálculo. Bancos: Bradesco, Itaú, Santander, Agibank.
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 28, border: '2px dashed hsl(var(--border))', borderRadius: 12, cursor: 'pointer', background: 'hsl(var(--secondary))', textAlign: 'center' }}>
          <Upload size={26} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Selecionar extratos (PDF)</span>
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Vários arquivos · escaneados são lidos por OCR</span>
          <input type="file" multiple accept=".pdf,image/*" style={{ display: 'none' }}
            onChange={e => { setFiles([...files, ...Array.from(e.target.files || [])]); e.target.value = '' }} />
        </label>
        {files.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map((f, i) => (
              <div key={i} style={{ ...card, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={14} color="hsl(var(--primary))" />{f.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({(f.size / 1024).toFixed(0)} KB)</span></span>
                {fase === 'upload' && <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={12} /></button>}
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={analisar} disabled={!files.length || fase === 'analisando'}
          style={{ marginTop: 16, width: '100%', justifyContent: 'center', height: 44, opacity: (!files.length || fase === 'analisando') ? 0.5 : 1 }}>
          {fase === 'analisando' ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {prog || 'Analisando…'}</> : <><Search size={15} /> Analisar extratos</>}
        </button>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
          Extrato escaneado é lido por OCR (pode levar alguns minutos). Confira sempre os lançamentos detectados antes de usar.
        </p>
      </div>
    )
  }

  // ─── ERRO ────────────────────────────────────────────────────────────────
  if (fase === 'erro') {
    return (
      <div>
        <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, color: 'var(--error)', fontSize: 13, display: 'flex', gap: 8 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{erro}
        </div>
        <button className="btn-secondary" style={{ marginTop: 14 }} onClick={() => setFase('upload')}>Voltar</button>
      </div>
    )
  }

  // ─── RESULTADO (tabela editável) ──────────────────────────────────────────
  return (
    <div>
      {naoSup && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}>
          ⚠️ Banco "{naoSup}" não suportado em algum arquivo (suportados: Bradesco, Itaú, Santander, Agibank).
        </div>
      )}

      {/* Resumo */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{meta?.cliente ? `Titular: ${meta.cliente}` : 'Tabela consolidada de descontos'}</div>
          <div style={{ fontSize: 13, marginTop: 2 }}>{selecionados.length} rubrica(s) · {qtdGeral} lançamento(s) selecionado(s)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Total selecionado</div>
          <strong className="mono" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>{fmtBRL(totalGeral)}</strong>
        </div>
      </div>

      {finalGrupos.length === 0 ? (
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Nenhuma cobrança indevida detectada nos extratos enviados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {finalGrupos.map(g => {
            const sel = selectedCats.has(g.id)
            const f = addForm[g.id] || {}
            return (
              <div key={g.id} style={{ ...card, padding: '12px 14px', borderColor: sel ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleCat(g.id)} disabled={g.naoReembolsavel} style={{ accentColor: 'hsl(var(--primary))', width: 16, height: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{g.label}{g.naoReembolsavel ? ' ⚠️ (não reembolsável)' : ''}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{g.qtd} lançamento(s) · {g.fundamento}</div>
                  </div>
                  <strong className="mono" style={{ fontSize: 14, color: 'hsl(var(--primary))' }}>{fmtBRL(g.total)}</strong>
                </div>

                {/* lançamentos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {g.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '4px 8px', background: 'hsl(var(--background))', borderRadius: 6 }}>
                      <span className="mono" style={{ width: 78, color: 'hsl(var(--muted-foreground))' }}>{fmtDataBR(it.data)}</span>
                      <span className="mono" style={{ width: 92, fontWeight: 600 }}>{fmtBRL(it.valor)}</span>
                      <span style={{ flex: 1, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.historico}{it._manual && <span style={{ marginLeft: 6, color: 'hsl(var(--primary))', fontWeight: 600 }}>+ manual</span>}
                      </span>
                      <button title="Mover para outra rubrica" onClick={() => setMovingItem({ catId: g.id, item: it })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 2 }}><ArrowRightLeft size={13} /></button>
                      <button title="Excluir (falso positivo)" onClick={() => excludeItem(g.id, it)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>

                {/* adicionar manual */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="date" value={f.data || ''} onChange={e => setAddForm(p => ({ ...p, [g.id]: { ...f, data: e.target.value } }))} className="input-lex" style={{ width: 150, padding: '5px 8px', fontSize: 12 }} />
                  <input placeholder="Valor" value={f.valor || ''} onChange={e => setAddForm(p => ({ ...p, [g.id]: { ...f, valor: e.target.value } }))} className="input-lex mono" style={{ width: 90, padding: '5px 8px', fontSize: 12 }} />
                  <input placeholder="Histórico (opcional)" value={f.historico || ''} onChange={e => setAddForm(p => ({ ...p, [g.id]: { ...f, historico: e.target.value } }))} className="input-lex" style={{ flex: 1, minWidth: 120, padding: '5px 8px', fontSize: 12 }} />
                  <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => addManual(g.id)}><Plus size={12} /> Adicionar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={exportarConsolidado} disabled={!selecionados.length} style={{ opacity: selecionados.length ? 1 : 0.5 }}>
          <FileSpreadsheet size={15} /> Exportar tabela (XLSX)
        </button>
        <button className="btn-primary" onClick={usar} disabled={!selecionados.length} style={{ flex: 1, justifyContent: 'center', minWidth: 240, opacity: selecionados.length ? 1 : 0.5 }}>
          <CheckCircle2 size={15} /> Usar {selecionados.length} rubrica(s) no cálculo — {fmtBRL(totalGeral)}
        </button>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
        Cada rubrica selecionada vira uma verba (dano material), com os lançamentos como parcelas. Você ainda revisa tudo no Passo 3 antes de calcular.
      </p>

      {/* Modal mover */}
      {movingItem && (
        <div onClick={() => setMovingItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 420, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Mover para qual rubrica?</strong>
              <button onClick={() => setMovingItem(null)} className="btn-secondary" style={{ padding: '4px 8px' }}><X size={14} /></button>
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>{fmtDataBR(movingItem.item.data)} · {fmtBRL(movingItem.item.valor)} · {movingItem.item.historico}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {finalGrupos.filter(g => g.id !== movingItem.catId).map(g => (
                <button key={g.id} className="btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => moveItem(g.id)}>{g.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
