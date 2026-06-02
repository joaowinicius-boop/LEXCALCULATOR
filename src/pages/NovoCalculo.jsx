import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Check,
  FileText, Scale, Calculator, ClipboardCopy, Printer,
  Info, AlertCircle, Loader2
} from 'lucide-react'
import {
  calcularVerba, calcularTotal, fmt, fmtDate,
  TIPO_VERBA, INDICE_LABEL
} from '../utils/calcular.js'
import { useCalculos } from '../hooks/useCalculos.js'

let _id = 1
const uid = () => String(_id++)

// ─── Field wrapper ─────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: 'hsl(var(--foreground))',
        marginBottom: '6px',
      }}>
        {label}{required && <span style={{ color: 'hsl(var(--primary))' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{hint}</p>}
    </div>
  )
}

function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: '16px' }}>
      {children}
    </div>
  )
}

// ─── Step bar ──────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = [
    { n: 1, label: 'Processo'  },
    { n: 2, label: 'Decisão'   },
    { n: 3, label: 'Verbas'    },
    { n: 4, label: 'Resultado' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div className={`step-dot ${s.n < current ? 'done' : s.n === current ? 'active' : 'pending'}`}>
              {s.n < current ? <Check size={13} /> : s.n}
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: s.n === current ? 600 : 400,
              color: s.n === current ? 'hsl(var(--primary))' : s.n < current ? 'var(--success)' : 'hsl(var(--muted-foreground))',
              whiteSpace: 'nowrap',
            }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: '1px',
              background: s.n < current ? 'var(--success-border)' : 'hsl(var(--border))',
              margin: '0 8px',
              marginBottom: '14px',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Section header ────────────────────────────────────────────────────────
