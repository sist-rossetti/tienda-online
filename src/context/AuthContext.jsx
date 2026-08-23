import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEmployee(userId) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single()
      setEmployee(data)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchEmployee(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchEmployee(session.user.id)
      else {
        setEmployee(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, employee, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
