import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Check,
  FileText, Scale, Info, AlertCircle, Loader2, Sparkles, CheckCircle2, XCircle,
  Upload, Bot, PencilLine, X,
} from 'lucide-react'
import { extrairDoDispositivo } from '../utils/extrair.js'
import { extrairDocumentos, fileToBase64 } from '../lib/extrairDoc.js'
import { parsePlanilha, isPlanilha } from '../utils/planilha.js'
import { carregarSeries } from '../lib/indices.js'
import { calcularProcesso, fmtBRL, fmtData } from '../utils/calcularJuridico.js'
import { useCalculos } from '../hooks/useCalculos.js'
import Relatorio from './Relatorio.jsx'

let _id = 1
const uid = () => String(_id++)

const TIPO_VERBA = {
  dano_moral: 'Dano Moral',
  dano_material: 'Dano Material',
  honorarios: 'Honorários Sucumbenciais',
  outro: 'Outra Verba',
}
const JUROS_OPCOES = [
  { v: 'fixo_1', l: 'Juros de mora — 1% ao mês (fixo)' },
  { v: 'taxa_legal', l: 'Taxa legal — SELIC − IPCA (Lei 14.905/2024)' },
  { v: 'selic', l: 'SELIC (já engloba correção)' },
  { v: 'nenhum', l: 'Sem juros de mora' },
]

