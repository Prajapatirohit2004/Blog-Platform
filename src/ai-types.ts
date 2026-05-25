export type AiActionType =
  | "createPost"
  | "updatePost"
  | "deletePost"
  | "createComment"
  | "deleteComment";

export type AiActionExecutionRequest = {
  action: AiActionType;
  args: Record<string, unknown>;
  nonce: string;
  // Client-provided context ids (used to validate permissions)
  targetPostId?: string;
  targetCommentId?: string;
};


export type AiSuggestedAction = {
  id: string;
  type: AiActionType;
  description: string;
  args: Record<string, unknown>;
  confirmRequired: boolean;
};

export type AiChatResponse = {
  replyText: string;
  actions: AiSuggestedAction[];
  // If true, client should require confirmation before executing.
  // (We already set confirmRequired per action.)
};


