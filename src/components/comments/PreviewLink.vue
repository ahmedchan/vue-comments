<template>
  <div class="comment-link-preview">
    <a :href="linkPreview.url" target="_blank" class="preview-link">
      <img v-if="linkPreview.image" :src="linkPreview.image" class="thumb" />
      <div class="details">
        <div class="title">{{ linkPreview.title }}</div>
        <p class="desc">{{ linkPreview.description }}</p>
        <span v-if="linkPreview?.url" class="source">{{
          getPreviewHostname(linkPreview.url)
        }}</span>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import type { LinkPreview } from '@/types/comments'

defineProps<{ linkPreview: LinkPreview }>()

function getPreviewHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
</script>

<style lang="scss" scoped>
// preview link styles
.comment-link-preview {
  margin-top: 6px;
  border: 1px solid #e1e4e8;
  border-radius: 10px;
  padding: 6px;
  background: #f6f8fa;

  &:hover {
    border-color: #a5ceea;
    background-color: #ecf2f8;
  }

  .preview-link {
    display: flex;
    gap: 10px;
    text-decoration: none;
    color: inherit;
  }

  .thumb {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 10px;
  }

  .details {
    font-size: 12px;
    overflow: hidden;

    .title {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .desc {
      font-size: 12px;
      color: #57606a;
      margin: 0;
    }
    .source {
      font-size: 11px;
      color: #8c959f;
      margin-top: 4px;
      display: block;
    }
  }
}
</style>