// ─── Helpers visuais ─────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'hsl(var(--primary))' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{hint}</p>}
    </div>
  )
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: '16px' }}>{children}</div>
}
function Steps({ current }) {
  const steps = [{ n: 1, label: 'Processo' }, { n: 2, label: 'Decisão' }, { n: 3, label: 'Verbas' }, { n: 4, label: 'Relatórios' }]
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div className={`step-dot ${s.n < current ? 'done' : s.n === current ? 'active' : 'pending'}`}>
              {s.n < current ? <Check size={13} /> : s.n}
            </div>
            <span style={{ fontSize: '11px', fontWeight: s.n === current ? 600 : 400, color: s.n === current ? 'hsl(var(--primary))' : s.n < current ? 'var(--success)' : 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: '1px', background: s.n < current ? 'var(--success-border)' : 'hsl(var(--border))', margin: '0 8px', marginBottom: '14px' }} />}
        </div>
      ))}
    </div>
  )
}
function Section({ badge, eyebrow, title, desc }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        {badge && <div style={{ width: '28px', height: '28px', background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>{badge}</span></div>}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{title}</h2>
      {desc && <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>{desc}</p>}
      <div style={{ height: '1px', background: 'hsl(var(--border))', marginTop: '12px' }} />
    </div>
  )
}

// ─── Editor de parcelas (descontos) ───────────────────────────────────────────
function ParcelaEditor({ parcelas, onChange }) {
  const add = () => onChange([...parcelas, { id: uid(), data: '', valor: '' }])
  const upd = (id, k, val) => onChange(parcelas.map(p => p.id === id ? { ...p, [k]: val } : p))
  const rm = (id) => onChange(parcelas.filter(p => p.id !== id))
  const total = parcelas.reduce((a, p) => a + (parseFloat(String(p.valor).replace(',', '.')) || 0), 0)

  return (
    <div style={{ marginTop: '12px' }}>
      <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
        Parcelas / descontos <span style={{ color: 'hsl(var(--primary))' }}>*</span>
        <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}> — cada desconto é corrigido a partir da sua data</span>
      </p>
      {parcelas.map((p) => (
        <div key={p.id} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
          <input type="date" className="input-lex" value={p.data} onChange={e => upd(p.id, 'data', e.target.value)} style={{ flex: '0 0 170px' }} />
          <input type="number" step="0.01" min="0" className="input-lex mono" placeholder="Valor (R$)" value={p.valor} onChange={e => upd(p.id, 'valor', e.target.value)} style={{ flex: 1 }} />
          <button className="btn-danger" onClick={() => rm(p.id)} title="Remover parcela"><Trash2 size={12} /></button>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <button className="btn-secondary" onClick={add} style={{ fontSize: '12px', padding: '6px 12px' }}><Plus size={13} /> Adicionar parcela</button>
        {parcelas.length > 0 && <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Soma das parcelas: <strong className="mono">{fmtBRL(total)}</strong></span>}
      </div>
    </div>
  )
}

// ─── Formulário de uma verba ──────────────────────────────────────────────────
function VerbaForm({ verba, onChange, onRemove }) {
  const upd = (k, v) => onChange({ ...verba, [k]: v })
  const isMaterial = isMaterialTipo(verba.tipo)
  const [impErr, setImpErr] = useState('')

  async function importarPlanilha(file) {
    if (!file) return
    setImpErr('')
    try {
      const r = await parsePlanilha(file)
      if (!r.parcelas.length) { setImpErr('Não encontrei descontos nessa planilha. Confira o arquivo.'); return }
      onChange({
        ...verba,
        parcelas: r.parcelas.map(pc => ({ id: uid(), data: pc.data, valor: pc.valor })),
        totalDeclarado: r.totalSimples,
        emDobro: verba.emDobro || r.emDobro,
        periodoInicio: '', periodoFim: '', fonte: 'planilha',
      })
    } catch (e) { setImpErr('Erro ao ler a planilha: ' + e.message) }
  }

  // Conferência da soma (Súmula 43): soma das parcelas vs total informado na inicial — só material
  const nump = (x) => parseFloat(String(x ?? '').replace(',', '.')) || 0
  const somaParcelas = (verba.parcelas || []).reduce((a, p) => a + nump(p.valor), 0)
  const totalDecl = nump(verba.totalDeclarado)
  const temConferencia = isMaterial && totalDecl > 0 && (verba.parcelas || []).length > 0
  const difer = Math.abs(somaParcelas - totalDecl)
  const bate = temConferencia && difer <= Math.max(1, totalDecl * 0.01)

  // Sanidade: juros do material começando ANTES do 1º desconto = data suspeita (IA pode inventar)
  const primeiraData = isMaterial ? (verba.parcelas || []).map(p => p.data).filter(Boolean).sort()[0] : null
  const jurosSuspeitos = isMaterial && verba.jurosTipo !== 'nenhum' && verba.jurosInicio && primeiraData && verba.jurosInicio < primeiraData

  return (
    <div className="card-elevated fade-in" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{TIPO_VERBA[verba.tipo] || 'Verba'}</h4>
        <button className="btn-danger" onClick={onRemove}><Trash2 size={12} /> Remover</button>
      </div>
      <Grid cols={2}>
        <Field label="Tipo de verba" required>
          <select className="input-lex" value={verba.tipo}
            onChange={e => onChange({ ...verba, tipo: e.target.value, emDobro: e.target.value === 'dano_material' ? verba.emDobro : false })}>
            <option value="dano_moral">Dano Moral</option>
            <option value="dano_material">Dano Material</option>
            <option value="honorarios">Honorários Sucumbenciais</option>
            <option value="outro">Outra Verba</option>
          </select>
        </Field>
        <Field label="Índice de correção" required hint={!isMaterial ? 'Dano moral: usualmente SELIC (englobando juros) ou IPCA-E' : undefined}>
          <select className="input-lex" value={verba.indice} onChange={e => upd('indice', e.target.value)}>
            <option value="INPC">INPC</option>
            <option value="IPCA">IPCA-E</option>
            <option value="SELIC">SELIC</option>
          </select>
        </Field>
        <Field label="Juros de mora" required>
          <select className="input-lex" value={verba.jurosTipo} onChange={e => upd('jurosTipo', e.target.value)}>
            {JUROS_OPCOES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </Field>
        {verba.jurosTipo !== 'nenhum' && (
          <Field label="Juros a partir de" required hint={jurosSuspeitos ? undefined : 'Citação, evento danoso, etc. (conforme a sentença)'}>
            <input type="date" className="input-lex" value={verba.jurosInicio} onChange={e => upd('jurosInicio', e.target.value)}
              style={jurosSuspeitos ? { borderColor: 'var(--warning)' } : undefined} />
            {jurosSuspeitos && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--warning)' }}>⚠️ Anterior ao 1º desconto ({fmtData(primeiraData)}) — confira a data da citação na intimação/AR.</p>}
          </Field>
        )}
        <Field label="Descrição (opcional)">
          <input className="input-lex" placeholder={isMaterial ? 'Ex.: Seguro Mais Proteção' : 'Ex.: Dano moral'} value={verba.descricao} onChange={e => upd('descricao', e.target.value)} />
        </Field>
      </Grid>

      {isMaterial ? (
        <>
          {verba.fonte === 'pdf' && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'hsl(var(--foreground))', fontSize: '12.5px', display: 'flex', gap: 8 }}>
              <AlertCircle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>Confira os descontos.</strong> A tabela da inicial é escaneada e a IA pode confundir “valor total” com “valor em dobro”. Para precisão, use <strong>★ Importar planilha</strong> (.xlsx) abaixo — os valores exatos substituem estes.</span>
            </div>
          )}
          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={verba.emDobro} onChange={e => upd('emDobro', e.target.checked)} style={{ accentColor: 'hsl(var(--primary))', width: '15px', height: '15px' }} />
              Repetição do indébito — em dobro (cada parcela conta 2x)
            </label>
          </div>
          <div style={{ marginTop: '12px' }}>
            <Field label="Total dos descontos informado na inicial" hint="A soma da tabela / valor da restituição declarado na petição — base da geração e da conferência">
              <input type="number" step="0.01" min="0" className="input-lex mono" placeholder="Ex.: 519,64" value={verba.totalDeclarado ?? ''} onChange={e => upd('totalDeclarado', e.target.value)} style={{ maxWidth: 240 }} />
            </Field>
          </div>

          {/* Importar planilha da pasta do cliente — fonte confiável (sem OCR) */}
          <div style={{ marginTop: '10px', padding: '12px 14px', border: '1px solid hsl(var(--primary) / 0.45)', borderRadius: '10px', background: 'hsl(var(--primary) / 0.07)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--primary))' }}>★ Importar planilha de descontos (recomendado)</p>
            <label className="btn-secondary" style={{ fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={13} /> Selecionar planilha (.xlsx / .xls / .csv)
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; importarPlanilha(f) }} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Lê os descontos exatos (valores SIMPLES) + “VALOR TOTAL” + “VALOR EM DOBRO” direto da planilha — sem OCR, sem alucinar meses. O “em dobro” é aplicado pelo sistema.
            </p>
            {impErr && <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--error)' }}>{impErr}</p>}
          </div>

          {/* Alternativa: gerar parcelas mensais a partir do total + período (quando não há planilha) */}
          <div style={{ marginTop: '10px', padding: '12px 14px', border: '1px dashed hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--secondary))' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Sem planilha? Gerar parcelas mensais (total ÷ meses)</p>
            <Grid cols={2}>
              <Field label="1º desconto (período de)"><input type="date" className="input-lex" value={verba.periodoInicio || ''} onChange={e => upd('periodoInicio', e.target.value)} /></Field>
              <Field label="Último desconto (período até)"><input type="date" className="input-lex" value={verba.periodoFim || ''} onChange={e => upd('periodoFim', e.target.value)} /></Field>
            </Grid>
            <button className="btn-secondary" style={{ marginTop: '10px', fontSize: '12px' }}
              disabled={!verba.totalDeclarado || !verba.periodoInicio || !verba.periodoFim}
              onClick={() => { const p = gerarParcelasMensais(verba.totalDeclarado, verba.periodoInicio, verba.periodoFim); if (p.length) upd('parcelas', p) }}>
              <Plus size={13} /> Gerar parcelas mensais (total ÷ meses)
            </button>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Distribui o total no período em parcelas mensais — a soma bate exatamente com o total e cada parcela é corrigida pela sua data (padrão CJ). Mais confiável que transcrever a tabela escaneada.
            </p>
          </div>

          <ParcelaEditor parcelas={verba.parcelas} onChange={(p) => upd('parcelas', p)} />

          {temConferencia && (
            <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px',
              background: bate ? 'hsl(145 60% 35% / 0.12)' : 'var(--warning-bg)',
              border: `1px solid ${bate ? 'hsl(145 60% 45% / 0.35)' : 'var(--warning-border)'}`, color: 'hsl(var(--foreground))' }}>
              {bate ? <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0 }} /> : <AlertCircle size={14} color="var(--warning)" style={{ flexShrink: 0 }} />}
              <span>Conferência: soma das parcelas <strong className="mono">{fmtBRL(somaParcelas)}</strong> vs total da inicial <strong className="mono">{fmtBRL(totalDecl)}</strong>
                {bate ? ' — confere ✓' : ` — diverge ${fmtBRL(difer)}; revise as parcelas ou o total informado.`}</span>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: '12px', padding: '12px 14px', border: '1px dashed hsl(var(--primary) / 0.35)', borderRadius: '10px', background: 'hsl(var(--primary) / 0.04)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--primary))' }}>Valor fixo arbitrado na sentença</p>
          <Grid cols={2}>
            <Field label="Valor fixado (R$)" required hint="O valor da condenação fixado pelo juiz (sem parcelas)">
              <input type="number" step="0.01" min="0" className="input-lex mono" placeholder="Ex.: 4.000,00" value={verba.valor ?? ''} onChange={e => upd('valor', e.target.value)} />
            </Field>
            <Field label="Data do arbitramento / base" required hint="Correção a partir desta data (Súmula 362 STJ p/ dano moral)">
              <input type="date" className="input-lex" value={verba.data || ''} onChange={e => upd('data', e.target.value)} />
            </Field>
          </Grid>
        </div>
      )}
    </div>
  )
}

