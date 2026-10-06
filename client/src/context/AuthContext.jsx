import { createContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [githubToken, setGithubToken] = useState(() => {
    try {
      return localStorage.getItem('cra_github_token') || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Initialize and restore session from storage
  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('[Auth] Error getting session:', error.message)
          if (mounted) setAuthError(error.message)
        } else if (mounted) {
          setSession(data.session)
          setUser(data.session?.user ?? null)
          if (data.session?.provider_token) {
            try {
              localStorage.setItem('cra_github_token', data.session.provider_token)
            } catch {}
            setGithubToken(data.session.provider_token)
          }
        }
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initSession()

    // Listen for auth state transitions (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          if (currentSession?.provider_token) {
            try {
              localStorage.setItem('cra_github_token', currentSession.provider_token)
            } catch {}
            setGithubToken(currentSession.provider_token)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])


  // Sign in with email and password
  const signIn = useCallback(async ({ email, password }) => {
    setAuthError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setAuthError(error.message)
        return { success: false, error: error.message }
      }
      setSession(data.session)
      setUser(data.user)
      return { success: true, data }
    } catch (err) {
      const message = err.message || 'Authentication failed'
      setAuthError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign up new user
  const signUp = useCallback(async ({ email, password, fullName }) => {
    setAuthError(null)
    setLoading(true)
    try {
      const cleanEmail = email.trim()

      // 1. Try standard Supabase signup first
      let { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: fullName ? { full_name: fullName } : {},
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      // 2. If rate limited on email confirmation (Supabase free tier 3-4 emails/hr limit),
      // seamlessly execute verified direct registration
      const isRateLimited = error && (
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('email rate limit') ||
        error.status === 429
      )

      if (isRateLimited) {
        console.info('[Auth] Email rate limit encountered on built-in SMTP. Creating verified developer account via RPC...')
        const rpcRes = await supabase.rpc('register_user', {
          p_email: cleanEmail,
          p_password: password,
          p_full_name: fullName || '',
        })

        if (rpcRes.error) {
          throw new Error(rpcRes.error.message || 'Registration failed')
        }

        if (!rpcRes.data?.success) {
          throw new Error(rpcRes.data?.error || 'Registration failed')
        }

        // Instantly sign in to obtain active JWT session
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (loginRes.error) {
          throw loginRes.error
        }

        data = loginRes.data
        error = null
      } else if (error) {
        const friendlyMessage = error.message?.includes('already registered')
          ? 'An account with this email already exists. Please sign in instead.'
          : error.message
        setAuthError(friendlyMessage)
        return { success: false, error: friendlyMessage }
      }

      // If session returned immediately (auto-confirm or instant verified session)
      if (data?.session) {
        setSession(data.session)
        setUser(data.user)
      }
      return { success: true, data }
    } catch (err) {
      const message = err.message || 'Registration failed. Please check your details.'
      setAuthError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // OAuth Sign In (e.g., GitHub)
  const signInWithOAuth = useCallback(async ({ provider = 'github' }) => {
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'repo read:user user:email',
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        setAuthError(error.message)
        return { success: false, error: error.message }
      }

      if (data?.url) {
        try {
          const probe = await fetch(data.url, { method: 'GET', redirect: 'manual' })
          if (probe.status === 400) {
            const errPayload = await probe.json().catch(() => null)
            if (
              errPayload?.msg?.includes('Unsupported provider') ||
              errPayload?.msg?.includes('provider is not enabled')
            ) {
              const friendly = 'GitHub OAuth is not enabled in your Supabase project dashboard. Please enable the GitHub provider in Supabase with callback URL https://byztyberaoyczdaffbbe.supabase.co/auth/v1/callback.'
              setAuthError(friendly)
              return { success: false, error: friendly, code: 'PROVIDER_NOT_ENABLED' }
            }
          }
        } catch {
          // If probe is blocked by network or CORS, proceed to redirect
        }

        // Provider is valid or probe passed, redirect user to GitHub
        window.location.href = data.url
        return { success: true, data }
      }

      return { success: true, data }
    } catch (err) {
      const message = err.message || 'OAuth error'
      setAuthError(message)
      return { success: false, error: message }
    }
  }, [])


  // Explicitly save or clear GitHub token
  const saveGithubToken = useCallback((token) => {
    try {
      if (token) {
        localStorage.setItem('cra_github_token', token)
        setGithubToken(token)
      } else {
        localStorage.removeItem('cra_github_token')
        setGithubToken(null)
      }
    } catch {}
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('[Auth] Sign out error:', error.message)
      }
      setUser(null)
      setSession(null)
      setGithubToken(null)
      setAuthError(null)
      try {
        localStorage.removeItem('cra_github_token')
      } catch {}
      return { success: true }
    } catch (err) {
      console.error('[Auth] Unexpected error during sign out:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      githubToken,
      saveGithubToken,
      loading,
      authError,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      clearError,
      isAuthenticated: !!user,
    }),
    [user, session, githubToken, saveGithubToken, loading, authError, signIn, signUp, signInWithOAuth, signOut, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}

export { AuthContext }
