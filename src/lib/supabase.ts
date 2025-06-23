import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY!

// Client for regular operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default supabase 