import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'wardi_cart'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useCartStore = defineStore('cart', () => {
  // Shape: { [storeId]: { [productId]: { product, qty } } }
  const carts = ref(loadFromStorage())

  function getStoreCart(storeId) {
    return carts.value[storeId] ?? {}
  }

  function addItem(storeId, product) {
    if (!carts.value[storeId]) {
      carts.value[storeId] = {}
    }
    const cart = carts.value[storeId]
    if (cart[product.id]) {
      cart[product.id].qty += 1
    } else {
      cart[product.id] = { product, qty: 1 }
    }
    saveToStorage(carts.value)
  }

  function setQty(storeId, productId, qty) {
    if (!carts.value[storeId]) return
    const cart = carts.value[storeId]
    if (qty <= 0) {
      delete cart[productId]
    } else {
      if (cart[productId]) {
        cart[productId].qty = qty
      }
    }
    saveToStorage(carts.value)
  }

  function removeItem(storeId, productId) {
    if (!carts.value[storeId]) return
    delete carts.value[storeId][productId]
    saveToStorage(carts.value)
  }

  function cartItems(storeId) {
    return computed(() => Object.values(getStoreCart(storeId)))
  }

  function cartCount(storeId) {
    return computed(() =>
      Object.values(getStoreCart(storeId)).reduce((sum, entry) => sum + entry.qty, 0)
    )
  }

  function cartSubtotal(storeId) {
    return computed(() =>
      Object.values(getStoreCart(storeId)).reduce(
        (sum, entry) => sum + entry.product.price * entry.qty,
        0
      )
    )
  }

  function clearCart(storeId) {
    carts.value[storeId] = {}
    saveToStorage(carts.value)
  }

  return { carts, addItem, setQty, removeItem, cartItems, cartCount, cartSubtotal, clearCart }
})
