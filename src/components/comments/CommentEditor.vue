<template>
  <div class="editor-container">
    <textarea
      ref="textareaRef"
      v-model="internalText"
      :placeholder="placeholder"
      class="custom-textarea"
      :disabled="disabled"
      id="editor-area"
      @input="handleInput"
      @keydown.down.prevent="selectNext"
      @keydown.up.prevent="selectPrev"
      @keydown.tab.prevent="handleKeydown"
      @keydown.enter.exact.prevent="handleKeydown"
      @keydown.esc.stop="handleKeydown"
    ></textarea>

    <Teleport to="body">
      <MentionsList
        :show="showMentions"
        :style="floatingStyle"
        :filtered-users="filteredUsers"
        :selected-index="selectedIndex"
        @insert-mention="insertMention"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useMention } from '@/composables/useMentions'
import { ref, onMounted, watch, onUnmounted } from 'vue'
import MentionsList from '@/components/comments/MentionsList.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  users: string[]
  currentUser: string
}>()

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const internalText = ref(props.modelValue)

// Keep parent in sync when internal text changes
watch(internalText, (newVal) => {
  emit('update:modelValue', newVal)
})

// Update internal text if parent changes modelValue externally
watch(
  () => props.modelValue,
  (newVal) => {
    internalText.value = newVal
  },
)

// Use the shared composable
const {
  showMentions,
  selectedIndex,
  floatingStyle,
  textareaRef,
  filteredUsers,
  updateFloatingPosition,
  closeMentionMenu,
  handleInput,
  insertMention,
  selectNext,
  selectPrev,
} = useMention(props.users, internalText)

const handleKeydown = (e: KeyboardEvent) => {
  // 1. Handle Mentions first
  if (showMentions.value && filteredUsers.value.length > 0) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const selectedUser = filteredUsers.value[selectedIndex.value]
      if (selectedUser) insertMention(selectedUser)
      return // Stop here!
    }
    if (e.key === 'Escape') {
      showMentions.value = false
      return
    }
  }

  // 2. Handle Editor Actions
  if (e.key === 'Enter' || e.key === 'Tab') {
    emit('submit')
  } else if (e.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  if (props.autoFocus) {
    textareaRef.value?.focus()
  }

  window.addEventListener('click', closeMentionMenu)
  window.addEventListener('scroll', updateFloatingPosition)
})
onUnmounted(() => {
  window.removeEventListener('click', closeMentionMenu)
  window.removeEventListener('scroll', updateFloatingPosition)
})
</script>

<style scoped lang="scss">
.editor-container {
  position: relative;
  width: 100%;
}
.custom-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  field-sizing: content; // Modern CSS for auto-height
  min-height: 40px;
  outline: none;
  &:focus {
    border-color: #3498db;
  }
}
</style>
