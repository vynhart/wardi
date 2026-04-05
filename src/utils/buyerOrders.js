const STORAGE_KEY = 'wardi_buyer_orders'

export function saveOrderId(storeId, orderId) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  if (!data[storeId]) data[storeId] = []
  if (!data[storeId].includes(orderId)) {
    data[storeId].push(orderId)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getOrderIds(storeId) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  return data[storeId] || []
}
