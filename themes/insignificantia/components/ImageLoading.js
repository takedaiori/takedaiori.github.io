import { useEffect } from 'react'

// The document-level controller also sees SSR images before this component mounts.
const ImageLoading = () => {
  useEffect(() => {
    document.dispatchEvent(new Event('ins-images-scan'))
  }, [])
  return null
}

export default ImageLoading
