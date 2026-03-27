export interface Reactions {
   thumbsUp: number;
   heart: number;
   laugh: number;
}

export interface Comment {
   id: string;
   user: string;
   text: string;
   parentId: string | null;
   reactions: Reactions;
   createdAt: string;
   editedAt?: string; // Optional property
   replies?: Comment[]; // Used for the Tree structure
   linkPreview?: LinkPreview
}

export interface LinkPreview {
   image?: string
   title?: string
   description?: string
   url?: string
}

export type CommentPayload = Omit<Comment, 'id' | 'createdAt' | 'reactions'>;