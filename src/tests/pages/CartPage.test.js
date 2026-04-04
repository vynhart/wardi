import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../../stores/cart.js'
import CartPage from '../../pages/CartPage.vue'

const STORE_ID = 'store-abc'
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: STORE_ID } }),
  useRouter: () => ({ back: vi.fn(), push: mockPush }),
}))

vi.mock('../../components/IconButton.vue', () => ({
  default: { template: '<button />' },
}))

vi.mock('../../components/QtyControl.vue', () => ({
  default: {
    props: ['qty'],
    emits: ['increase', 'decrease'],
    template: '<div><button class="inc" @click="$emit(\'increase\')">+</button><button class="dec" @click="$emit(\'decrease\')">-</button></div>',
  },
}))

function mountPage(items = []) {
  setActivePinia(createPinia())
  const cartStore = useCartStore()
  items.forEach(({ product, qty }) => {
    for (let i = 0; i < qty; i++) cartStore.addItem(STORE_ID, product)
  })
  return {
    wrapper: mount(CartPage, { global: { stubs: { 'iconify-icon': { template: '<span />' } } } }),
    cartStore,
  }
}

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when cart is empty', () => {
    const { wrapper } = mountPage()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Your cart is empty')
  })

  it('renders each cart item with name and price', () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper } = mountPage([{ product, qty: 2 }])
    expect(wrapper.text()).toContain('Widget')
    expect(wrapper.text()).toContain('$50.00')
  })

  it('shows subtotal, shipping, and total in order summary', () => {
    const product = { id: 'p1', name: 'Widget', price: 30 }
    const { wrapper } = mountPage([{ product, qty: 1 }])
    expect(wrapper.text()).toContain('$30.00') // subtotal
    expect(wrapper.text()).toContain('$10.00') // shipping
    expect(wrapper.text()).toContain('$40.00') // total
  })

  it('calls setQty to increment when + is clicked', async () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper, cartStore } = mountPage([{ product, qty: 1 }])
    await wrapper.find('.inc').trigger('click')
    expect(cartStore.carts[STORE_ID][product.id].qty).toBe(2)
  })

  it('calls setQty to decrement when - is clicked', async () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper, cartStore } = mountPage([{ product, qty: 2 }])
    await wrapper.find('.dec').trigger('click')
    expect(cartStore.carts[STORE_ID][product.id].qty).toBe(1)
  })

  it('navigates to checkout when Checkout button is clicked', async () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper } = mountPage([{ product, qty: 1 }])
    await wrapper.find('.checkout-btn').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'checkout', params: { storeId: STORE_ID } })
  })

  it('does not show checkout footer when cart is empty', () => {
    const { wrapper } = mountPage()
    expect(wrapper.find('.checkout-footer').exists()).toBe(false)
  })
})
