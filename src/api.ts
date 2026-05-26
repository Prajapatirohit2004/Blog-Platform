import { Post, Comment, User, AuthResponse } from "./types";
import type { AiChatResponse, AiActionType } from "./ai-types";

const getHeaders = () => {
  const token = localStorage.getItem("blog_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Me
  async getMe(): Promise<User | null> {
    const token = localStorage.getItem("blog_token");
    if (!token) return null;
    try {
      const res = await fetch("/api/auth/me", {
        headers: getHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem("blog_token");
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  // Auth Register
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to register account.");
    }
    localStorage.setItem("blog_token", data.token);
    return data;
  },

  // Auth Login
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to log in.");
    }
    localStorage.setItem("blog_token", data.token);
    return data;
  },

  // Auth Logout
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getHeaders(),
      });
    } finally {
      localStorage.removeItem("blog_token");
    }
  },

  // Get Posts
  async getPosts(): Promise<Post[]> {
    const res = await fetch("/api/posts", {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch blog posts list.");
    }
    return res.json();
  },

  // Get Single Post (and comments)
  async getPost(id: string): Promise<{ post: Post; comments: Comment[] }> {
    const res = await fetch(`/api/posts/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch post details.");
    }
    return data;
  },

  // Create Post
  async createPost(title: string, content: string, summary?: string): Promise<Post> {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, content, summary }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to publish post.");
    }
    return data;
  },

  // Update Post
  async updatePost(id: string, title: string, content: string, summary?: string): Promise<Post> {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ title, content, summary }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update post.");
    }
    return data;
  },

  // Delete Post
  async deletePost(id: string): Promise<void> {
    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete post.");
    }
  },

  // Add Comment
  async createComment(postId: string, content: string): Promise<Comment> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to publish comment.");
    }
    return data;
  },

  // Delete Comment
  async deleteComment(commentId: string): Promise<void> {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to remove comment.");
    }
  },

  // AI Chat
  async aiChat(message: string, context?: { view?: string; selectedPostId?: string; selectedCommentId?: string }): Promise<AiChatResponse> {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message, context: context || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "AI chat failed");
    }
    return data;
  },

  // AI Execute (requires auth on server)
  async aiExecute(payload: {
    action: AiActionType;
    args: Record<string, unknown>;
    nonce: string;
    targetPostId?: string;
    targetCommentId?: string;
  }): Promise<{ success: boolean; post?: Post; comment?: Comment }> {
    const res = await fetch("/api/ai/execute", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "AI execute failed");
    }
    return data;
  },
};
