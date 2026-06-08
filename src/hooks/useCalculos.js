import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useCalculos() {
  const [calculos, setCalculos] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('calculos')
      .select(`*, verbas(*)`)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setCalculos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const parseValor = (x) => parseFloat(String(x ?? '').replace(/\./g, '').replace(',', '.')) || parseFloat(x) || 0

  async function salvarCalculo(dados, verbas, totalAtualizado, extra = {}) {
    // Inserir cabeçalho
    const { data: calculo, error: errCalc } = await supabase
      .from('calculos')
      .insert({
        processo:         dados.processo,
        cliente:          dados.cliente,
        executada:        dados.executada,
        vara:             dados.vara,
        tipo_documento:   dados.tipoDocumento,
        data_decisao:     dados.dataDecisao     || null,
        data_transito:    dados.dataTransito    || null,
        data_citacao:     dados.dataCitacao     || null,
        data_ajuizamento: dados.dataAjuizamento || null,
        observacoes:      dados.observacoes     || null,
        status:           'pendente',
        total_atualizado: totalAtualizado,
        dados_calculo:    { verbas, termoFinal: extra.termoFinal || null },
        user_id:          (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()
    if (errCalc) throw errCalc

    // Inserir verbas (resumo — o detalhamento completo fica em dados_calculo)
    if (verbas.length > 0) {
      const rows = verbas.map(v => ({
        calculo_id:        calculo.id,
        tipo:              v.tipo,
        valor_original:    v.tipo === 'dano_material'
                             ? (v.parcelas || []).reduce((a, p) => a + parseValor(p.valor), 0)
                             : parseValor(v.valor),
        em_dobro:          v.tipo === 'dano_material' ? !!v.emDobro : false,
        indice:            v.indice,
        termo_inicial:     'decisao',
        data_personalizada:null,
        data_citacao:      v.jurosInicio || null,
        incluir_juros:     !!(v.jurosTipo && v.jurosTipo !== 'nenhum'),
      }))
      const { error: errVerbas } = await supabase.from('verbas').insert(rows)
      if (errVerbas) throw errVerbas
    }

    await fetch()
    return calculo
  }

  async function atualizarStatus(id, status) {
    const { error } = await supabase
      .from('calculos')
      .update({ status })
      .eq('id', id)
    if (!error) await fetch()
  }

  async function excluirCalculo(id) {
    // Remove as verbas (FK) antes do cabeçalho
    await supabase.from('verbas').delete().eq('calculo_id', id)
    const { error } = await supabase.from('calculos').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { calculos, loading, error, salvarCalculo, atualizarStatus, excluirCalculo, refetch: fetch }
}
