import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface DbUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface DbPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  posts: DbPost[];
  comments: DbComment[];
  sessions: DbSession[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

const initialDb: DatabaseSchema = {
  users: [],
  posts: [
    {
      id: "post-1",
      title: "Welcome to the Blog Platform!",
      content: "This is a full-stack blogging web application built using React, Vite, Tailwind CSS, Express, and a custom JSON database for secure persistence. This platform demonstrates robust features like user registration, authentication via unique sessions, core CRUD (Create, Read, Update, Delete) operations on articles, and dynamic comments nested in posts.\n\nEnjoy writing, updating, or deleting content and sharing comments in real-time!",
      summary: "An introduction to the Blog Platform and its interactive features.",
      authorId: "admin-system",
      authorName: "System Administrator",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "post-2",
      title: "Mastering Craftsmanship in Web Design",
      content: "Craftsmanship isn't just about making things work; it is about bringing intent, beauty, and structure to every layout. In modern web apps, that means using balanced typography, generous white spaces, high-contrast and intentional color schemes, and micro-animations that gently guide the reader.\n\nBy avoiding cluttered and bloated layouts, you cultivate a pristine visual experience for your users.",
      summary: "A brief guide on typography, spacing, and modern design principles.",
      authorId: "admin-system",
      authorName: "System Administrator",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  comments: [
    {
      id: "comment-1",
      postId: "post-1",
      content: "This is amazing! Clean layout and runs fully persistent backend routes limitlessly.",
      authorId: "admin-system",
      authorName: "System Administrator",
      createdAt: new Date().toISOString()
    }
  ],
  sessions: []
};

export class CustomDatabase {
  private memoryDb: DatabaseSchema = { ...initialDb };

  constructor() {}

  async init() {
    try {
      await fs.mkdir(DB_DIR, { recursive: true });
      try {
        const fileContent = await fs.readFile(DB_FILE, "utf-8");
        this.memoryDb = JSON.parse(fileContent);
        // Ensure standard fields exist
        if (!this.memoryDb.users) this.memoryDb.users = [];
        if (!this.memoryDb.posts) this.memoryDb.posts = [];
        if (!this.memoryDb.comments) this.memoryDb.comments = [];
        if (!this.memoryDb.sessions) this.memoryDb.sessions = [];
      } catch (err) {
        // File doesn't exist, save default database
        await this.save();
      }
    } catch (e) {
      console.error("Failed to initialize database folder", e);
    }
  }

  private async save() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.memoryDb, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to database file", err);
    }
  }

  hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  // Users
  getUsers(): DbUser[] {
    return this.memoryDb.users;
  }

  async createUser(username: string, email: string, passwordHash: string): Promise<DbUser> {
    const newUser: DbUser = {
      id: crypto.randomUUID(),
      username,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.memoryDb.users.push(newUser);
    await this.save();
    return newUser;
  }

  getUserById(id: string): DbUser | undefined {
    return this.memoryDb.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): DbUser | undefined {
    return this.memoryDb.users.find(u => u.email === email.toLowerCase());
  }

  getUserByUsername(username: string): DbUser | undefined {
    return this.memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // Sessions
  async createSession(userId: string): Promise<DbSession> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const session: DbSession = {
      token,
      userId,
      expiresAt
    };
    this.memoryDb.sessions.push(session);
    await this.save();
    return session;
  }

  async validateSession(token: string): Promise<DbUser | null> {
    // Clear out expired sessions
    const now = new Date().toISOString();
    const session = this.memoryDb.sessions.find(s => s.token === token);
    if (!session) return null;
    if (session.expiresAt < now) {
      this.memoryDb.sessions = this.memoryDb.sessions.filter(s => s.token !== token);
      await this.save();
      return null;
    }
    const user = this.getUserById(session.userId);
    return user || null;
  }

  async deleteSession(token: string): Promise<void> {
    this.memoryDb.sessions = this.memoryDb.sessions.filter(s => s.token !== token);
    await this.save();
  }

  // Posts
  getPosts(): DbPost[] {
    // Return posts sorted by createdAt descending
    return [...this.memoryDb.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getPostById(id: string): DbPost | undefined {
    return this.memoryDb.posts.find(p => p.id === id);
  }

  async createPost(title: string, content: string, summary: string, authorId: string, authorName: string): Promise<DbPost> {
    const newPost: DbPost = {
      id: crypto.randomUUID(),
      title,
      content,
      summary: summary || content.slice(0, 150) + "...",
      authorId,
      authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.memoryDb.posts.push(newPost);
    await this.save();
    return newPost;
  }

  async updatePost(id: string, title: string, content: string, summary: string): Promise<DbPost | null> {
    const postIdx = this.memoryDb.posts.findIndex(p => p.id === id);
    if (postIdx === -1) return null;
    
    const updatedPost = {
      ...this.memoryDb.posts[postIdx],
      title,
      content,
      summary: summary || content.slice(0, 150) + "...",
      updatedAt: new Date().toISOString()
    };
    this.memoryDb.posts[postIdx] = updatedPost;
    await this.save();
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    const oldLength = this.memoryDb.posts.length;
    this.memoryDb.posts = this.memoryDb.posts.filter(p => p.id !== id);
    // Remove comments of that post too
    this.memoryDb.comments = this.memoryDb.comments.filter(c => c.postId !== id);
    await this.save();
    return this.memoryDb.posts.length < oldLength;
  }

  // Comments
  getCommentsForPost(postId: string): DbComment[] {
    return this.memoryDb.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Newest first
  }

  getCommentById(id: string): DbComment | undefined {
    return this.memoryDb.comments.find(c => c.id === id);
  }

  async createComment(postId: string, content: string, authorId: string, authorName: string): Promise<DbComment> {
    const newComment: DbComment = {
      id: crypto.randomUUID(),
      postId,
      content,
      authorId,
      authorName,
      createdAt: new Date().toISOString()
    };
    this.memoryDb.comments.push(newComment);
    await this.save();
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const oldLength = this.memoryDb.comments.length;
    this.memoryDb.comments = this.memoryDb.comments.filter(c => c.id !== id);
    await this.save();
    return this.memoryDb.comments.length < oldLength;
  }
}

export const db = new CustomDatabase();
