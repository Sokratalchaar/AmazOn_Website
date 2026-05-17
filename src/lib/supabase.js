import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kjztuuwqyeuuljprhhzf.supabase.co"

// Restored the working key that was previously used because the JWT one provided was truncated
const supabaseKey = "sb_publishable_ByIJTUJ_5dOjZr0y30FQsQ_fKO85bOX"

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})