<template>
  <div class="container">
    <h1>Community Chat</h1>
    <Comments />
  </div>
</template>

<script setup lang="ts">
import Comments from '@/components/comments/Comments.vue'
</script>

<style scoped>
.container {
  max-width: 768px;
  padding: 40px 0;
  margin: 0 auto;
  font-family: sans-serif;
}
</style>