// ─── Defaults / mapeamento ─────────────────────────────────────────────────────
const VERBA_DEFAULT = {
  tipo: 'dano_material', indice: 'INPC', emDobro: true,
  descricao: '', jurosTipo: 'fixo_1', jurosInicio: '',
  // dano material → tabela de descontos (parcelas mensais)
  totalDeclarado: '', periodoInicio: '', periodoFim: '', parcelas: [],
  // dano moral / honorários / outro → valor fixo arbitrado pelo juiz (sem parcelas)
  valor: '', data: '',
}

const isMaterialTipo = (t) => t === 'dano_material'

// Parcelas efetivas de uma verba para o motor:
//  - material: a tabela de descontos (cada um corrigido pela sua data)
//  - demais (moral/honorários/outro): UMA parcela = valor fixo na data do arbitramento
function parcelasDaVerba(v) {
  if (isMaterialTipo(v.tipo)) return v.parcelas || []
  const val = parseFloat(String(v.valor).replace(',', '.')) || 0
  return val > 0 ? [{ id: 'fixo', data: v.data || '', valor: v.valor }] : []
}

// Gera parcelas MENSAIS que somam EXATAMENTE o total, no período informado.
// Evita depender de OCR linha-a-linha (que alucina meses) — usa total+período (confiáveis).
function gerarParcelasMensais(total, iniISO, fimISO) {
  const t = parseFloat(String(total).replace(',', '.')) || 0
  if (!t || !iniISO || !fimISO) return []
  const [ay, am, ad] = iniISO.split('-').map(Number)
  const [by, bm] = fimISO.split('-').map(Number)
  if (!ay || !am || !by || !bm) return []
  const n = (by - ay) * 12 + (bm - am) + 1
  if (n < 1 || n > 600) return []
  const dia = Math.min(Math.max(ad || 28, 1), 28)
  const per = Math.round((t / n) * 100) / 100
  const out = []
  for (let i = 0; i < n; i++) {
    let m = am - 1 + i
    const y = ay + Math.floor(m / 12)
    const mm = (m % 12) + 1
    const valor = i === n - 1 ? Math.round((t - per * (n - 1)) * 100) / 100 : per
    out.push({ id: uid(), data: `${y}-${String(mm).padStart(2, '0')}-${String(dia).padStart(2, '0')}`, valor })
  }
  return out
}

function dataDoTermo(termo, dados) {
  if (termo === 'citacao') return dados.dataCitacao
  if (termo === 'ajuizamento') return dados.dataAjuizamento
  return dados.dataDecisao
}

