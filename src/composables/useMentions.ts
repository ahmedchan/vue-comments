import { ref, unref, computed, nextTick, type CSSProperties, onUnmounted } from "vue"

export function useMention(users: string[], textContent: { value: string }) {
   const showMentions = ref(false)
   const mentionQuery = ref('')
   const selectedIndex = ref(0)
   const textareaRef = ref<HTMLTextAreaElement | null>(null)
   const floatingStyle = ref<CSSProperties>({});
   let resizeObserver: ResizeObserver | null = null


   const filteredUsers = computed(() => {
      const allUsers = unref(users) || []
      const query = mentionQuery.value.toLowerCase()

      return allUsers.filter((u) =>
         u.toLowerCase().startsWith(query)
      )
   })

   const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
      const div = document.createElement('div')
      const style = window.getComputedStyle(element)

      // Copy all font and layout styles to the mirror div
      const properties = [
         'direction',
         'boxSizing',
         'width',
         'height',
         'overflowX',
         'overflowY',
         'borderTopWidth',
         'borderRightWidth',
         'borderBottomWidth',
         'borderLeftWidth',
         'paddingTop',
         'paddingRight',
         'paddingBottom',
         'paddingLeft',
         'fontStyle',
         'fontVariant',
         'fontWeight',
         'fontStretch',
         'fontSize',
         'fontSizeAdjust',
         'lineHeight',
         'fontFamily',
         'textAlign',
         'textTransform',
         'textIndent',
         'letterSpacing',
         'wordSpacing',
      ]

      div.style.position = 'absolute'
      div.style.visibility = 'hidden'
      div.style.whiteSpace = 'pre-wrap'
      div.style.wordWrap = 'break-word'

      properties.forEach((prop) => {
         ; (div.style as any)[prop] = (style as any)[prop]
      })

      div.textContent = element.value.substring(0, position)

      const span = document.createElement('span')
      span.textContent = element.value.substring(position) || '.'
      div.appendChild(span)

      document.body.appendChild(div)
      const { offsetTop, offsetLeft } = span
      document.body.removeChild(div)

      return { top: offsetTop, left: offsetLeft }
   }

   // Helper to refresh position without a new input event
   const updateFloatingPosition = () => {
      if (!showMentions.value || !textareaRef.value) return

      const el = textareaRef.value
      const cursor = el.selectionStart
      const { top, left } = getCaretCoordinates(el, cursor)
      const rect = el.getBoundingClientRect()

      const dropdownWidth = 180
      const buffer = 15 // Safety padding from screen edges
      const lineHeight = 24

      // 1. Calculate the caret's exact position relative to the viewport
      const caretVisibleTop = rect.top + top - el.scrollTop
      const caretVisibleLeft = rect.left + left - el.scrollLeft

      // 2. Calculate available vertical space
      const spaceBelow = window.innerHeight - (caretVisibleTop + lineHeight) - buffer
      const spaceAbove = caretVisibleTop - buffer

      // 3. Determine if we should flip (if space below < 150px and there's more room above)
      const shouldFlip = spaceBelow < 150 && spaceAbove > spaceBelow

      // 4. Horizontal boundary check (don't go off the right edge)
      let finalLeft = caretVisibleLeft
      if (finalLeft + dropdownWidth > window.innerWidth) {
         finalLeft = window.innerWidth - dropdownWidth - buffer
      }
      // Also check left edge
      if (finalLeft < buffer) finalLeft = buffer

      // 5. Apply Dynamic Styles
      if (shouldFlip) {
         floatingStyle.value = {
            position: 'fixed',
            bottom: `${window.innerHeight - caretVisibleTop + 4}px`,
            left: `${finalLeft}px`,
            width: `${dropdownWidth}px`,
            maxHeight: `${spaceAbove}px`, // Grow up to the top of the screen
            top: 'auto',
            overflowY: 'auto',
            zIndex: 9999
         }
      } else {
         floatingStyle.value = {
            position: 'fixed',
            top: `${caretVisibleTop + lineHeight}px`,
            left: `${finalLeft}px`,
            width: `${dropdownWidth}px`,
            maxHeight: `${spaceBelow}px`, // Grow down to the bottom of the screen
            bottom: 'auto',
            overflowY: 'auto',
            zIndex: 9999
         }
      }
   }

   // Initialize the observer when the textarea is available
   const initObserver = (el: HTMLTextAreaElement) => {
      textareaRef.value = el
      resizeObserver = new ResizeObserver(() => {
         if (showMentions.value) updateFloatingPosition()
      })
      resizeObserver.observe(el)

      // Also track window resize/scroll for fixed positioning
      window.addEventListener('resize', updateFloatingPosition)
      window.addEventListener('scroll', updateFloatingPosition, { capture: true, passive: true })
   }

   onUnmounted(() => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateFloatingPosition)
      window.removeEventListener('scroll', updateFloatingPosition)
   })

   const handleInput = (e: Event) => {
      const el = e.target as HTMLTextAreaElement
      const cursor = el.selectionStart
      const textBefore = el.value.substring(0, cursor)
      if (!textareaRef.value) initObserver(el) // Set up once

      // Regex to find the last "@" that isn't followed by a space
      const match = textBefore.match(/@(\w*)$/)

      if (match) {
         mentionQuery.value = match?.[1] ?? ''

         if (filteredUsers.value.length > 0) {
            showMentions.value = true
            selectedIndex.value = 0
            nextTick(updateFloatingPosition)
         } else {
            showMentions.value = false
         }

      } else {
         showMentions.value = false
      }
   }

   const insertMention = (user: string) => {
      const el = textareaRef.value
      if (!el) return

      const cursor = el.selectionStart
      const textBefore = el.value.substring(0, cursor)
      const textAfter = el.value.substring(cursor)

      // Replace the "@query" part with the selected user
      const newTextBefore = textBefore.replace(/@(\w*)$/, `@${user} `)

      textContent.value = newTextBefore + textAfter
      showMentions.value = false

      // Return focus to textarea
      nextTick(() => {
         el.focus()
         const newCursorPos = newTextBefore.length
         el.setSelectionRange(newCursorPos, newCursorPos)
      })
   }

   // Keyboard navigation
   const confirmMention = (e: KeyboardEvent) => {
      if (showMentions.value && filteredUsers.value.length > 0) {
         if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault() // Prevent Tab from moving focus to the next button
            const selectedUser = filteredUsers.value[selectedIndex.value]
            if (selectedUser) {
               insertMention(selectedUser)
            }
            return
         }
      }
   }

   // close dropdown
   const closeMentionMenu = (e: MouseEvent) => {
      if (showMentions.value && !textareaRef.value?.contains(e.target as Node)) {
         showMentions.value = false
      }
   }

   const selectNext = () => {
      if (showMentions.value)
         selectedIndex.value = (selectedIndex.value + 1) % filteredUsers.value.length
   }

   const selectPrev = () => {
      if (showMentions.value)
         selectedIndex.value =
            (selectedIndex.value - 1 + filteredUsers.value.length) % filteredUsers.value.length
   }

   return {
      showMentions,
      filteredUsers,
      selectedIndex,
      floatingStyle,
      textareaRef,
      updateFloatingPosition,
      confirmMention,
      handleInput,
      insertMention,
      closeMentionMenu,
      selectNext,
      selectPrev
   }
}