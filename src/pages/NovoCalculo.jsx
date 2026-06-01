import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Check,
  FileText, Scale, Calculator, ClipboardCopy, Printer,
  Info, AlertCircle
} from 'lucide-react'
import {
  calcularVerba, calcularTotal, fmt, fmtDate,
  TIPO_VERBA, INDICE_LABEL, TERMO_LABEL
} from '../utils/calcular.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _id = 1
const uid = () => String(_id++)

const INPUT_LABEL_STYLE = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.35rem',
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={INPUT_LABEL_STYLE}>{label}{required && <span style={{ color: 'var(--gold)' }}> *</span>}</label>
      {children}
      {hint && <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function Grid({ cols = 2, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: '1rem',
    }}>{children}</div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = [
    { n: 1, label: 'Processo'     },
    { n: 2, label: 'Decisão'      },
    { n: 3, label: 'Verbas'       },
    { n: 4, label: 'Resultado'    },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <div className={`step-dot ${s.n < current ? 'done' : s.n === current ? 'active' : 'pending'}`}>
              {s.n < current ? <Check size={12} /> : s.n}
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: s.n === current ? 600 : 400,
              color: s.n === current ? 'var(--gold)' : s.n < current ? '#4ADE80' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: '1px',
              background: s.n < current ? 'rgba(74,222,128,0.3)' : 'var(--border)',
              marginBottom: '1.25rem',
              marginLeft: '0.5rem',
              marginRight: '0.5rem',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Verba form row ───────────────────────────────────────────────────────────
function VerbaForm({ verba, onChange, onRemove, dataCitacao }) {
  const upd = (k, v) => onChange({ ...verba, [k]: v })

  return (
    <div className="card-elevated fade-in" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4 className="cinzel" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
          {TIPO_VERBA[verba.tipo] || 'Verba'}
        </h4>
        <button className="btn-danger" onClick={onRemove}><Trash2 size={12} /> Remover</button>
      </div>

      <Grid cols={2}>
        <Field label="Tipo de verba" required>
          <select
            className="input-gold"
            value={verba.tipo}
            onChange={e => upd('tipo', e.target.value)}
          >
            <option value="dano_moral">Dano Moral</option>
            <option value="dano_material">Dano Material</option>
            <option value="honorarios">Honorários Sucumbenciais</option>
            <option value="outro">Outra Verba</option>
          </select>
        </Field>

        <Field label="Valor original (R$)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-gold mono"
            placeholder="0,00"
            value={verba.valorOriginal}
            onChange={e => upd('valorOriginal', e.target.value)}
          />
        </Field>

        <Field label="Índice de correção" required>
          <select
            className="input-gold"
            value={verba.indice}
            onChange={e => upd('indice', e.target.value)}
          >
            <option value="SELIC">SELIC (~13,75% a.a.)</option>
            <option value="IPCA">IPCA-E (~4,83% a.a.)</option>
            <option value="INPC">INPC (~5,02% a.a.)</option>
          </select>
        </Field>

        <Field label="Termo inicial da correção" required>
          <select
            className="input-gold"
            value={verba.termoInicial}
            onChange={e => upd('termoInicial', e.target.value)}
          >
            <option value="decisao">Data da Decisão</option>
            <option value="citacao">Data da Citação</option>
            <option value="ajuizamento">Data do Ajuizamento</option>
            <option value="personalizado">Data Personalizada</option>
          </select>
        </Field>

        {verba.termoInicial === 'personalizado' && (
          <Field label="Data personalizada" required>
            <input type="date" className="input-gold" value={verba.dataPersonalizada} onChange={e => upd('dataPersonalizada', e.target.value)} />
          </Field>
        )}

        <Field label="Data da citação" hint="Para cálculo dos juros moratórios">
          <input
            type="date"
            className="input-gold"
            value={verba.dataCitacao || dataCitacao || ''}
            onChange={e => upd('dataCitacao', e.target.value)}
          />
        </Field>
      </Grid>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={verba.emDobro}
            onChange={e => upd('emDobro', e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: '15px', height: '15px' }}
          />
          Restituição em dobro (art. 42 CDC)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={verba.incluirJuros}
            onChange={e => upd('incluirJuros', e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: '15px', height: '15px' }}
          />
          Incluir juros moratórios (1% a.m.)
        </label>
      </div>
    </div>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ verba, resultado, n }) {
  if (!resultado) return null
  return (
    <div className="card-elevated fade-up" style={{ padding: '1.25rem', marginBottom: '0.75rem', animationDelay: `${n * 0.07}s`, opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p className="cinzel" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>
            {TIPO_VERBA[verba.tipo]}{verba.emDobro && <span style={{ color: 'var(--gold)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>(EM DOBRO)</span>}
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {INDICE_LABEL[verba.indice]} • {resultado.mesesCorrecao} meses •{' '}
            Correção: +{resultado.fatorCorrecao}%
            {verba.incluirJuros && ` • Juros: ${resultado.mesesJuros} meses`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="mono" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--gold)' }}>
            {fmt(resultado.valorAtualizado)}
          </p>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Principal: {fmt(resultado.valorOriginal)}
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '0.875rem',
        paddingTop: '0.875rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <span>Principal: <span className="mono" style={{ color: 'var(--text)' }}>{fmt(resultado.valorOriginal)}</span></span>
        <span>+ Correção: <span className="mono" style={{ color: 'var(--text)' }}>{fmt(resultado.valorCorrecao)}</span></span>
        <span>+ Juros: <span className="mono" style={{ color: 'var(--text)' }}>{fmt(resultado.valorJuros)}</span></span>
        {verba.emDobro && <span style={{ color: 'var(--gold-light)' }}>× 2 (dobro)</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const VERBA_DEFAULT = {
  tipo:              'dano_moral',
  valorOriginal:     '',
  emDobro:           false,
  indice:            'SELIC',
  termoInicial:      'decisao',
  dataPersonalizada: '',
  dataCitacao:       '',
  incluirJuros:      true,
}

export default function NovoCalculo() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const [dados, setDados] = useState({
    processo:       '',
    cliente:        '',
    executada:      '',
    vara:           '',
    tipoDocumento:  'sentenca',
    dataDecisao:    '',
    dataTransito:   '',
    dataCitacao:    '',
    dataAjuizamento:'',
    observacoes:    '',
    verbas:         [],
  })

  const upd = (k, v) => setDados(d => ({ ...d, [k]: v }))

  // ── Step 3 helpers ──
  function addVerba() {
    setDados(d => ({
      ...d,
      verbas: [...d.verbas, { ...VERBA_DEFAULT, id: uid(), dataCitacao: d.dataCitacao, dataDecisao: d.dataDecisao, dataAjuizamento: d.dataAjuizamento }]
    }))
  }
  function removeVerba(id) {
    setDados(d => ({ ...d, verbas: d.verbas.filter(v => v.id !== id) }))
  }
  function updateVerba(id, updated) {
    setDados(d => ({ ...d, verbas: d.verbas.map(v => v.id === id ? updated : v) }))
  }

  // ── Resultados calculados ──
  const hoje = new Date().toISOString().split('T')[0]
  const resultados = dados.verbas.map(v => {
    const vWithDates = {
      ...v,
      dataDecisao:     dados.dataDecisao,
      dataAjuizamento: dados.dataAjuizamento,
      dataCitacao:     v.dataCitacao || dados.dataCitacao,
    }
    return { id: v.id, res: calcularVerba(vWithDates, hoje) }
  })
  const totalAtualizado = resultados.reduce((a, r) => a + (r.res?.valorAtualizado ?? 0), 0)

  // ── Copy to clipboard ──
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
          `${String.fromCharCode(73 + i)}. ${TIPO_VERBA[v.tipo].toUpperCase()}${v.emDobro ? ' (EM DOBRO)' : ''}`,
          `   Principal: ${fmt(r.valorOriginal)}`,
          `   Correção (${INDICE_LABEL[v.indice]}, ${r.mesesCorrecao} meses): ${fmt(r.valorCorrecao)}`,
          v.incluirJuros ? `   Juros moratórios (1%/mês, ${r.mesesJuros} meses): ${fmt(r.valorJuros)}` : '',
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

  // ── Navigation ──
  function canNext() {
    if (step === 1) return dados.processo.trim() && dados.cliente.trim() && dados.executada.trim()
    if (step === 2) return dados.dataDecisao && dados.dataTransito
    if (step === 3) return dados.verbas.length > 0 && dados.verbas.every(v => v.valorOriginal)
    return true
  }

  const section = (title, sub) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 className="cinzel" style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', fontWeight: 700 }}>{title}</h2>
      {sub && <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sub}</p>}
      <div className="gold-divider" style={{ marginTop: '0.75rem' }} />
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>

      {/* Page title */}
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 className="cinzel" style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)', fontWeight: 700 }}>
          <span style={{ color: 'var(--gold)' }}>§</span> Novo Cálculo de Execução
        </h1>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Preencha os dados da sentença ou acórdão para gerar a planilha de cumprimento
        </p>
      </div>

      {/* Steps */}
      <div className="card fade-up" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
        <Steps current={step} />

        {/* ─── STEP 1: Identificação ─────────────────────────── */}
        {step === 1 && (
          <div>
            {section('Identificação do Processo', 'Dados principais do processo judicial')}
            <Grid cols={1}>
              <Field label="Número do processo" required hint="Formato CNJ: 0000000-00.0000.0.00.0000">
                <input
                  className="input-gold mono"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={dados.processo}
                  onChange={e => upd('processo', e.target.value)}
                />
              </Field>
            </Grid>
            <div style={{ marginTop: '1rem' }}>
              <Grid cols={2}>
                <Field label="Nome do cliente (exequente)" required>
                  <input className="input-gold" placeholder="Nome completo do autor" value={dados.cliente} onChange={e => upd('cliente', e.target.value)} />
                </Field>
                <Field label="Parte executada (réu)" required>
                  <input className="input-gold" placeholder="Ex.: Banco Bradesco S/A" value={dados.executada} onChange={e => upd('executada', e.target.value)} />
                </Field>
                <Field label="Vara / Juízo">
                  <input className="input-gold" placeholder="Ex.: 16ª Vara do JEC de Manaus/AM" value={dados.vara} onChange={e => upd('vara', e.target.value)} />
                </Field>
              </Grid>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Documento Base ────────────────────────── */}
        {step === 2 && (
          <div>
            {section('Documento Base', 'Selecione a decisão que fundamento os cálculos (POP: usar acórdão se houver recurso)')}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={INPUT_LABEL_STYLE}>Tipo de documento<span style={{ color: 'var(--gold)' }}> *</span></label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { v: 'sentenca', l: 'Sentença', sub: 'Sem recurso' },
                  { v: 'acordao',  l: 'Acórdão',  sub: 'Com recurso' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => upd('tipoDocumento', opt.v)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '6px',
                      border: `1px solid ${dados.tipoDocumento === opt.v ? 'var(--gold)' : 'var(--border)'}`,
                      background: dados.tipoDocumento === opt.v ? 'rgba(201,168,76,0.1)' : 'var(--bg-elevated)',
                      color: dados.tipoDocumento === opt.v ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{opt.l}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', opacity: 0.7 }}>{opt.sub}</p>
                  </button>
                ))}
              </div>
              {dados.tipoDocumento === 'acordao' && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <Info size={13} style={{ display: 'inline', marginRight: '0.4rem', color: 'var(--gold)' }} />
                  POP: quando há acórdão, usar como documento-base, ainda que a sentença tenha sido improcedente.
                </div>
              )}
            </div>

            <Grid cols={2}>
              <Field label="Data da decisão" required>
                <input type="date" className="input-gold" value={dados.dataDecisao} onChange={e => upd('dataDecisao', e.target.value)} />
              </Field>
              <Field label="Data do trânsito em julgado" required>
                <input type="date" className="input-gold" value={dados.dataTransito} onChange={e => upd('dataTransito', e.target.value)} />
              </Field>
              <Field label="Data do ajuizamento" hint="Para correção desde o ajuizamento">
                <input type="date" className="input-gold" value={dados.dataAjuizamento} onChange={e => upd('dataAjuizamento', e.target.value)} />
              </Field>
              <Field label="Data da citação" hint="Para juros moratórios (art. 406 CC)">
                <input type="date" className="input-gold" value={dados.dataCitacao} onChange={e => upd('dataCitacao', e.target.value)} />
              </Field>
            </Grid>

            <div style={{ marginTop: '1rem' }}>
              <Field label="Observações">
                <textarea
                  className="input-gold"
                  rows={3}
                  placeholder="Ex.: Sentença reformada pelo acórdão. Honorários não arbitrados."
                  value={dados.observacoes}
                  onChange={e => upd('observacoes', e.target.value)}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Verbas ────────────────────────────────── */}
        {step === 3 && (
          <div>
            {section('Verbas da Condenação', 'Adicione cada verba (dano moral, material, honorários) separadamente')}

            {dados.verbas.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', marginBottom: '1rem' }}>
                <Scale size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nenhuma verba adicionada</p>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)', fontSize: '0.78rem' }}>Clique em "+ Adicionar Verba" para começar</p>
              </div>
            )}

            {dados.verbas.map(v => (
              <VerbaForm
                key={v.id}
                verba={v}
                onChange={updated => updateVerba(v.id, updated)}
                onRemove={() => removeVerba(v.id)}
                dataCitacao={dados.dataCitacao}
              />
            ))}

            <button
              className="btn-outline"
              onClick={addVerba}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              <Plus size={15} />
              Adicionar Verba
            </button>
          </div>
        )}

        {/* ─── STEP 4: Resultado ─────────────────────────────── */}
        {step === 4 && (
          <div>
            {section('Resultado dos Cálculos', `Base: ${hoje ? new Date(hoje + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}`)}

            {/* Process header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Processo: </span>
                <span className="mono" style={{ color: 'var(--text)' }}>{dados.processo || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Cliente: </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{dados.cliente}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Executada: </span>
                <span style={{ color: 'var(--text)' }}>{dados.executada}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Decisão: </span>
                <span style={{ color: 'var(--text)' }}>{fmtDate(dados.dataDecisao)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Trânsito: </span>
                <span style={{ color: 'var(--text)' }}>{fmtDate(dados.dataTransito)}</span>
              </div>
            </div>

            {/* Verbas result cards */}
            {dados.verbas.map((v, i) => {
              const r = resultados.find(x => x.id === v.id)
              return <ResultRow key={v.id} verba={v} resultado={r?.res} n={i} />
            })}

            {/* Total */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(201,168,76,0.07)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: '8px',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }} className="gold-glow-sm fade-up">
              <div>
                <p className="cinzel" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', letterSpacing: '0.05em' }}>TOTAL ATUALIZADO</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Data base: {new Date().toLocaleDateString('pt-BR')} • {dados.verbas.length} verba(s)
                </p>
              </div>
              <p className="mono" style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>
                {fmt(totalAtualizado)}
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.12)',
              borderRadius: '6px',
              display: 'flex',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, color: '#F87171', marginTop: '1px' }} />
              <span>
                <strong style={{ color: '#F87171' }}>Atenção:</strong> Índices utilizados são <strong>aproximações</strong> (SELIC ~13,75% a.a., IPCA ~4,83% a.a.).
                Para cálculos oficiais, use as tabelas do BACEN/IBGE via o sistema Cálculo Jurídico.
              </span>
            </div>

            {/* Export actions */}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-gold" onClick={copiarTexto}>
                {copied ? <><Check size={14} /> COPIADO!</> : <><ClipboardCopy size={14} /> Copiar para Petição</>}
              </button>
              <button className="btn-outline" onClick={() => window.print()}>
                <Printer size={14} />
                Imprimir
              </button>
              <button className="btn-outline" onClick={() => { setStep(1); setDados({ processo:'',cliente:'',executada:'',vara:'',tipoDocumento:'sentenca',dataDecisao:'',dataTransito:'',dataCitacao:'',dataAjuizamento:'',observacoes:'',verbas:[] }) }}>
                <FileText size={14} />
                Novo Cálculo
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn-outline"
            onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
          >
            <ChevronLeft size={15} />
            {step === 1 ? 'Voltar' : 'Anterior'}
          </button>

          {step < 4 ? (
            <button
              className="btn-gold"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
            >
              {step === 3 ? 'Calcular' : 'Próximo'}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button className="btn-gold" onClick={() => navigate('/historico')}>
              Ver Histórico
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
