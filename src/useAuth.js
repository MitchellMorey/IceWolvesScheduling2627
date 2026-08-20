import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Tracks the current Supabase Auth session and whether that signed-in
// user's email is on the approved_editors allowlist. Viewing the schedule
// never requires being signed in - this only ever gates writes/edit UI.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [isEditor, setIsEditor] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const email = session?.user?.email
    if (!email) {
      setIsEditor(false)
      return
    }
    let cancelled = false
    supabase
      .from('approved_editors')
      .select('email')
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsEditor(!!data)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.email])

  async function sendMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return {
    session,
    userEmail: session?.user?.email || null,
    isEditor,
    authLoading,
    sendMagicLink,
    signOut,
  }
}
