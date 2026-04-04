import { onUnmounted } from 'vue'

/**
 * Tracks Firestore onSnapshot unsubscribe functions and calls them on unmount.
 *
 * Usage:
 *   const { addListener } = useFirestoreListeners()
 *   onMounted(() => {
 *     addListener(onSnapshot(..., handler))
 *   })
 */
export function useFirestoreListeners() {
  const unsubs = []

  function addListener(unsub) {
    if (typeof unsub === 'function') unsubs.push(unsub)
  }

  onUnmounted(() => {
    unsubs.forEach((fn) => fn())
  })

  return { addListener }
}
