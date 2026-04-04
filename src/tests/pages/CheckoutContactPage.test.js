import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { addDoc } from 'firebase/firestore'
import { useCartStore } from '../../stores/cart.js'
import CheckoutContactPage from '../../pages/CheckoutContactPage.vue'

const STORE_ID = 'store-abc'
const mockBack = vi.fn()
const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: STORE_ID } }),
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}))

vi.mock('../../components/IconButton.vue', () => ({
  default: { template: '<button />' },
}))

function mountPage(cartItems = []) {
  setActivePinia(createPinia())
  const cartStore = useCartStore()
  cartItems.forEach((item) => {
    for (let i = 0; i < item.qty; i++) {
      cartStore.addItem(STORE_ID, item.product)
    }
  })
  return {
    wrapper: mount(CheckoutContactPage, {
      global: { stubs: { 'iconify-icon': { template: '<span />' } } },
    }),
    cartStore,
  }
}

describe('CheckoutContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name and phone input fields', () => {
    const { wrapper } = mountPage()
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
    expect(wrapper.find('input[type="tel"]').exists()).toBe(true)
  })

  it('shows validation error when name is empty', async () => {
    const { wrapper } = mountPage()
    await wrapper.find('.place-order-btn').trigger('click')
    expect(wrapper.find('.form-error').text()).toContain('name')
  })

  it('shows validation error when phone is empty', async () => {
    const { wrapper } = mountPage()
    await wrapper.find('input[autocomplete="name"]').setValue('Jane')
    await wrapper.find('.place-order-btn').trigger('click')
    expect(wrapper.find('.form-error').text()).toContain('phone')
  })

  it('calls addDoc with correct order shape on submit', async () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper } = mountPage([{ product, qty: 2 }])

    await wrapper.find('input[autocomplete="name"]').setValue('Jane Smith')
    await wrapper.find('input[type="tel"]').setValue('+1 555 000 1234')
    await wrapper.find('.place-order-btn').trigger('click')
    await new Promise((r) => setTimeout(r, 0))

    expect(addDoc).toHaveBeenCalledOnce()
    const [, orderData] = addDoc.mock.calls[0]
    expect(orderData.buyerName).toBe('Jane Smith')
    expect(orderData.buyerPhone).toBe('+1 555 000 1234')
    expect(orderData.status).toBe('pending')
    expect(orderData.shipping).toBe(10)
    expect(orderData.subtotal).toBe(50)
    expect(orderData.total).toBe(60)
  })

  it('clears cart and navigates to order-success on success', async () => {
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper, cartStore } = mountPage([{ product, qty: 1 }])

    await wrapper.find('input[autocomplete="name"]').setValue('Jane')
    await wrapper.find('input[type="tel"]').setValue('+1555')
    await wrapper.find('.place-order-btn').trigger('click')
    await new Promise((r) => setTimeout(r, 0))

    expect(cartStore.cartItems(STORE_ID).value).toHaveLength(0)
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'order-success', params: { storeId: STORE_ID } })
    )
  })

  it('still clears cart and navigates even when addDoc rejects', async () => {
    addDoc.mockRejectedValueOnce(new Error('Network error'))
    const product = { id: 'p1', name: 'Widget', price: 25 }
    const { wrapper } = mountPage([{ product, qty: 1 }])

    await wrapper.find('input[autocomplete="name"]').setValue('Jane')
    await wrapper.find('input[type="tel"]').setValue('+1555')
    await wrapper.find('.place-order-btn').trigger('click')
    await new Promise((r) => setTimeout(r, 0))

    expect(mockReplace).toHaveBeenCalled()
  })
})
