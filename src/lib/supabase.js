import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kjztuuwqyeuuljprhhzf.supabase.co"

// Restored the working key that was previously used because the JWT one provided was truncated
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ByIJTUJ_5dOjZr0y30FQsQ_fKO85bOX"

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})