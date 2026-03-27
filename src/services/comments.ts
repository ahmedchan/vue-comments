import httpClient from '@/httpClient';
import type { Comment } from '@/types/comments';


export const fetchAllComments = async (): Promise<Comment[]> => {
   const result = await httpClient.get('/comments');
   return result.data;
};

export const createComment = async (payload: Partial<Comment>): Promise<Comment> => {
   try {
      const { data } = await httpClient.post<Comment>('/comments', payload);
      console.log("created result => ", data)
      return data;
   } catch (error) {
      console.error("❌ created error:", error)
      // Re-throw the error so TanStack Query's onError can catch it
      throw error
   }
};

export const updateComment = async (id: string, payload: Partial<Comment>): Promise<Comment> => {
   try {
      const { data } = await httpClient.put(`/comments/${id}`, payload)
      console.log("updated result => ", data)
      return data
   } catch (error) {
      console.error("❌ Update error:", error)
      // Re-throw the error so TanStack Query's onError can catch it
      throw error
   }

}

export const deleteComment = async (id: string): Promise<void> => {
   return await httpClient.delete(`/comments/${id}`);
};