'use client'

import { create } from 'zustand'
import { CartItem, SelectedOption, MenuItem } from './supabase'

interface CartStore {
  items: CartItem[]
  tableNumber: number
  setTableNumber: (n: number) => void
  addItem: (menuItem: MenuItem, selectedOptions: SelectedOption[]) => void
  updateQty: (index: number, qty: number) => void
  removeItem: (index: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableNumber: 1,
  setTableNumber: (n) => set({ tableNumber: n }),
  addItem: (menuItem, selectedOptions) => {
    const extraPrice = selectedOptions.reduce((s, o) => s + o.extra_price, 0)
    const itemPrice = menuItem.price + extraPrice
    set((state) => ({ items: [...state.items, { menuItem, quantity: 1, selectedOptions, itemPrice }] }))
  },
  updateQty: (index, qty) => {
    if (qty <= 0) {
      get().removeItem(index)
      return
    }
    set((state) => {
      const items = [...state.items]
      items[index] = { ...items[index], quantity: qty }
      return { items }
    })
  },
  removeItem: (index) =>
    set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((s, item) => s + item.itemPrice * item.quantity, 0),
}))
