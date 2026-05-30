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

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
  is_fixed: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_sold_out: boolean
  sort_order: number
  created_at: string
}

export interface OptionGroup {
  id: string
  menu_item_id: string
  name: string
  is_required: boolean
  created_at: string
  options?: Option[]
}

export interface Option {
  id: string
  option_group_id: string
  name: string
  extra_price: number
  created_at: string
}

export interface Order {
  id: string
  table_number: number
  status: 'pending' | 'cooking' | 'served' | 'cancelled'
  total_price: number
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  selected_options: SelectedOption[] | null
  item_price: number
  created_at: string
  menu_items?: MenuItem
}

export interface SelectedOption {
  group_name: string
  option_name: string
  extra_price: number
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedOptions: SelectedOption[]
  itemPrice: number
}
