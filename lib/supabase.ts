import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TemperatureFeeling = 'cold' | 'good' | 'hot'

export interface Feedback {
  id: string
  table_number: number
  temperature_feeling: TemperatureFeeling
  comment: string | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}
