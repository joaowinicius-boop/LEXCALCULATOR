import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(authUser) {
    if (!authUser) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    // Sessão atual ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    // Escuta mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    return data.user
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  // Expõe user enriquecido com dados do perfil
  const enrichedUser = user && profile ? {
    ...user,
    name:  profile.name,
    oab:   profile.oab,
    role:  profile.role,
  } : user ? {
    ...user,
    name:  user.user_metadata?.name  ?? user.email?.split('@')[0],
    oab:   user.user_metadata?.oab   ?? '',
    role:  user.user_metadata?.role  ?? 'colaborador',
  } : null

  return (
    <AuthContext.Provider value={{ user: enrichedUser, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
