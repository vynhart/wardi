import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../../stores/cart.js'

const STORE_ID = 'store-abc'
const PRODUCT = { id: 'prod-1', name: 'Widget', price: 25 }
const PRODUCT_2 = { id: 'prod-2', name: 'Gadget', price: 10 }

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('addItem', () => {
  it('adds a new item with qty 1', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    expect(cart.carts[STORE_ID][PRODUCT.id].qty).toBe(1)
  })

  it('increments qty when item already exists', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.addItem(STORE_ID, PRODUCT)
    expect(cart.carts[STORE_ID][PRODUCT.id].qty).toBe(2)
  })

  it('stores the product reference', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    expect(cart.carts[STORE_ID][PRODUCT.id].product).toEqual(PRODUCT)
  })
})

describe('setQty', () => {
  it('sets the exact quantity', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.setQty(STORE_ID, PRODUCT.id, 5)
    expect(cart.carts[STORE_ID][PRODUCT.id].qty).toBe(5)
  })

  it('removes item when qty is set to 0', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.setQty(STORE_ID, PRODUCT.id, 0)
    expect(cart.carts[STORE_ID][PRODUCT.id]).toBeUndefined()
  })

  it('removes item when qty is negative', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.setQty(STORE_ID, PRODUCT.id, -1)
    expect(cart.carts[STORE_ID][PRODUCT.id]).toBeUndefined()
  })

  it('does nothing if store cart does not exist', () => {
    const cart = useCartStore()
    expect(() => cart.setQty('nonexistent', PRODUCT.id, 3)).not.toThrow()
  })
})

describe('removeItem', () => {
  it('deletes the item from the cart', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.removeItem(STORE_ID, PRODUCT.id)
    expect(cart.carts[STORE_ID][PRODUCT.id]).toBeUndefined()
  })

  it('does nothing if store cart does not exist', () => {
    const cart = useCartStore()
    expect(() => cart.removeItem('nonexistent', PRODUCT.id)).not.toThrow()
  })
})

describe('cartCount', () => {
  it('returns 0 for empty cart', () => {
    const cart = useCartStore()
    expect(cart.cartCount(STORE_ID).value).toBe(0)
  })

  it('sums all item quantities', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.addItem(STORE_ID, PRODUCT)
    cart.addItem(STORE_ID, PRODUCT_2)
    expect(cart.cartCount(STORE_ID).value).toBe(3)
  })
})

describe('cartSubtotal', () => {
  it('returns 0 for empty cart', () => {
    const cart = useCartStore()
    expect(cart.cartSubtotal(STORE_ID).value).toBe(0)
  })

  it('computes price × qty for each item and sums', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)   // 25 × 1
    cart.addItem(STORE_ID, PRODUCT)   // 25 × 2
    cart.addItem(STORE_ID, PRODUCT_2) // 10 × 1
    // 50 + 10 = 60
    expect(cart.cartSubtotal(STORE_ID).value).toBe(60)
  })
})

describe('clearCart', () => {
  it('empties the cart for the given store', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.clearCart(STORE_ID)
    expect(cart.cartItems(STORE_ID).value).toHaveLength(0)
  })

  it('does not affect other stores', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    cart.addItem('other-store', PRODUCT_2)
    cart.clearCart(STORE_ID)
    expect(cart.cartItems('other-store').value).toHaveLength(1)
  })
})

describe('localStorage persistence', () => {
  it('writes to localStorage on mutation', () => {
    const cart = useCartStore()
    cart.addItem(STORE_ID, PRODUCT)
    const stored = JSON.parse(localStorage.getItem('wardi_cart'))
    expect(stored[STORE_ID][PRODUCT.id].qty).toBe(1)
  })

  it('rehydrates from localStorage on store init', () => {
    const initial = { [STORE_ID]: { [PRODUCT.id]: { product: PRODUCT, qty: 3 } } }
    localStorage.setItem('wardi_cart', JSON.stringify(initial))

    setActivePinia(createPinia())
    const cart = useCartStore()
    expect(cart.carts[STORE_ID][PRODUCT.id].qty).toBe(3)
  })
})
