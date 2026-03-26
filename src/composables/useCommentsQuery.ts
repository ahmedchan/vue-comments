import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { fetchAllComments, createComment, deleteComment, updateComment } from "@/services/comments"
import type { Comment } from '@/types/comments'


type Options = {
   onSuccess?: (data: any) => void
}

// helper
const getAllIds = (list: Comment[], id: string): string[] => {
   let ids = [id]
   const children = list.filter(c => c.parentId === id)
   children.forEach(child => {
      ids = [...ids, ...getAllIds(list, child.id)]
   })
   return ids
}

export function useCommentsQuery() {
   const queryClient = useQueryClient()

   // GET: Fetch all comments
   const commentsQuery = useQuery({
      queryKey: ['comments'],
      queryFn: fetchAllComments
   })

   // POST: Create a comment
   const postMutation = useMutation({
      mutationFn: (payload: Comment) => createComment(payload),
      onMutate: async (newComment) => {
         await queryClient.cancelQueries({ queryKey: ['comments'] })
         const previousComments = queryClient.getQueryData<Comment[]>(['comments'])

         queryClient.setQueryData(['comments'], (old: Comment[] | undefined) => {
            return old ? [newComment, ...old] : [newComment]
         })

         return { previousComments }
      },
      onSuccess: (serverComment, variables) => {
         queryClient.setQueryData(['comments'], (old: Comment[] | undefined) => {
            return old?.map((c) =>
               c.id === variables.id ? serverComment : c
            )
         })
      },
      onError: (err, newComment, context) => {
         if (context?.previousComments) {
            queryClient.setQueryData(['comments'], context.previousComments)
         }
      },

      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ['comments'] })
      }
   })

   const deleteMutation = useMutation({
      mutationFn: (commentId: string) => {
         // Professional approach: Get the fresh list from the cache to find children
         const allComments = queryClient.getQueryData<Comment[]>(['comments']) || []
         // get all children ids to remove if it has
         const idsToDelete = getAllIds(allComments, commentId)
         // Execute all deletes
         return Promise.all(idsToDelete.map(id => deleteComment(id)))
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['comments'] })
      }
   })

   const updateMutation = useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<Comment> }) => updateComment(id, payload),

      onMutate: async ({ id, payload }) => {
         await queryClient.cancelQueries({ queryKey: ['comments'] })
         const previousComments = queryClient.getQueryData<Comment[]>(['comments'])

         queryClient.setQueryData(['comments'], (old: Comment[] | undefined) => {
            return old?.map((comment) =>
               // Spread the existing comment, then spread the payload (text OR reactions)
               comment.id === id ? { ...comment, ...payload } : comment
            )
         })

         return { previousComments }
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['comments'] })
      },
      onError: (err, variables, context) => {
         if (context?.previousComments) {
            queryClient.setQueryData(['comments'], context.previousComments)
         }
      },
   })

   return {
      comments: commentsQuery.data,
      isLoading: commentsQuery.isLoading,
      error: commentsQuery.error,
      // create
      postComment: postMutation.mutate,
      isPosting: postMutation.isPending,
      // delete
      isDeleting: deleteMutation.isPending,
      // update
      isUpdating: updateMutation.isPending,
      // update reaction
      // We wrap these so the Component doesn't have to worry about the { id, payload } structure
      updateReaction: (id: string, type: string, count: number) => {
         // 1. Get the full list of comments from the cache
         const allComments = queryClient.getQueryData<Comment[]>(['comments']) || [];

         // 2. Find the specific comment to get its existing reactions
         const comment = allComments.find(c => c.id === id);
         if (!comment) return;

         // 3. Create the full reactions object, keeping old ones and incrementing the target
         const updatedReactions = {
            ...comment.reactions,
            [type]: count + 1
         };

         // 4. Send the FULL reactions object in the PATCH
         updateMutation.mutate({ id, payload: { reactions: updatedReactions } });
      },

      editComment: (id: string, text: string, options?: Options) => updateMutation.mutate({ id, payload: { text, editedAt: new Date().toISOString() } }, options),

      removeComment: (id: string) => {
         if (confirm('Delete this and all replies?')) {
            deleteMutation.mutate(id)
         }
      }
   }
}