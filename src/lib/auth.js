/**
 * @file auth.js
 * @author Peter Hajj
 * @description Auth helpers for Supabase Google OAuth, restricted to @merrimack.edu accounts.
 */

import { supabase } from './supabase'

/**
 * Redirects the user through Google OAuth and back to /admin on success.
 * @returns {Promise<void>}
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/admin`,
    },
  })
  if (error) throw error
}

/**
 * Clears the active session and signs the user out.
 * @returns {Promise<void>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Returns the current session, or null if no user is signed in.
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Returns true only if the signed-in user's email is in the admins allowlist.
 * Signs the user out automatically if their email is not @merrimack.edu.
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
  const session = await getSession()
  if (!session) return false

  if (!session.user.email.endsWith('@merrimack.edu')) {
    await supabase.auth.signOut()
    return false
  }

  const { data, error } = await supabase
    .from('admins')
    .select('email')
    .eq('email', session.user.email)
    .single()

  return !error && !!data
}
