<template>
  <div class="comment-wrapper">
    <template v-if="!isLoadingUsers && usersList?.length > 0">
      <div class="main-form">
        <div class="user-selector">
          <label>Browsing as: </label>
          <select v-model="currentUser">
            <option v-for="user in users" :key="user" :value="user">
              {{ user }}
            </option>
          </select>
          <img
            :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser}`"
            class="avatar-small"
          />
        </div>

        <div class="textarea-container">
          <CommentEditor
            placeholder="What's on your mind?..."
            :disabled="isPosting || isLoadingUsers"
            :auto-focus="false"
            :current-user="currentUser"
            v-model="newCommentText"
            :users="usersList"
            @submit="postComment"
          />
        </div>

        <button @click="postComment({ text: newCommentText })" :disabled="isPosting">
          {{ isPosting ? 'posting...' : 'Post Comment' }}
        </button>
      </div>
    </template>

    <br />

    <template v-if="usersList?.length > 0">
      <div v-show="comments && comments.length > 0" class="comment-toolbar">
        <div>{{ comments?.length }} Topic</div>

        <ToggleCollapse />

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search comments..."
            class="search-input"
          />

          <button v-if="searchQuery" @click="searchQuery = ''" role="clear filter" type="button">
            X
          </button>

          <span v-if="searchQuery" class="search-count">
            Found {{ totalSearchMatches }} {{ totalSearchMatches === 1 ? 'result' : 'results' }}
          </span>
        </div>
      </div>

      <br />

      <div class="" v-if="isLoading">loading comments</div>
      <div class="" v-else>
        <CommentItem
          v-for="comment in commentTree"
          :key="comment.id"
          :comment="comment"
          :currentUser="currentUser"
          :searchQuery="searchQuery"
          :users="usersList"
          @react="(id, type, count) => updateReaction(id, type, count)"
          @add-reply="(payload) => postComment(payload)"
          @delete-comment="(commentId) => removeComment(commentId)"
          @edit-comment="(payload) => editComment(payload)"
        />
      </div>
    </template>
    <template v-else>Intializing App....</template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useCommentsQuery } from '@/composables/useCommentsQuery'
import type { Comment } from '@/types/comments'
import CommentItem from '@/components/comments/CommentItem.vue'
import CommentEditor from '@/components/comments/CommentEditor.vue'
import { getUsersQuery } from '@/composables/useUsersQuery'
import ToggleCollapse from '@/components/comments/ToggleCollapse.vue'

const newCommentText = ref('')
const searchQuery = ref('')
const currentUser = ref(localStorage.getItem('cu') ?? '')

const { users, isLoadingUsers } = getUsersQuery()

watch(
  users,
  (newVal: string[] | undefined) => {
    if (newVal && newVal.length > 0 && !currentUser.value) {
      currentUser.value = newVal[0] as string
    }
  },
  { immediate: true },
)

watch(currentUser, (newVal: string) => {
  localStorage.setItem(`cu`, newVal)
})

const usersList = computed(() => {
  return (users.value || []).filter((i) => i !== currentUser.value)
})

// query https
const {
  comments,
  isLoading,
  postComment: postCommentQuery,
  isPosting,
  removeComment,
  isDeleting,
  editComment: editCommentQuery,
  isUpdating,
  updateReaction,
} = useCommentsQuery()

// filteredTree
const totalSearchMatches = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return 0

  let count = 0
  const recursiveCount = (nodes: Comment[]) => {
    nodes.forEach((node) => {
      if (node.text.toLowerCase().includes(query) || node.user.toLowerCase().includes(query)) {
        count++
      }
      if (node.replies) recursiveCount(node.replies)
    })
  }

  recursiveCount(commentTree.value)
  return count
})

// 2. Transform Flat Data to Tree
const commentTree = computed<Comment[]>(() => {
  if (!comments.value) return []

  const map: Record<string, Comment & { replies: Comment[] }> = {}
  const tree: Comment[] = []

  // Sort and build map
  const sortedComments = [...comments.value].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  sortedComments.forEach((c) => (map[c.id] = { ...c, replies: [] }))

  sortedComments.forEach((c) => {
    const currentComment = map[c.id]
    if (!currentComment) return

    if (c.parentId) {
      const parent = map[c.parentId]
      if (parent) parent.replies.push(currentComment)
    } else {
      tree.push(currentComment)
    }
  })

  return tree
})

// 3. Post New Comment or Reply
const postComment = async (payload: Partial<Comment>) => {
  const { text, parentId, linkPreview } = payload
  if (!text || !text.trim() || isPosting.value) return

  const tempId = Date.now().toString()

  postCommentQuery(
    {
      id: tempId,
      user: currentUser.value,
      text,
      parentId: parentId || null,
      linkPreview,
      reactions: { thumbsUp: 0, heart: 0, laugh: 0 },
      createdAt: new Date().toISOString(),
    },
    {
      onSuccess: async (result, variables) => {
        const commentId = result.id || variables.id
        await nextTick()
        const el = document.getElementById(`comment-${commentId}`)
        if (el) {
          el?.scrollIntoView({ behavior: 'auto', block: 'center' })
          el?.classList.add('highlight-flash')
        }

        setTimeout(() => {
          el?.classList.remove('highlight-flash')
        }, 1000)
      },
    },
  )
  newCommentText.value = ''
}

// edit
const editComment = async (payload: Partial<Comment>) => {
  const { id, text, linkPreview } = payload
  if (!id || !text) return

  editCommentQuery(
    id,
    { text, linkPreview },
    {
      onSuccess: async () => {
        await nextTick()
        const el = document.getElementById(`comment-${id}`)
        el?.classList.add('highlight-flash')
        setTimeout(() => {
          el?.classList.remove('highlight-flash')
        }, 1000)
      },
    },
  )
}
</script>

<style lang="scss">
.user-selector {
  background: #f4f7f6;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.comment-wrapper {
  position: relative;
}
.main-form {
  position: sticky;
  top: 3px;
  border-radius: 8px;
  width: 100%;
  z-index: 2;
  background-color: #ffffff;
  border: 1px solid #d0d0d0;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.main-form textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  resize: none;
  field-sizing: content;
  min-height: 1lh;
}

/* comment-toolbar */
.comment-toolbar {
  display: flex;
  align-items: center;
  margin: 6px 0;
  gap: 10px;

  .search-bar {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px; /* Rounded look like Reddit/Facebook */
    outline: none;
  }

  .search-input:focus {
    border-color: #3498db;
  }
}
</style>
