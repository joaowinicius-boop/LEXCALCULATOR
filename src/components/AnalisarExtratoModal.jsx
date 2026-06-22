import { useState } from 'react'
import { Upload, Loader2, X, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { analisarExtratos } from '../utils/extrato.js'
import { fmtBRL } from '../utils/calcularJuridico.js'

/**
 * Modal de análise de extrato EMBUTIDO (motor LEX FINDER vendorizado).
 * O advogado sobe os extratos novos da execução, o sistema detecta as cobranças
 * por rubrica, ele escolhe a rubrica condenada e os descontos são devolvidos via
 * onUsar(items) para somar à verba — tudo no mesmo sistema, sem trocar de URL.
 */
export default function AnalisarExtratoModal({ descricaoVerba = '', onUsar, onClose }) {
  const [files, setFiles] = useState([])
  const [fase, setFase] = useState('upload')   // upload | analisando | resultado | erro
  const [prog, setProg] = useState('')
  const [grupos, setGrupos] = useState([])
  const [sel, setSel] = useState(null)         // id do grupo selecionado
  const [erro, setErro] = useState('')
  const [naoSup, setNaoSup] = useState(null)

  async function analisar() {
    if (!files.length) return
    setFase('analisando'); setErro('')
    try {
      const { grupos, naoSuportado } = await analisarExtratos(files, (p) => {
        if (p.etapa === 'classificando') setProg('Classificando cobranças…')
        else if (p.etapa === 'ocr') setProg(`Lendo (OCR) ${p.arquivo} — pág. ${p.page}/${p.totalPaginas}…`)
        else if (p.etapa === 'lendo') setProg(`Lendo ${p.arquivo}${p.page ? ` — pág. ${p.page}/${p.totalPaginas}` : ''}…`)
      })
      setNaoSup(naoSuportado)
      setGrupos(grupos)
      // pré-seleciona a rubrica que combina com a descrição da verba (ex.: "BX.ANT.FINAN")
      const alvo = descricaoVerba.toLowerCase()
      const pre = grupos.find(g => alvo && (g.label.toLowerCase().includes(alvo) || alvo.includes(g.id)))
      setSel(pre?.id || grupos[0]?.id || null)
      setFase('resultado')
    } catch (e) {
      setErro(e.message || 'Falha ao analisar o extrato.'); setFase('erro')
    }
  }

  const grupoSel = grupos.find(g => g.id === sel)

  const card = { background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: 10, padding: '10px 12px' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} color="hsl(199 89% 55%)" />
            <strong style={{ fontSize: 14 }}>Analisar extrato — detectar descontos</strong>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 8px' }}><X size={14} /></button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto' }}>
          {fase === 'upload' && (
            <>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                Suba os extratos bancários novos (PDF) do período do processo. O sistema detecta as cobranças por rubrica — você escolhe a condenada e os descontos somam à verba.
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24, border: '2px dashed hsl(var(--border))', borderRadius: 12, cursor: 'pointer', background: 'hsl(var(--secondary))', textAlign: 'center' }}>
                <Upload size={24} style={{ color: 'hsl(var(--primary))' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Selecionar extratos (PDF)</span>
                <input type="file" multiple accept=".pdf,image/*" style={{ display: 'none' }}
                  onChange={e => { setFiles([...files, ...Array.from(e.target.files || [])]); e.target.value = '' }} />
              </label>
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span>{f.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({(f.size / 1024).toFixed(0)} KB)</span></span>
                      <button className="btn-danger" style={{ padding: '2px 6px' }} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-primary" onClick={analisar} disabled={!files.length} style={{ marginTop: 16, width: '100%', justifyContent: 'center', height: 42, opacity: files.length ? 1 : 0.5 }}>
                <Search size={15} /> Analisar
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                Extrato escaneado é lido por OCR (pode levar alguns minutos). Confira sempre os lançamentos detectados.
              </p>
            </>
          )}

          {fase === 'analisando' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} />
              <p style={{ marginTop: 12, fontSize: 13, color: 'hsl(var(--foreground))' }}>{prog || 'Analisando…'}</p>
            </div>
          )}

          {fase === 'erro' && (
            <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, color: 'var(--error)', fontSize: 13, display: 'flex', gap: 8 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{erro}
            </div>
          )}

          {fase === 'resultado' && (
            <>
              {naoSup && (
                <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}>
                  ⚠️ Banco "{naoSup}" não suportado em algum arquivo (suportados: Bradesco, Itaú, Santander, Agibank).
                </div>
              )}
              {grupos.length === 0 ? (
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Nenhuma cobrança indevida detectada nos extratos enviados.</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Selecione a rubrica condenada:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {grupos.map(g => (
                      <label key={g.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderColor: sel === g.id ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                        <input type="radio" name="rubrica" checked={sel === g.id} onChange={() => setSel(g.id)} style={{ accentColor: 'hsl(var(--primary))' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{g.label}{g.naoReembolsavel ? ' ⚠️ (não reembolsável)' : ''}</div>
                          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{g.qtd} lançamento(s) · {g.fundamento}</div>
                        </div>
                        <strong className="mono" style={{ fontSize: 13, color: 'hsl(var(--primary))' }}>{fmtBRL(g.total)}</strong>
                      </label>
                    ))}
                  </div>
                  {grupoSel && (
                    <button className="btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center', height: 42 }}
                      disabled={grupoSel.naoReembolsavel}
                      onClick={() => { onUsar(grupoSel.items.map(it => ({ data: it.data, valor: it.valor, descricao: it.historico }))); onClose() }}>
                      <CheckCircle2 size={15} /> Somar {grupoSel.qtd} desconto(s) — {fmtBRL(grupoSel.total)} à verba
                    </button>
                  )}
                  <p style={{ margin: '10px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                    Os descontos somam aos já lançados (sem duplicar). Confira a lista antes de gerar o cálculo.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
