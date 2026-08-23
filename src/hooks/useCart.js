import { useEffect, useState } from 'react'

const STORAGE_KEY = 'abm-shop-cart'

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCart() {
  const [cart, setCart] = useState(readCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // localStorage puede no estar disponible (modo privado, cuota llena, etc.)
    }
  }, [cart])

  return [cart, setCart]
}