export default function NovoCalculo() {
  const navigate = useNavigate()
  const { salvarCalculo } = useCalculos()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [proc, setProc] = useState(null)
  const [geradoEm, setGeradoEm] = useState('')

  const hoje = new Date().toISOString().split('T')[0]

  const [dispositivo, setDispositivo] = useState('')
  const [extracao, setExtracao] = useState(null)

  // ── Modo automático (IA lê documentos) ──
  const [modo, setModo] = useState('manual')        // 'manual' | 'auto'
  const [arquivos, setArquivos] = useState([])      // File[]
  const [extraindo, setExtraindo] = useState(false)
  const [extraiErr, setExtraiErr] = useState('')
  const [prog, setProg] = useState(0)            // progresso da análise (0–100)
  const [progMsg, setProgMsg] = useState('')

  const [dados, setDados] = useState({
    processo: '', cliente: '', executada: '', vara: '',
    tipoDocumento: 'sentenca',
    dataDecisao: '', dataTransito: '', dataCitacao: '', dataAjuizamento: '',
    termoFinal: hoje, honorariosPercentual: '', observacoes: '', verbas: [],
  })
  const upd = (k, v) => setDados(d => ({ ...d, [k]: v }))

  function handleExtrair() {
    if (!dispositivo.trim()) return
    setExtracao(extrairDoDispositivo(dispositivo))
  }
  function limparExtracao() { setDispositivo(''); setExtracao(null) }

  function addVerba() {
    setDados(d => ({ ...d, verbas: [...d.verbas, { ...VERBA_DEFAULT, id: uid(), jurosInicio: d.dataCitacao || d.dataDecisao }] }))
  }
  function removeVerba(id) { setDados(d => ({ ...d, verbas: d.verbas.filter(v => v.id !== id) })) }
  function updateVerba(id, u) { setDados(d => ({ ...d, verbas: d.verbas.map(v => v.id === id ? u : v) })) }

  // Extração (Step 2) → seed de verbas no novo formato
  function avancarParaStep3() {
    if (extracao?.verbas?.length > 0) {
      const novas = extracao.verbas.map(v => {
        const isMaterial = v.tipo === 'dano_material'
        const jurosTipo = v.tipo === 'honorarios' ? 'nenhum'
          : v.indice === 'SELIC' ? 'nenhum'
          : v.tipo === 'dano_moral' ? 'taxa_legal' : 'fixo_1'
        return {
          ...VERBA_DEFAULT, id: uid(),
          tipo: v.tipo,
          indice: v.indice,
          // "em dobro" é POR VERBA e só vale para dano material (restituição/indébito)
          emDobro: isMaterial ? !!(v.emDobro || v._emDobroNaSentenca) : false,
          jurosTipo,
          jurosInicio: dados.dataCitacao || dados.dataDecisao || '',
          descricao: v.descricao || '',
          // Material = SHELL (parcelas da tabela). Demais = valor fixo na data do
          // arbitramento/decisão (Súmula 362 STJ) — sem parcelas.
          parcelas: [],
          valor: isMaterial ? '' : (v.valorOriginal ?? ''),
          data: isMaterial ? '' : (dados.dataDecisao || dataDoTermo(v.termoInicial, dados) || ''),
        }
      })
      setDados(d => ({ ...d, verbas: novas }))
    }
    setStep(3)
  }

  // Aplica o resultado da IA (contrato { processo, verbas }) ao estado do wizard.
  // planilhaData (opcional) traz os descontos lidos da planilha da inicial — fonte
  // confiável que SUBSTITUI a leitura da tabela escaneada no dano material.
  function aplicarExtracao(res, planilhaData = null) {
    const p = res.processo || {}
    const num = (x) => { const n = Number(x); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 }
    let verbas = (res.verbas || []).map(v => {
      const isMaterial = v.tipo === 'dano_material'
      // Valor fixo (moral/honorários/outro): pega da 1ª parcela da IA (valor + data)
      const pIA = (v.parcelas || [])[0] || {}
      const valorFixo = isMaterial ? '' : (pIA.valor ?? '')
      const dataFixa = isMaterial ? '' : (pIA.data || p.dataDecisao || '')
      // Base SIMPLES do dano material: prioriza VALOR TOTAL; se só veio EM DOBRO, divide por 2.
      // (Impede o erro de usar o valor "em dobro" como base e dobrar de novo.)
      const simples = num(v.valorTotalSimples) || (num(v.valorEmDobro) ? Math.round(num(v.valorEmDobro) / 2 * 100) / 100 : num(v.totalDeclarado))
      const aiDobro = !!v.emDobro || num(v.valorEmDobro) > 0
      return {
        ...VERBA_DEFAULT, id: uid(),
        tipo: v.tipo || 'dano_material',
        indice: v.indice || 'INPC',
        emDobro: isMaterial ? aiDobro : false,      // defensivo: dobro só material
        jurosTipo: v.indice === 'SELIC' && v.tipo === 'dano_moral' ? 'nenhum' : (v.jurosTipo || 'fixo_1'),
        jurosInicio: v.jurosInicio || '',
        descricao: v.descricao || '',
        totalDeclarado: isMaterial ? (simples || '') : '',
        periodoInicio: isMaterial ? (v.periodoInicio || '') : '',
        periodoFim: isMaterial ? (v.periodoFim || '') : '',
        // Dano material com total simples + período → gera parcelas mensais (sem alucinar linhas)
        parcelas: (isMaterial && v.periodoInicio && v.periodoFim && simples)
          ? gerarParcelasMensais(simples, v.periodoInicio, v.periodoFim)
          : (isMaterial ? (v.parcelas || []).map(pc => ({ id: uid(), data: pc.data || '', valor: pc.valor ?? '' })) : []),
        valor: valorFixo,
        data: dataFixa,
        // origem dos descontos do material: 'pdf' (IA, conferir!) — vira 'planilha' se houver planilha
        fonte: isMaterial ? 'pdf' : undefined,
      }
    })

    // Anexa as parcelas da PLANILHA ao dano material (valores SIMPLES; o motor dobra)
    if (planilhaData && planilhaData.parcelas.length) {
      const parcelasUI = planilhaData.parcelas.map(pc => ({ id: uid(), data: pc.data, valor: pc.valor }))
      const idx = verbas.findIndex(v => v.tipo === 'dano_material')
      if (idx === -1) {
        verbas.unshift({
          ...VERBA_DEFAULT, id: uid(), tipo: 'dano_material', indice: 'INPC',
          jurosTipo: 'fixo_1', jurosInicio: p.dataCitacao || p.dataDecisao || '',
          emDobro: planilhaData.emDobro, descricao: '',
          totalDeclarado: planilhaData.totalSimples, periodoInicio: '', periodoFim: '',
          parcelas: parcelasUI, valor: '', data: '', fonte: 'planilha',
        })
      } else {
        verbas[idx] = {
          ...verbas[idx], parcelas: parcelasUI,
          totalDeclarado: planilhaData.totalSimples,
          emDobro: verbas[idx].emDobro || planilhaData.emDobro,
          periodoInicio: '', periodoFim: '', fonte: 'planilha',
        }
      }
    }

    verbas = verbas.filter(v => parcelasDaVerba(v).length > 0 || (parseFloat(String(v.totalDeclarado).replace(',', '.')) || 0) > 0)
    setDados(d => ({
      ...d,
      processo: p.processo || d.processo,
      cliente: p.cliente || d.cliente,
      executada: p.executada || d.executada,
      vara: p.vara || d.vara,
      tipoDocumento: p.tipoDocumento || d.tipoDocumento,
      dataDecisao: p.dataDecisao || d.dataDecisao,
      dataTransito: p.dataTransito || d.dataTransito,
      dataCitacao: p.dataCitacao || d.dataCitacao,
      dataAjuizamento: p.dataAjuizamento || d.dataAjuizamento,
      honorariosPercentual: (Number(p.honorariosPercentual) > 0 ? p.honorariosPercentual : d.honorariosPercentual),
      verbas,
    }))
  }

  async function extrairComIA() {
    if (!arquivos.length) return
    setExtraiErr(''); setExtraindo(true); setProg(6); setProgMsg('Preparando documentos…')
    const tick = setInterval(() => setProg(p => Math.min(93, p + Math.random() * 6 + 1.5)), 600)
    try {
      // 1) PLANILHAS (.xlsx/.xls/.csv) → leitura determinística dos descontos
      //    (dado estruturado, sem OCR/IA): parcelas exatas + total simples + em dobro.
      const planilhas = arquivos.filter(isPlanilha)
      const docs = arquivos.filter(f => !isPlanilha(f))
      if (planilhas.length) { setProgMsg('Lendo a planilha de descontos…'); setProg(p => Math.max(p, 22)) }
      let planilhaData = null
      for (const f of planilhas) {
        try {
          const pl = await parsePlanilha(f)
          if (pl.parcelas.length) {
            planilhaData = planilhaData
              ? { parcelas: [...planilhaData.parcelas, ...pl.parcelas], totalSimples: (planilhaData.totalSimples || 0) + (pl.totalSimples || 0), totalDobro: (planilhaData.totalDobro || 0) + (pl.totalDobro || 0), emDobro: planilhaData.emDobro || pl.emDobro }
              : pl
          }
        } catch (e) { console.warn('Falha ao ler planilha', f.name, e) }
      }

      // 2) PDFs/imagens (inicial, sentença/acórdão) → contexto jurídico via IA
      let res = { verbas: [] }
      if (docs.length) {
        setProgMsg('Analisando documentos com a IA…'); setProg(p => Math.max(p, 40))
        const documentos = []
        for (const f of docs) documentos.push({ base64: await fileToBase64(f), mediaType: f.type || 'application/pdf', nome: f.name })
        res = await extrairDocumentos({ documentos })
      }

      setProgMsg('Montando o cálculo…'); setProg(96)
      if (!res.verbas?.length && !planilhaData) {
        setExtraiErr('A IA não encontrou verbas e nenhuma planilha válida foi lida. Você pode preencher manualmente.')
      } else {
        aplicarExtracao(res, planilhaData)
        setProg(100)
        setStep(3) // revisar verbas/parcelas
      }
    } catch (e) {
      setExtraiErr('Erro na extração: ' + e.message)
    } finally {
      clearInterval(tick)
      setExtraindo(false)
      setTimeout(() => { setProg(0); setProgMsg('') }, 800)
    }
  }

  async function gerarRelatorios() {
    setSaveErr(''); setSaving(true)
    try {
      const termoFinal = dados.termoFinal || hoje
      const indices = new Set()
      let precisaSelic = false, precisaIpca = false
      for (const v of dados.verbas) {
        indices.add(v.indice)
        if (v.jurosTipo === 'taxa_legal') { precisaSelic = true; precisaIpca = true }
        if (v.jurosTipo === 'selic') precisaSelic = true
      }
      if (precisaSelic) indices.add('SELIC')
      if (precisaIpca) indices.add('IPCA')

      const series = await carregarSeries([...indices])
      const verbasCalc = dados.verbas.map(v => ({
        tipo: v.tipo, descricao: v.descricao, indice: v.indice,
        serie: series[v.indice], emDobro: isMaterialTipo(v.tipo) ? v.emDobro : false,
        juros: { tipo: v.jurosTipo, dataInicio: v.jurosInicio, serieSelic: series.SELIC, serieIpca: series.IPCA },
        parcelas: parcelasDaVerba(v).map(p => ({ data: p.data, valor: parseFloat(String(p.valor).replace(',', '.')) || 0 })),
      }))
      const resultado = calcularProcesso(verbasCalc, { termoFinal, honorariosPercentual: parseFloat(String(dados.honorariosPercentual).replace(',', '.')) || 0 })
      setProc(resultado)

      const agora = new Date()
      setGeradoEm(`${agora.toLocaleDateString('pt-BR')}, às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)

      try { await salvarCalculo(dados, dados.verbas, resultado.totalGeral, { termoFinal }) } catch (e) { console.warn('Falha ao salvar:', e) }
      setStep(4)
    } catch (e) {
      setSaveErr('Erro ao gerar/buscar índices: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Explica por que o "Gerar relatórios" está bloqueado (passo 3)
  function motivoBloqueioStep3() {
    if (step !== 3) return ''
    if (!dados.verbas.length) return 'Adicione ao menos uma verba.'
    for (const v of dados.verbas) {
      const nome = TIPO_VERBA[v.tipo] || 'verba'
      const parc = parcelasDaVerba(v)
      if (!parc.length) {
        return isMaterialTipo(v.tipo)
          ? `A verba "${nome}" está sem parcelas — informe o total + período e clique em "Gerar parcelas mensais", ou lance os descontos manualmente.`
          : `Informe o valor fixado e a data do arbitramento em "${nome}".`
      }
      if (!parc.every(p => p.data && parseFloat(String(p.valor).replace(',', '.')) > 0)) {
        return isMaterialTipo(v.tipo) ? `Preencha data e valor de todas as parcelas em "${nome}".` : `Preencha valor e data em "${nome}".`
      }
      if (v.jurosTipo !== 'nenhum' && !v.jurosInicio) return `Defina "Juros a partir de" em "${nome}".`
    }
    return ''
  }

  function canNext() {
    if (step === 1) return dados.cliente.trim() && dados.executada.trim()
    if (step === 2) return dados.dataDecisao && dados.termoFinal
    if (step === 3) return dados.verbas.length > 0 && dados.verbas.every(v => {
      const parc = parcelasDaVerba(v)
      return parc.length > 0 &&
        parc.every(p => p.data && parseFloat(String(p.valor).replace(',', '.')) > 0) &&
        (v.jurosTipo === 'nenhum' || v.jurosInicio)
    })
    return true
  }

  function reset() {
    setProc(null); setExtracao(null); setDispositivo('')
    setDados({ processo: '', cliente: '', executada: '', vara: '', tipoDocumento: 'sentenca', dataDecisao: '', dataTransito: '', dataCitacao: '', dataAjuizamento: '', termoFinal: hoje, observacoes: '', verbas: [] })
    setStep(1)
  }

  // ── STEP 4: relatórios (tela cheia) ──
  if (step === 4 && proc) {
    return (
      <div>
        <div className="no-print" style={{ display: 'flex', gap: '10px', padding: '12px 24px', background: '#0b1220', borderBottom: '1px solid hsl(var(--border))', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setStep(3)} style={{ fontSize: 13 }}><ChevronLeft size={14} /> Voltar às verbas</button>
          <button className="btn-secondary" onClick={reset} style={{ fontSize: 13 }}><FileText size={14} /> Novo cálculo</button>
          <button className="btn-secondary" onClick={() => navigate('/historico')} style={{ fontSize: 13 }}>Histórico <ChevronRight size={14} /></button>
        </div>
        <Relatorio relatorio={{ meta: { cliente: dados.cliente, processo: dados.processo, executada: dados.executada, vara: dados.vara, tipoDocumento: dados.tipoDocumento }, geradoEm, proc }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '880px' }}>
      <div className="fade-up" style={{ marginBottom: '24px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>EXECUÇÃO · NOVO CÁLCULO</p>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Cálculo de Atualização de Débitos</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Gera um relatório por verba, no padrão do Cálculo Jurídico, com índices oficiais</p>
      </div>

      <div className="card fade-up" style={{ padding: '24px 28px' }}>
        <Steps current={step} />

        {/* Seletor de modo (só no passo 1) */}
        {step === 1 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[
              { v: 'auto', icon: Bot, l: 'Automático', sub: 'IA lê os documentos' },
              { v: 'manual', icon: PencilLine, l: 'Manual', sub: 'Preencher os campos' },
            ].map(opt => {
              const Icon = opt.icon
              const active = modo === opt.v
              return (
                <button key={opt.v} onClick={() => setModo(opt.v)} style={{
                  flex: 1, padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  background: active ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--secondary))',
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <Icon size={18} />
                  <span><p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{opt.l}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.8 }}>{opt.sub}</p></span>
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 1 — AUTOMÁTICO (upload de documentos) */}
        {step === 1 && modo === 'auto' && (
          <div>
            <Section badge="IA" eyebrow="EXTRAÇÃO AUTOMÁTICA" title="Enviar Documentos" desc="Anexe a PLANILHA de cálculo (.xlsx) da pasta do cliente + a petição inicial + a sentença/acórdão. A planilha dá os descontos exatos; a IA cuida do resto." />
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '28px', border: '2px dashed hsl(var(--border))', borderRadius: '12px',
              cursor: 'pointer', background: 'hsl(var(--secondary))', textAlign: 'center',
            }}>
              <Upload size={26} style={{ color: 'hsl(var(--primary))' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Clique para selecionar a planilha, PDFs ou imagens</span>
              <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Planilha (.xlsx/.xls/.csv) · Petição inicial · Sentença/Acórdão</span>
              <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,image/*" style={{ display: 'none' }}
                onChange={e => { setArquivos([...arquivos, ...Array.from(e.target.files || [])]); e.target.value = '' }} />
            </label>

            {arquivos.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {arquivos.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--foreground))' }}>
                      <FileText size={14} color="hsl(var(--primary))" /> {f.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({(f.size / 1024).toFixed(0)} KB)</span>
                    </span>
                    <button onClick={() => setArquivos(arquivos.filter((_, j) => j !== i))} className="btn-danger" style={{ padding: '3px 6px' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {extraiErr && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px', color: 'var(--error)', fontSize: 13, display: 'flex', gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{extraiErr}
              </div>
            )}

            <button className="btn-primary" onClick={extrairComIA} disabled={!arquivos.length || extraindo}
              style={{ marginTop: '16px', height: '44px', fontSize: '14px', width: '100%', justifyContent: 'center', opacity: (!arquivos.length || extraindo) ? 0.5 : 1 }}>
              {extraindo ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analisando…</> : <><Bot size={16} /> Extrair tudo com IA</>}
            </button>

            {extraindo || prog > 0 ? (
              <div style={{ marginTop: '14px' }} className="fade-in">
                <div style={{ height: '10px', background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog}%`, borderRadius: '999px', background: 'linear-gradient(90deg,#0ea5e9,#2563eb)', transition: 'width .5s ease', boxShadow: '0 0 8px hsl(var(--primary) / 0.6)' }} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'hsl(var(--foreground))', textAlign: 'center', fontWeight: 500 }}>
                  {Math.round(prog)}% — {progMsg || 'Processando…'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                  A leitura da IA leva ~15–25s. Não feche a página.
                </p>
              </div>
            ) : (
              <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                A planilha (.xlsx) dá os descontos exatos; a IA preenche processo, datas e verbas. Você revisa antes de calcular.
              </p>
            )}
          </div>
        )}

        {/* STEP 1 — MANUAL */}
        {step === 1 && modo === 'manual' && (
          <div>
            <Section badge="01" eyebrow="IDENTIFICAÇÃO" title="Dados do Processo" desc="Informações básicas do processo judicial" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Número do processo" hint="Formato CNJ: 0000000-00.0000.0.00.0000">
                <input className="input-lex mono" placeholder="0000000-00.0000.0.00.0000" value={dados.processo} onChange={e => upd('processo', e.target.value)} />
              </Field>
              <Grid cols={2}>
                <Field label="Nome do cliente (exequente)" required>
                  <input className="input-lex" placeholder="Nome completo" value={dados.cliente} onChange={e => upd('cliente', e.target.value)} />
                </Field>
                <Field label="Parte executada (réu)" required>
                  <input className="input-lex" placeholder="Ex.: Banco Bradesco S/A" value={dados.executada} onChange={e => upd('executada', e.target.value)} />
                </Field>
                <Field label="Vara / Juízo">
                  <input className="input-lex" placeholder="Ex.: 16ª Vara do JEC de Manaus/AM" value={dados.vara} onChange={e => upd('vara', e.target.value)} />
                </Field>
              </Grid>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <Section badge="02" eyebrow="DECISÃO" title="Documento Base e Datas" desc="Selecione a decisão que fundamenta os cálculos" />
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>Tipo de documento</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ v: 'sentenca', l: 'Sentença', sub: 'Sem recurso' }, { v: 'acordao', l: 'Acórdão', sub: 'Com recurso' }].map(opt => (
                  <button key={opt.v} onClick={() => upd('tipoDocumento', opt.v)} style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${dados.tipoDocumento === opt.v ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: dados.tipoDocumento === opt.v ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--secondary))', color: dados.tipoDocumento === opt.v ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', cursor: 'pointer', textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{opt.l}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.8 }}>{opt.sub}</p>
                  </button>
                ))}
              </div>
              {dados.tipoDocumento === 'acordao' && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.15)', borderRadius: '8px', fontSize: '13px', color: 'hsl(var(--muted-foreground))', display: 'flex', gap: '8px' }}>
                  <Info size={14} style={{ flexShrink: 0, color: 'hsl(var(--primary))', marginTop: '1px' }} />
                  Havendo acórdão que reforma a sentença, use-o como base. Se o acórdão mantém a sentença procedente, use as coordenadas da sentença.
                </div>
              )}
            </div>
            <Grid cols={2}>
              <Field label="Data da decisão" required><input type="date" className="input-lex" value={dados.dataDecisao} onChange={e => upd('dataDecisao', e.target.value)} /></Field>
              <Field label="Data do trânsito em julgado"><input type="date" className="input-lex" value={dados.dataTransito} onChange={e => upd('dataTransito', e.target.value)} /></Field>
              <Field label="Data do ajuizamento" hint="Para correção desde o ajuizamento"><input type="date" className="input-lex" value={dados.dataAjuizamento} onChange={e => upd('dataAjuizamento', e.target.value)} /></Field>
              <Field label="Data da citação" hint="Termo inicial dos juros (art. 405 CC)"><input type="date" className="input-lex" value={dados.dataCitacao} onChange={e => upd('dataCitacao', e.target.value)} /></Field>
              <Field label="Termo final (data do cálculo)" required hint="Até quando atualizar"><input type="date" className="input-lex" value={dados.termoFinal} onChange={e => upd('termoFinal', e.target.value)} /></Field>
              <Field label="Honorários de sucumbência (%)" hint="Para a petição de cumprimento (opcional)"><input type="number" step="0.01" min="0" className="input-lex mono" placeholder="Ex.: 15" value={dados.honorariosPercentual} onChange={e => upd('honorariosPercentual', e.target.value)} /></Field>
            </Grid>
            <div style={{ marginTop: '16px' }}>
              <Field label="Observações"><textarea className="input-lex" rows={2} value={dados.observacoes} onChange={e => upd('observacoes', e.target.value)} style={{ resize: 'vertical', minHeight: '60px' }} /></Field>
            </div>

            {/* Extração automática */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} color="hsl(var(--primary))" />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Extração automática (opcional)</p>
                </div>
                {extracao && <button onClick={limparExtracao} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Limpar</button>}
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Cole o dispositivo da sentença/acórdão para pré-preencher as verbas (você ajusta as parcelas no próximo passo).</p>
              <textarea className="input-lex" rows={4} placeholder="Cole aqui o texto a partir de 'ANTE O EXPOSTO' / 'CONDENAR...'" value={dispositivo} onChange={e => { setDispositivo(e.target.value); if (extracao) setExtracao(null) }} style={{ resize: 'vertical', minHeight: '90px', fontSize: '13px' }} />
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleExtrair} disabled={!dispositivo.trim()} className="btn-primary" style={{ height: '34px', fontSize: '12px', padding: '0 14px', opacity: !dispositivo.trim() ? 0.45 : 1 }}><Sparkles size={13} /> Extrair verbas</button>
              </div>
              {extracao && (
                <div style={{ marginTop: '12px' }} className="fade-in">
                  {extracao.confianca === 'nenhuma' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}><XCircle size={14} /> Nenhuma verba encontrada — adicione manualmente no próximo passo.</span>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle2 size={14} color="var(--success)" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>{extracao.verbas.length} verba(s) encontrada(s)</span>
                      </div>
                      {extracao.verbas.map((v, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', padding: '4px 0' }}>
                          • {TIPO_VERBA[v.tipo]} — {v.indice} — <span className="mono">{fmtBRL(parseFloat(v.valorOriginal))}</span>{v._emDobroNaSentenca ? ' (em dobro)' : ''}
                        </div>
                      ))}
                      {extracao.avisos?.map((a, i) => (
                        <div key={i} style={{ marginTop: 6, padding: '8px 10px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '8px', fontSize: '11.5px', color: 'hsl(var(--muted-foreground))', display: 'flex', gap: 6 }}>
                          <AlertCircle size={12} style={{ flexShrink: 0, color: 'var(--warning)', marginTop: 1 }} />{a}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <Section badge="03" eyebrow="VERBAS" title="Verbas e Parcelas" desc="Uma verba por bloco da condenação. Cada desconto é uma parcela." />
            {dados.verbas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: '12px', marginBottom: '16px' }}>
                <Scale size={28} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Nenhuma verba — clique em “Adicionar Verba”.</p>
              </div>
            )}
            {dados.verbas.map(v => (
              <VerbaForm key={v.id} verba={v} onChange={u => updateVerba(v.id, u)} onRemove={() => removeVerba(v.id)} />
            ))}
            <button className="btn-secondary" onClick={addVerba} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}><Plus size={15} /> Adicionar Verba</button>
          </div>
        )}

        {saveErr && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px', color: 'var(--error)', fontSize: 13, display: 'flex', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{saveErr}
          </div>
        )}

        {/* Aviso do que falta no passo 3 */}
        {step === 3 && motivoBloqueioStep3() && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '8px', color: 'hsl(var(--muted-foreground))', fontSize: 13, display: 'flex', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }} />
            <span>Para gerar os relatórios: {motivoBloqueioStep3()}</span>
          </div>
        )}

        {/* Navegação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border))' }}>
          <button className="btn-secondary" onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}>
            <ChevronLeft size={15} />{step === 1 ? 'Voltar' : 'Anterior'}
          </button>
          <button className="btn-primary" onClick={() => { if (step === 3) gerarRelatorios(); else if (step === 2) avancarParaStep3(); else setStep(s => s + 1) }} disabled={!canNext() || saving} style={{ height: '40px', fontSize: '13px' }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Gerando…</>
              : step === 3 ? <>Gerar relatórios <ChevronRight size={15} /></>
              : step === 2 && extracao?.verbas?.length > 0 ? <><Sparkles size={14} /> Avançar com {extracao.verbas.length} verba(s) <ChevronRight size={15} /></>
              : <>Próximo <ChevronRight size={15} /></>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
