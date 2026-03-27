import { ref, watch } from "vue"
import type { LinkPreview } from "@/types/comments"

export function useLinkPreview(textRef: { value: string }) {
   const linkPreview = ref<LinkPreview | null>(null)
   const isFetchingPreview = ref(false)
   let debounceTimer: ReturnType<typeof setTimeout>
   // link expration
   const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g

   const fetchLinkPreview = async (url: string) => {
      isFetchingPreview.value = true
      try {
         const targetUrl = url.startsWith('http') ? url : `https://${url}`
         const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}`

         const response = await fetch(apiUrl)
         const result = await response.json()

         if (result.status === 'success') {
            const { data } = result
            linkPreview.value = {
               title: data.title,
               description: data.description,
               image: data.image?.url || data.logo?.url || '',
               url: targetUrl
            }
         }
      } catch (e) {
         linkPreview.value = null
      } finally {
         isFetchingPreview.value = false
      }
   }


   watch(() => textRef.value, (newVal) => {
      clearTimeout(debounceTimer)
      const found = newVal.match(urlRegex)
      const currentUrl = found ? found[0] : null

      if (!currentUrl) {
         linkPreview.value = null
         return
      }

      if (currentUrl && (!linkPreview.value || linkPreview.value.url !== currentUrl)) {
         debounceTimer = setTimeout(() => fetchLinkPreview(currentUrl), 600)
      }
   })

   return {
      linkPreview,
      isFetchingPreview
   }
}