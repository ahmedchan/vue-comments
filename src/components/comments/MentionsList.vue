<template>
  <ul v-if="show" ref="listRef" :style="style" class="mentions-dropdown">
    <li
      v-for="(user, index) in filteredUsers"
      :key="user"
      :class="{ active: index === selectedIndex }"
      @mousedown.prevent="$emit('insertMention', user)"
    >
      <img :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${user}`" class="avatar-xs" />
      {{ user }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { type CSSProperties, ref, watch, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
  filteredUsers: string[]
  selectedIndex: number
  style: CSSProperties
}>()

defineEmits<{
  (e: 'insertMention', user: string): void
}>()

const listRef = ref<HTMLElement | null>(null)

watch(
  () => props.selectedIndex,
  () => {
    nextTick(() => {
      const activeItem = listRef.value?.querySelector('.active') as HTMLElement
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'instant' })
      }
    })
  },
)
</script>

<style scoped lang="scss">
.mentions-dropdown {
  pointer-events: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
  padding: 5px 0;

  min-width: 180px;
  max-width: 300px;

  /* Optional: Smooth scrolling for keyboard navigation */
  scroll-behavior: smooth;

  li {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    &.active,
    &:hover {
      background-color: #f0f7ff;
      color: #3498db;
    }

    .avatar-xs {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }
  }
}
</style>
