// LEX CALCULATOR — séries oficiais do Banco Central (SGS): INPC=188, IPCA=433, SELIC=4390.
// Antes era a edge function "indices" do Supabase; veio para a Vercel na migração do banco
// para a conta da LexGroup. Exige usuário logado. O SGS limita ~10 anos por consulta:
// buscamos em blocos de 9 anos e mesclamos. Devolve { serie: { "AAAA-MM": variação % } }.
import { usuarioLogado } from "./_auth.js"

const CODIGOS = { INPC: 188, IPCA: 433, SELIC: 4390 }
const fmt = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
const parseBR = (s) => { const [dd, mm, yy] = s.split("/").map(Number); return new Date(yy, (mm || 1) - 1, dd || 1) }

async function janela(cod, ini, fim, tentativa = 0) {
  const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cod}/dados?formato=json&dataInicial=${fmt(ini)}&dataFinal=${fmt(fim)}`, { headers: { Accept: "application/json" } })
  const texto = await r.text()
  if (!r.ok || texto.trimStart().startsWith("<")) {
    if (tentativa < 2) { await new Promise(ok => setTimeout(ok, 400 * (tentativa + 1))); return janela(cod, ini, fim, tentativa + 1) }
    throw new Error(`BACEN ${r.status} para ${fmt(ini)}–${fmt(fim)}`)
  }
  return JSON.parse(texto)
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." })
  if (!(await usuarioLogado(req))) return res.status(401).json({ error: "Faça login para buscar os índices." })
  try {
    const { indice = "", dataInicial = "", dataFinal = "" } = req.body || {}
    const ind = String(indice).toUpperCase()
    const cod = CODIGOS[ind]
    if (!cod) return res.status(400).json({ error: `Índice inválido: ${ind}. Use INPC, IPCA ou SELIC.` })
    const ini = dataInicial ? parseBR(dataInicial) : new Date(2010, 0, 1)
    const fim = dataFinal ? parseBR(dataFinal) : new Date()
    const serie = {}
    for (let cursor = new Date(ini); cursor <= fim;) {
      const fimBloco = new Date(cursor.getFullYear() + 9, cursor.getMonth(), cursor.getDate())
      const ate = fimBloco < fim ? fimBloco : fim
      for (const { data, valor } of await janela(cod, cursor, ate)) {
        const [, mes, ano] = data.split("/")
        serie[`${ano}-${mes}`] = parseFloat(valor)
      }
      cursor = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate() + 1)
    }
    res.setHeader("Cache-Control", "private, max-age=3600")
    return res.status(200).json({ indice: ind, codigo: cod, serie, meses: Object.keys(serie).length })
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) })
  }
}