function Section({ badge, eyebrow, title, desc }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        {badge && (
          <div style={{
            width: '28px', height: '28px',
            background: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>{badge}</span>
          </div>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{title}</h2>
      {desc && <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>{desc}</p>}
      <div style={{ height: '1px', background: 'hsl(var(--border))', marginTop: '12px' }} />
    </div>
  )
}

// ─── Single verba form ─────────────────────────────────────────────────────
function VerbaForm({ verba, onChange, onRemove, dataCitacao }) {
  const upd = (k, v) => onChange({ ...verba, [k]: v })

  return (
    <div className="card-elevated fade-in" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          {TIPO_VERBA[verba.tipo] || 'Verba'}
        </h4>
        <button className="btn-danger" onClick={onRemove}><Trash2 size={12} /> Remover</button>
      </div>

      <Grid cols={2}>
        <Field label="Tipo de verba" required>
          <select className="input-lex" value={verba.tipo} onChange={e => upd('tipo', e.target.value)}>
            <option value="dano_moral">Dano Moral</option>
            <option value="dano_material">Dano Material</option>
            <option value="honorarios">Honorários Sucumbenciais</option>
            <option value="outro">Outra Verba</option>
          </select>
        </Field>

        <Field label="Valor original (R$)" required>
          <input
            type="number" step="0.01" min="0"
            className="input-lex mono"
            placeholder="0,00"
            value={verba.valorOriginal}
            onChange={e => upd('valorOriginal', e.target.value)}
          />
        </Field>

        <Field label="Índice de correção" required>
          <select className="input-lex" value={verba.indice} onChange={e => upd('indice', e.target.value)}>
            <option value="SELIC">SELIC (~13,75% a.a.)</option>
            <option value="IPCA">IPCA-E (~4,83% a.a.)</option>
            <option value="INPC">INPC (~5,02% a.a.)</option>
          </select>
        </Field>

        <Field label="Termo inicial da correção" required>
          <select className="input-lex" value={verba.termoInicial} onChange={e => upd('termoInicial', e.target.value)}>
            <option value="decisao">Data da Decisão</option>
            <option value="citacao">Data da Citação</option>
            <option value="ajuizamento">Data do Ajuizamento</option>
            <option value="personalizado">Data Personalizada</option>
          </select>
        </Field>

        {verba.termoInicial === 'personalizado' && (
          <Field label="Data personalizada" required>
            <input type="date" className="input-lex" value={verba.dataPersonalizada} onChange={e => upd('dataPersonalizada', e.target.value)} />
          </Field>
        )}

        <Field label="Data da citação" hint="Para cálculo dos juros moratórios">
          <input
            type="date"
            className="input-lex"
            value={verba.dataCitacao || dataCitacao || ''}
            onChange={e => upd('dataCitacao', e.target.value)}
          />
        </Field>
      </Grid>

      <div style={{ marginTop: '12px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={verba.emDobro}
            onChange={e => upd('emDobro', e.target.checked)}
            style={{ accentColor: 'hsl(var(--primary))', width: '15px', height: '15px' }}
          />
          Restituição em dobro (art. 42 CDC)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={verba.incluirJuros}
            onChange={e => upd('incluirJuros', e.target.checked)}
            style={{ accentColor: 'hsl(var(--primary))', width: '15px', height: '15px' }}
          />
          Incluir juros moratórios (1% a.m.)
        </label>
      </div>
    </div>
  )
}

// ─── Result card ───────────────────────────────────────────────────────────
function ResultRow({ verba, resultado, n }) {
  if (!resultado) return null
  return (
    <div className="card-elevated fade-up" style={{ padding: '16px', marginBottom: '12px', animationDelay: `${n * 0.07}s`, opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {TIPO_VERBA[verba.tipo]}
            </p>
            {verba.emDobro && (
              <span className="badge badge-orange">em dobro</span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
            {INDICE_LABEL[verba.indice]} · {resultado.mesesCorrecao} meses de correção (+{resultado.fatorCorrecao}%)
            {verba.incluirJuros && ` · Juros: ${resultado.mesesJuros} meses`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="mono" style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
            {fmt(resultado.valorAtualizado)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
            de {fmt(resultado.valorOriginal)}
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '12px', paddingTop: '12px',
        borderTop: '1px solid hsl(var(--border))',
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        fontSize: '13px', color: 'hsl(var(--muted-foreground))',
      }}>
        <span>Principal: <span className="mono" style={{ color: 'hsl(var(--foreground))' }}>{fmt(resultado.valorOriginal)}</span></span>
        <span>+ Correção: <span className="mono" style={{ color: 'hsl(var(--foreground))' }}>{fmt(resultado.valorCorrecao)}</span></span>
        <span>+ Juros: <span className="mono" style={{ color: 'hsl(var(--foreground))' }}>{fmt(resultado.valorJuros)}</span></span>
        {verba.emDobro && <span style={{ color: 'hsl(var(--primary))' }}>× 2 (dobro)</span>}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────
const VERBA_DEFAULT = {
  tipo: 'dano_moral',
  valorOriginal: '',
  emDobro: false,
  indice: 'SELIC',
  termoInicial: 'decisao',
  dataPersonalizada: '',
  dataCitacao: '',
  incluirJuros: true,
}

export default function NovoCalculo() {
  const navigate  = useNavigate()
  const { salvarCalculo } = useCalculos()
  const [step,    setStep]    = useState(1)
  const [copied,  setCopied]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const [dados, setDados] = useState({
    processo: '', cliente: '', executada: '', vara: '',
    tipoDocumento: 'sentenca',
    dataDecisao: '', dataTransito: '', dataCitacao: '', dataAjuizamento: '',
    observacoes: '',
    verbas: [],
  })

  const upd = (k, v) => setDados(d => ({ ...d, [k]: v }))

  function addVerba() {
    setDados(d => ({
      ...d,
      verbas: [...d.verbas, {
        ...VERBA_DEFAULT, id: uid(),
        dataCitacao: d.dataCitacao,
        dataDecisao: d.dataDecisao,
        dataAjuizamento: d.dataAjuizamento,
      }]
    }))
  }
  function removeVerba(id) { setDados(d => ({ ...d, verbas: d.verbas.filter(v => v.id !== id) })) }
  function updateVerba(id, u) { setDados(d => ({ ...d, verbas: d.verbas.map(v => v.id === id ? u : v) })) }

  const hoje = new Date().toISOString().split('T')[0]
  const resultados = dados.verbas.map(v => ({
    id: v.id,
    res: calcularVerba({ ...v, dataDecisao: dados.dataDecisao, dataAjuizamento: dados.dataAjuizamento, dataCitacao: v.dataCitacao || dados.dataCitacao }, hoje),
  }))
  const totalAtualizado = resultados.reduce((a, r) => a + (r.res?.valorAtualizado ?? 0), 0)

  // Ao chegar no step 4, salva automaticamente no Supabase
  async function irParaResultado() {
    setSaveErr('')
    setSaving(true)
    try {
      await salvarCalculo(dados, dados.verbas, totalAtualizado)
    } catch (e) {
      setSaveErr('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
    setStep(4)
  }

  function copiarTexto() {
    const linhas = [
      `DISCRIMINAÇÃO DOS VALORES — ${dados.cliente}`,
      `Processo: ${dados.processo}`,
      `Executada: ${dados.executada}`,
      `Data base: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      ...dados.verbas.map((v, i) => {
        const r = resultados[i]?.res
        if (!r) return ''
        return [
          `${i + 1}. ${TIPO_VERBA[v.tipo].toUpperCase()}${v.emDobro ? ' (EM DOBRO)' : ''}`,
          `   Principal: ${fmt(r.valorOriginal)}`,
          `   Correção (${INDICE_LABEL[v.indice]}, ${r.mesesCorrecao} meses): ${fmt(r.valorCorrecao)}`,
          v.incluirJuros ? `   Juros (1%/mês, ${r.mesesJuros} meses): ${fmt(r.valorJuros)}` : '',
          `   SUBTOTAL: ${fmt(r.valorAtualizado)}`,
        ].filter(Boolean).join('\n')
      }),
      '',
      `TOTAL ATUALIZADO: ${fmt(totalAtualizado)}`,
    ].join('\n')

    navigator.clipboard.writeText(linhas).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function canNext() {
    if (step === 1) return dados.processo.trim() && dados.cliente.trim() && dados.executada.trim()
    if (step === 2) return dados.dataDecisao && dados.dataTransito
    if (step === 3) return dados.verbas.length > 0 && dados.verbas.every(v => v.valorOriginal)
    return true
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '880px' }}>
      <div className="fade-up" style={{ marginBottom: '24px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 500, letterSpacing: '1.54px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
          EXECUÇÃO · NOVO CÁLCULO
        </p>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          Cálculo de Cumprimento de Sentença
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
          Preencha os dados para gerar a planilha de cumprimento
        </p>
      </div>

      <div className="card fade-up" style={{ padding: '24px 28px' }}>
        <Steps current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <Section badge="01" eyebrow="IDENTIFICAÇÃO" title="Dados do Processo" desc="Informações básicas do processo judicial" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Número do processo" required hint="Formato CNJ: 0000000-00.0000.0.00.0000">
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

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <Section badge="02" eyebrow="DECISÃO" title="Documento Base" desc="Selecione a decisão que fundamenta os cálculos" />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                Tipo de documento <span style={{ color: 'hsl(var(--primary))' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { v: 'sentenca', l: 'Sentença',    sub: 'Sem recurso' },
                  { v: 'acordao',  l: 'Acórdão',     sub: 'Com recurso' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => upd('tipoDocumento', opt.v)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1px solid ${dados.tipoDocumento === opt.v ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      background: dados.tipoDocumento === opt.v ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--secondary))',
                      color: dados.tipoDocumento === opt.v ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{opt.l}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.8 }}>{opt.sub}</p>
                  </button>
                ))}
              </div>
              {dados.tipoDocumento === 'acordao' && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.15)', borderRadius: '8px', fontSize: '13px', color: 'hsl(var(--muted-foreground))', display: 'flex', gap: '8px' }}>
                  <Info size={14} style={{ flexShrink: 0, color: 'hsl(var(--primary))', marginTop: '1px' }} />
                  POP: quando há acórdão, usar como documento-base, ainda que a sentença seja improcedente.
                </div>
              )}
            </div>

            <Grid cols={2}>
              <Field label="Data da decisão" required>
                <input type="date" className="input-lex" value={dados.dataDecisao} onChange={e => upd('dataDecisao', e.target.value)} />
              </Field>
              <Field label="Data do trânsito em julgado" required>
                <input type="date" className="input-lex" value={dados.dataTransito} onChange={e => upd('dataTransito', e.target.value)} />
              </Field>
              <Field label="Data do ajuizamento" hint="Para correção desde o ajuizamento">
                <input type="date" className="input-lex" value={dados.dataAjuizamento} onChange={e => upd('dataAjuizamento', e.target.value)} />
              </Field>
              <Field label="Data da citação" hint="Para juros moratórios (art. 406 CC)">
                <input type="date" className="input-lex" value={dados.dataCitacao} onChange={e => upd('dataCitacao', e.target.value)} />
              </Field>
            </Grid>
            <div style={{ marginTop: '16px' }}>
              <Field label="Observações">
                <textarea
                  className="input-lex"
                  rows={3}
                  placeholder="Ex.: Honorários não arbitrados. Sentença reformada pelo acórdão."
                  value={dados.observacoes}
                  onChange={e => upd('observacoes', e.target.value)}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div>
            <Section badge="03" eyebrow="VERBAS" title="Verbas da Condenação" desc="Adicione cada verba separadamente" />

            {dados.verbas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: '12px', marginBottom: '16px' }}>
                <Scale size={28} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Nenhuma verba adicionada</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'hsl(var(--muted-foreground))', opacity: 0.7 }}>Clique em "+ Adicionar Verba" para começar</p>
              </div>
            )}

            {dados.verbas.map(v => (
              <VerbaForm
                key={v.id}
                verba={v}
                onChange={u => updateVerba(v.id, u)}
                onRemove={() => removeVerba(v.id)}
                dataCitacao={dados.dataCitacao}
              />
            ))}

            <button className="btn-secondary" onClick={addVerba} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              <Plus size={15} /> Adicionar Verba
            </button>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div>
            <Section badge="04" eyebrow="RESULTADO" title="Valores Calculados"
              desc={`Data base: ${new Date().toLocaleDateString('pt-BR')}`} />

            {/* Info bar */}
            <div style={{
              padding: '12px 16px',
              background: 'hsl(var(--secondary))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              fontSize: '13px',
            }}>
              <span><span style={{ color: 'hsl(var(--muted-foreground))' }}>Processo: </span><span className="mono" style={{ color: 'hsl(var(--foreground))' }}>{dados.processo || '—'}</span></span>
              <span><span style={{ color: 'hsl(var(--muted-foreground))' }}>Cliente: </span><strong>{dados.cliente}</strong></span>
              <span><span style={{ color: 'hsl(var(--muted-foreground))' }}>Executada: </span>{dados.executada}</span>
              <span><span style={{ color: 'hsl(var(--muted-foreground))' }}>Decisão: </span>{fmtDate(dados.dataDecisao)}</span>
            </div>

            {/* Verba results */}
            {dados.verbas.map((v, i) => {
              const r = resultados.find(x => x.id === v.id)
              return <ResultRow key={v.id} verba={v} resultado={r?.res} n={i} />
            })}

            {/* Total */}
            <div style={{
              padding: '20px',
              background: 'hsl(var(--primary) / 0.06)',
              border: '1px solid hsl(var(--primary) / 0.2)',
              borderRadius: '12px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
            className="fade-up"
            >
              <div>
                <p className="eyebrow">TOTAL ATUALIZADO</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                  {new Date().toLocaleDateString('pt-BR')} · {dados.verbas.length} verba(s)
                </p>
              </div>
              <p className="mono" style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                {fmt(totalAtualizado)}
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '12px',
              padding: '12px 14px',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              borderRadius: '10px',
              display: 'flex',
              gap: '8px',
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, color: 'var(--error)', marginTop: '1px' }} />
              <span>
                <strong style={{ color: 'var(--error)' }}>Atenção:</strong> Índices utilizados são aproximações (SELIC ~13,75% a.a., IPCA ~4,83% a.a.).
                Para cálculos oficiais, use as tabelas do BACEN/IBGE via Cálculo Jurídico.
              </span>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={copiarTexto} style={{ height: '40px', fontSize: '13px' }}>
                {copied ? <><Check size={14} /> Copiado!</> : <><ClipboardCopy size={14} /> Copiar para Petição</>}
              </button>
              <button className="btn-secondary" onClick={() => window.print()} style={{ fontSize: '13px' }}>
                <Printer size={14} /> Imprimir
              </button>
              <button className="btn-secondary" onClick={() => {
                setStep(1)
                setDados({ processo:'', cliente:'', executada:'', vara:'', tipoDocumento:'sentenca', dataDecisao:'', dataTransito:'', dataCitacao:'', dataAjuizamento:'', observacoes:'', verbas:[] })
              }} style={{ fontSize: '13px' }}>
                <FileText size={14} /> Novo Cálculo
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border))' }}>
          <button className="btn-secondary" onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}>
            <ChevronLeft size={15} />
            {step === 1 ? 'Voltar' : 'Anterior'}
          </button>

          {step < 4 ? (
            <button
              className="btn-primary"
              onClick={() => step === 3 ? irParaResultado() : setStep(s => s + 1)}
              disabled={!canNext() || saving}
              style={{ height: '40px', fontSize: '13px' }}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                : step === 3 ? <>Calcular <ChevronRight size={15} /></>
                : <>Próximo <ChevronRight size={15} /></>
              }
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/historico')} style={{ height: '40px', fontSize: '13px' }}>
              Ver Histórico <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
