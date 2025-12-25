import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('CRITICAL WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.')
} else if (supabaseServiceRoleKey.length < 40) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY seems too short. Check if it is correct.')
}

// Este cliente tiene privilegios de superusuario. ÚSALO SOLO EN EL SERVIDOR.
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})