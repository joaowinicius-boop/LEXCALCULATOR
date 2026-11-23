// Confere no Supabase Auth se o token do header Authorization é de um usuário logado de verdade
// (assinatura e expiração). Arquivo com "_" não vira rota na Vercel.
import { SUPABASE_URL, SUPABASE_ANON } from "../src/lib/supabase.js"

export async function usuarioLogado(req) {
  const tok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  if (!tok) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${tok}` } })
    return r.ok && !!(await r.json())?.id
  } catch { return false }
}
