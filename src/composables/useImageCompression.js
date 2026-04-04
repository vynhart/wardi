/**
 * Compresses an image file to a JPEG blob, resizing if either dimension exceeds maxPx.
 *
 * @param {File} file - The source image file
 * @param {number} maxPx - Maximum width or height in pixels (default 1200)
 * @param {number} quality - JPEG quality 0–1 (default 0.8)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxPx = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx)
          width = maxPx
        } else {
          width = Math.round((width / height) * maxPx)
          height = maxPx
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    img.src = objectUrl
  })
}
