/**
 * @file supabase.js
 * @author Peter Hajj
 * @description Initializes and exports the Supabase client used across the app for database and storage access.
 */

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
