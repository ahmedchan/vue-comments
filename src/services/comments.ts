import httpClient from '@/httpClient';
import type { Comment } from '@/types/comments';

export const fetchAllComments = async (): Promise<Comment[]> => {
   const { data } = await httpClient.get<Comment[]>('/comments');
   return data;
};

export const createComment = async (payload: Partial<Comment>): Promise<Comment> => {
   const { data } = await httpClient.post<Comment>('/comments', payload);
   return data;
};

export const updateComment = async (id: string, payload: Partial<Comment>): Promise<void> => {
   return await httpClient.patch(`/comments/${id}`, payload)
}

export const deleteComment = async (id: string): Promise<void> => {
   return await httpClient.delete(`/comments/${id}`);
};