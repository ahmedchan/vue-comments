import httpClient from '@/httpClient';
import type { Comment } from '@/types/comments';


export const fetchAllComments = async (): Promise<Comment[]> => {
   const result = await httpClient.get('/comments');
   return result.data;
};

export const createComment = async (payload: Partial<Comment>): Promise<Comment> => {
   const { data } = await httpClient.post<Comment>('/comments', payload);
   return data;
};

export const updateComment = async (id: string, payload: Partial<Comment>): Promise<void> => {
   return await httpClient.put(`/comments/${id}`, payload)
}

export const deleteComment = async (id: string): Promise<void> => {
   return await httpClient.delete(`/comments/${id}`);
};