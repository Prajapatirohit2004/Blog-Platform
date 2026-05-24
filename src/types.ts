export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
