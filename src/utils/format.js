const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatPrice(price) {
  return priceFormatter.format(price ?? 0)
}
