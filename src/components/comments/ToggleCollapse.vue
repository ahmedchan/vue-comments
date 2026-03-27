<template>
  <div class="comments-controls">
    <button @click="toggleAllThreads" class="btn-global-toggle">
      {{ isAllCollapsed ? '➕ Expand All Threads' : '➖ Collapse All Threads' }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const isAllCollapsed = ref(false)

const toggleAllThreads = () => {
  isAllCollapsed.value = !isAllCollapsed.value

  // 1. Clear individual storage if we are expanding all
  if (!isAllCollapsed.value) {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('comment-collapsed-'))
      .forEach((key) => localStorage.removeItem(key))
  }

  // 2. Dispatch a custom event that tells every comment what to do
  const eventName = isAllCollapsed.value ? 'collapse-all-threads' : 'expand-all-threads'
  window.dispatchEvent(new CustomEvent(eventName))
}
</script>

<style scoped lang="scss">
.btn-global-toggle {
  background: #f0f2f5;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 20px; // Pill shape looks great on iOS
  font-size: 0.85rem;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e4e6e9;
    border-color: #3498db;
    color: #3498db;
  }

  &:active {
    transform: scale(0.95); // Haptic-like feedback for touch
  }
}
</style>
