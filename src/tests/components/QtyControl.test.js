import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QtyControl from '../../components/QtyControl.vue'

describe('QtyControl', () => {
  it('renders the current qty', () => {
    const wrapper = mount(QtyControl, { props: { qty: 3 }, global: { stubs: { 'iconify-icon': { template: '<span />' } } } })
    expect(wrapper.find('.qty-value').text()).toBe('3')
  })

  it('emits "increase" when + button is clicked', async () => {
    const wrapper = mount(QtyControl, { props: { qty: 1 }, global: { stubs: { 'iconify-icon': { template: '<span />' } } } })
    await wrapper.findAll('.qty-btn')[1].trigger('click')
    expect(wrapper.emitted('increase')).toHaveLength(1)
  })

  it('emits "decrease" when - button is clicked', async () => {
    const wrapper = mount(QtyControl, { props: { qty: 2 }, global: { stubs: { 'iconify-icon': { template: '<span />' } } } })
    await wrapper.findAll('.qty-btn')[0].trigger('click')
    expect(wrapper.emitted('decrease')).toHaveLength(1)
  })

  it('updates displayed qty when prop changes', async () => {
    const wrapper = mount(QtyControl, { props: { qty: 1 }, global: { stubs: { 'iconify-icon': { template: '<span />' } } } })
    await wrapper.setProps({ qty: 5 })
    expect(wrapper.find('.qty-value').text()).toBe('5')
  })
})
