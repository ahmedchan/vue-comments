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

    <div v-if="isFetchingPreview" class="preview-loading">
      <span>🔍 Fetching link preview...</span>
    </div>
    <div v-else-if="linkPreview" class="link-preview">
      <button class="close-btn" @click="linkPreview = null">×</button>
      <img v-if="linkPreview.image" :src="linkPreview.image" class="preview-img" />
      <div class="preview-info">
        <div class="preview-title">{{ linkPreview.title }}</div>
        <div class="preview-desc">{{ linkPreview.description }}</div>
        <!-- <disv class="preview-url">{{ new URL(linkPreview.url).hostname }}</div> -->
      </div>
    </div>

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
import type { Comment } from '@/types/comments'
import { useLinkPreview } from '@/composables/useLinkPreview'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  users: string[]
  currentUser: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', payload: Partial<Comment>): void // Now accepts the payload
  (e: 'cancel'): void
}>()

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

// use the shard composable for link preview
const { linkPreview, isFetchingPreview } = useLinkPreview(internalText)

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
    const payload: Partial<Comment> = {
      text: internalText.value,
      user: props.currentUser,
      parentId: null, // Change this if you are in a reply thread
      linkPreview: linkPreview.value ? { ...linkPreview.value } : undefined,
    }
    emit('submit', payload)
    // Reset local state after emit
    internalText.value = ''
    linkPreview.value = null
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

// preview loading
.preview-loading {
  font-size: 12px;
  color: #3498db;
  margin-top: 8px;
  padding: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

// link preview
.link-preview {
  display: flex;
  margin-top: 6px;
  background: #f0f2f5;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  max-height: 100px;

  .close-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    border: none;
    padding: 10px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-img {
    width: 70px;
    height: 70px;
    object-fit: cover;
  }

  .preview-info {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;

    .preview-title {
      font-weight: bold;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-desc {
      font-size: 12px;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .preview-url {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }
  }
}
</style>
