import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pthwlnuqrpuproongsrb.supabase.co"
const supabaseAnonKey = "sb_publishable_SfmcaZ140cAc4dqMX5jfTg_pams6iGZ"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)