<template>
  <div class="comment-item" :id="`comment-${comment.id}`" :class="{ 'is-reply': comment.parentId }">
    <div class="thread-line" @click="isCollapsed = !isCollapsed" title="Toggle thread"></div>

    <div class="comment-inner">
      <div class="comment-header">
        <span class="user-name">{{ comment.user }}</span>

        <button class="btn-toggle" @click="isCollapsed = !isCollapsed">
          [{{ isCollapsed ? '+' : '-' }}]
        </button>

        <span v-if="isCollapsed" class="timestamp">{{ timeAgo(comment.createdAt) }}</span>

        <span v-if="comment?.replies && comment?.replies?.length > 0" className="replies-count"
          >{{ comment.replies?.length }} Replies</span
        >
      </div>

      <template v-if="!isCollapsed">
        <div class="comment-body">
          <div class="user-meta">
            <img
              :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user}`"
              class="avatar"
            />
            <strong>@{{ comment.user }}</strong>
            <!-- <small>{{ new Date(comment.createdAt).toLocaleTimeString() }}</small> -->
            <small class="timestamp">{{ timeAgo(comment.createdAt) }}</small>
          </div>

          <div class="" v-if="isEditing">
            <CommentEditor
              placeholder="add your replay..."
              :auto-focus="true"
              :current-user="currentUser"
              v-model="editText"
              :users="users"
              @cancel="cancelEdit"
              @submit="saveEdit"
            />
          </div>
          <div v-else class="content-text">
            <span v-html="highlightedText"></span>

            <button v-if="needsTruncation" @click="isExpanded = !isExpanded" class="btn-show-more">
              {{ isExpanded ? 'Show Less' : 'Read More' }}
            </button>
          </div>

          <div class="actions">
            <button
              v-for="(count, type) in comment.reactions"
              :key="type"
              @click="$emit('react', comment.id, type, count)"
              class="btn-react"
            >
              {{ emojiMap[type] }} {{ count }}
            </button>

            <button v-if="isCommentOwner" @click="isEditing = !isEditing" class="btn-link">
              {{ isEditing ? 'Cancel edit' : 'Edit' }}
            </button>

            <button @click="toggleReply" class="btn-link">
              {{ isReplying ? 'Cancel' : 'Reply' }}
            </button>

            <button
              v-if="isCommentOwner"
              @click="$emit(`delete-comment`, comment.id)"
              class="btn-link"
            >
              Delete
            </button>
          </div>

          <div v-if="isReplying" class="reply-form">
            <CommentEditor
              placeholder="add your replay..."
              :auto-focus="true"
              :current-user="currentUser"
              v-model="replyText"
              :users="users"
              @cancel="cancelReply"
              @submit="submitReply"
            />

            <button @click="submitReply">Send</button>
            <button @click="cancelReply" class="btn-cancel-small">×</button>
          </div>
        </div>

        <div v-if="comment.replies && comment.replies.length" class="replies-list">
          <CommentItem
            v-for="child in comment.replies"
            :key="child.id"
            :comment="child"
            :currentUser="currentUser"
            :searchQuery="searchQuery"
            :users="users"
            @react="(id, type, count) => $emit('react', id, type, count)"
            @add-reply="(payload) => $emit('add-reply', payload)"
            @delete-comment="(payload) => $emit(`delete-comment`, payload)"
            @edit-comment="(payload) => $emit('edit-comment', payload)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import type { Comment as CommentType } from '@/types/comments'
import { timeAgo } from '@/utils/dateHelpers'
import CommentEditor from '@/components/comments/CommentEditor.vue'

const props = defineProps<{
  comment: CommentType
  currentUser: string
  searchQuery: string
  users: Array<string>
}>()

const emit = defineEmits<{
  (e: 'react', id: string, type: string, count: number): void
  (e: 'add-reply', payload: { parentId: string; text: string }): void
  (e: 'delete-comment', id: string): void
  (e: 'edit-comment', payload: { id: string; text: string }): void
}>()

const isReplying = ref(false)
const isEditing = ref(false)
const replyText = ref('')
const editText = ref(props.comment.text)
const replyInputRef = ref<HTMLTextAreaElement | null>(null)
const editInputRef = ref<HTMLTextAreaElement | null>(null)
const emojiMap = { thumbsUp: '👍', heart: '❤️', laugh: '😂' }
const TEXT_LIMIT = 160 // Characters before "Read More" appears
const isExpanded = ref(false)

const COLLAPSED_STORAGE_KEY = `comment-collapsed-${props.comment.id}`
const isCollapsed = ref(localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true')

const needsTruncation = computed(() => props.comment.text.length > TEXT_LIMIT)

const isCommentOwner = computed(() => props.currentUser === props.comment.user)

watch(isCollapsed, (newValue) => {
  if (newValue) {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, 'true')
  } else {
    localStorage.removeItem(COLLAPSED_STORAGE_KEY)
  }
})

watch(isReplying, async (val) => {
  if (val) {
    // We must wait for Vue to finish rendering the input field
    await nextTick()
    replyInputRef.value?.focus()
  }
})

watch(isEditing, async (val) => {
  if (val) {
    // We must wait for Vue to finish rendering the input field
    await nextTick()
    editInputRef.value?.focus()
  }
})

const highlightedText = computed(() => {
  // Use the truncated text instead of the full props.comment.text
  let text =
    isExpanded.value || !needsTruncation.value
      ? props.comment.text
      : props.comment.text.slice(0, TEXT_LIMIT) + '...'

  text = text.replace(/@(\w+)/g, (match, username) => {
    // Check if the username exists in our global users list
    const userExists = props.users.includes(username)

    if (userExists) {
      return `<span class="mention">@${username}</span>`
    } else {
      // If user doesn't exist, return the original text (@whatever) without the span
      return match
    }
  })

  const query = props.searchQuery?.trim()
  if (!query) return text

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')

  return text.replace(regex, '<mark>$1</mark>')
})

const cancelReply = () => {
  isReplying.value = false
  replyText.value = ''
}

const toggleReply = () => {
  isReplying.value = !isReplying.value
  if (!isReplying.value) {
    replyText.value = '' // Clear text if they close the box
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editText.value = props.comment.text
}

const saveEdit = () => {
  if (!editText.value.trim() || editText.value === props.comment.text) {
    return cancelEdit()
  }
  emit('edit-comment', { id: props.comment.id, text: editText.value })
  isEditing.value = false
}

const submitReply = () => {
  if (!replyText.value.trim()) return
  emit('add-reply', { parentId: props.comment.id, text: replyText.value })
  replyText.value = ''
  isReplying.value = false
}

const handleGlobalEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isReplying.value) {
    cancelReply()
  }

  if (event.key === 'Escape' && isEditing.value) {
    cancelEdit()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalEsc)
})
</script>

<style scoped lang="scss">
.comment-item {
  margin-top: 15px;
  /* border-left: 2px solid #eee; */
  padding-left: 15px;
  position: relative;
  z-index: 1;
}
.is-reply {
  border-left-color: #3498db;
}
.user-meta {
  font-size: 0.9em;
  color: #666;
  display: flex;
  gap: 4px;
  align-items: end;
}
.user-meta img {
  width: 24px;
  height: auto;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.btn-react {
  cursor: pointer;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 8px;
}
.btn-link {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 0.9em;
}
.reply-form,
.edit-form {
  display: flex;
  gap: 5px;
  animation: slideIn 0.2s ease-out;
}
.reply-form textarea,
.edit-form textarea {
  flex: 1;
  resize: none;
  field-sizing: content;
  min-height: 1lh;
  padding: 10px;
}
.reply-form {
  margin-top: 10px;
}
.replies-list {
  margin-top: 10px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timestamp {
  color: #8899a6;
  margin-left: 10px;
  font-size: 0.85em;
}

.btn-show-more {
  border: 0;
  background: transparent;
  color: #3498db;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  display: inline-block;
  border-bottom: 1px dotted #3498db;
}

/* highlight */

@keyframes flash {
  0% {
    background-color: #fff9c4;
  } /* Soft yellow */
  100% {
    background-color: transparent;
  }
}

.highlight-flash > .comment-inner > .comment-body {
  animation: flash 2s ease-out;
}

.thread-line {
  position: absolute;
  left: 0;
  top: 24px; /* Start below the username */
  bottom: 0;
  width: 2px;
  background-color: #d9dcdd;
  cursor: pointer;
  transition: background-color 0.2s;
}
.is-reply .thread-line {
  background-color: #e6e9ea;
}

.thread-line:hover {
  background-color: #3498db; /* Blue highlight on hover */
  width: 4px; /* Make it thicker when hovering */
  left: -1px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9em;
  color: #65676b;
  margin-bottom: 4px;
}

.user-name {
  font-weight: bold;
  color: #1c1e21;
}

.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #bcc0c4;
  font-family: monospace;
}

.is-collapsed .comment-content,
.is-collapsed .replies-list {
  display: none;
}

/*  replies-count */
.replies-count {
  font-size: 0.7rem;
  color: #999;
}

/* mark */
mark {
  background-color: #fff9c4; /* Soft yellow */
  color: #d4a017; /* Darker gold text */
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}

/* mention */
:deep(.mention) {
  color: #3498db;
  font-weight: 600;
  background: rgba(52, 152, 219, 0.1);
  padding: 0 2px;
  border-radius: 3px;
}

:deep(.mention:hover) {
  text-decoration: underline;
  background: rgba(52, 152, 219, 0.2);
}

/* Styling for the search highlight */
:deep(mark) {
  background-color: #fff9c4;
  color: #d4a017;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}
</style>
