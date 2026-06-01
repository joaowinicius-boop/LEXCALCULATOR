import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const USERS = [
  { id: 1, email: 'nicolas@nicolasgomesadv.com.br', senha: 'ng2026', name: 'Nicolas Gomes', oab: 'OAB/AM 8.926', role: 'Advogado' },
  { id: 2, email: 'joao@nicolasgomesadv.com.br', senha: 'ng2026', name: 'João Winicius', oab: '', role: 'Colaborador' },
  { id: 3, email: 'admin', senha: 'admin', name: 'Administrador', oab: '', role: 'Admin' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lex_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  function login(email, senha) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = USERS.find(u =>
          u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        )
        if (found) {
          const { senha: _, ...safe } = found
          setUser(safe)
          localStorage.setItem('lex_user', JSON.stringify(safe))
          resolve(safe)
        } else {
          reject(new Error('Credenciais inválidas'))
        }
      }, 600)
    })
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('lex_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
