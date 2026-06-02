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

  async function salvarCalculo(dados, verbas, totalAtualizado) {
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
        user_id:          (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()
    if (errCalc) throw errCalc

    // Inserir verbas
    if (verbas.length > 0) {
      const rows = verbas.map(v => ({
        calculo_id:        calculo.id,
        tipo:              v.tipo,
        valor_original:    parseFloat(v.valorOriginal),
        em_dobro:          v.emDobro,
        indice:            v.indice,
        termo_inicial:     v.termoInicial,
        data_personalizada:v.dataPersonalizada || null,
        data_citacao:      v.dataCitacao       || null,
        incluir_juros:     v.incluirJuros,
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

  return { calculos, loading, error, salvarCalculo, atualizarStatus, refetch: fetch }
}
