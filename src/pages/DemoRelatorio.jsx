import { useEffect, useState } from 'react'
import { carregarSeries } from '../lib/indices.js'
import { calcularProcesso } from '../utils/calcularJuridico.js'
import Relatorio from './Relatorio.jsx'

// Página TEMPORÁRIA de validação visual (caso NIBSON — modelos do Cálculo Jurídico).
export default function DemoRelatorio() {
  const [rel, setRel] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { INPC, IPCA, SELIC } = await carregarSeries(['INPC', 'IPCA', 'SELIC'])
        const TERMO = '2026-01-14'

        const descontos = [
          ['2016-04-15', 10.57], ['2016-05-16', 71.81], ['2016-06-15', 523.96], ['2016-07-15', 675.27],
          ['2016-08-15', 8.14], ['2016-09-15', 225.33], ['2017-01-23', 211.89], ['2017-04-07', 5.50],
          ['2017-05-08', 639.31], ['2017-06-07', 1172.30], ['2017-08-02', 890.69], ['2017-09-29', 1184.35],
          ['2018-07-30', 894.29],
        ].map(([data, valor]) => ({ data, valor }))

        const proc = calcularProcesso([
          {
            tipo: 'dano_material', indice: 'INPC', serie: INPC, emDobro: true,
            juros: { tipo: 'fixo_1', dataInicio: '2025-05-05' }, parcelas: descontos,
          },
          {
            tipo: 'dano_moral', indice: 'IPCA', serie: IPCA, emDobro: false,
            juros: { tipo: 'taxa_legal', dataInicio: '2025-05-05', serieSelic: SELIC, serieIpca: IPCA },
            parcelas: [{ data: '2025-10-18', valor: 10000 }],
          },
        ], { termoFinal: TERMO, honorariosPercentual: 15 })

        const hoje = new Date()
        setRel({
          meta: {
            cliente: 'NIBSON GONCALVES DA ROCHA',
            processo: '0000449-38.2025.8.04.2800',
            executada: 'Banco Réu S/A',
            vara: 'Vara Única da Comarca de Benjamin Constant/AM',
          },
          geradoEm: hoje.toLocaleDateString('pt-BR'),
          proc,
        })
      } catch (e) {
        setErro(e.message)
      }
    })()
  }, [])

  if (erro) return <div style={{ padding: 40, color: 'crimson' }}>Erro: {erro}</div>
  if (!rel) return <div style={{ padding: 40 }}>Carregando índices oficiais…</div>
  return <Relatorio relatorio={rel} />
}
