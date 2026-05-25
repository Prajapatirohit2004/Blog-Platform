import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/genai";
import { db, DbUser } from "./server-db.js";

// Extend Request structure for Custom Authentications

interface AuthenticatedRequest extends Request {
  user?: DbUser;
  token?: string;
}

const app = express();
const PORT = 3000;

// Force JSON parsing
app.use(express.json());

// Initialize database
await db.init();

// Security / Auth Middleware
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.substring(7);
  const user = await db.validateSession(token);
  if (user) {
    req.user = user;
    req.token = token;
  }
  next();
}

app.use(authenticateUser);

// Ensure user is authenticated helper middle-ware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(418).json({ error: "Authentication required to perform this action." });
  }
  next();
}

// REST APIs

// 1. Auth check endpoint
app.get("/api/auth/me", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
    }
  });
});

// 2. Register
app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing username, email, or password elements." });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }
  if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  // Check unique username
  const existingUsername = db.getUserByUsername(cleanUsername);
  if (existingUsername) {
    return res.status(400).json({ error: "A writer with this username already exists." });
  }

  // Check unique email
  const existingEmail = db.getUserByEmail(cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: "An account with this email address already exists." });
  }

  const passwordHash = db.hashPassword(password);
  const user = await db.createUser(cleanUsername, cleanEmail, passwordHash);
  const session = await db.createSession(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
    token: session.token
  });
});

// 3. Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email credentials." });
  }

  const inputHash = db.hashPassword(password);
  if (user.passwordHash !== inputHash) {
    return res.status(401).json({ error: "The password provided is incorrect." });
  }

  const session = await db.createSession(user.id);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
    token: session.token
  });
});

// 4. Logout
app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    await db.deleteSession(req.token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// 5. Get all posts
app.get("/api/posts", (req: Request, res: Response) => {
  const posts = db.getPosts();
  res.json(posts);
});

// 6. Get single post & its comments
app.get("/api/posts/:id", (req: Request, res: Response) => {
  const post = db.getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }
  const comments = db.getCommentsForPost(post.id);
  res.json({ post, comments });
});

// 7. Create post
app.post("/api/posts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, summary } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content elements are required." });
  }

  const newPost = await db.createPost(
    title.trim(),
    content.trim(),
    summary ? summary.trim() : "",
    req.user!.id,
    req.user!.username
  );

  res.status(201).json(newPost);
});

// 8. Update post
app.put("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const post = db.getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Article/Post not found." });
  }

  // Verify ownership (Admin prefix is allowed bypass for testing purposes)
  if (post.authorId !== req.user!.id && req.user!.id !== "admin-system") {
    return res.status(403).json({ error: "Forbidden: You are not authorized to edit this post." });
  }

  const { title, content, summary } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content cannot be blank." });
  }

  const updated = await db.updatePost(
    req.params.id,
    title.trim(),
    content.trim(),
    summary ? summary.trim() : ""
  );

  res.json(updated);
});

// 9. Delete post
app.delete("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const post = db.getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Post could not be found." });
  }

  if (post.authorId !== req.user!.id && req.user!.id !== "admin-system") {
    return res.status(403).json({ error: "Forbidden: You are not authorized to delete this post." });
  }

  await db.deletePost(req.params.id);
  res.json({ success: true, message: "Post deleted successfully" });
});

// 10. Post Comments Section Interactions
// Create comment
app.post("/api/posts/:postId/comments", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { content } = req.body;
  const { postId } = req.params;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment content is required." });
  }

  const post = db.getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "Blog post page not found to mount this comment." });
  }

  const comment = await db.createComment(
    postId,
    content.trim(),
    req.user!.id,
    req.user!.username
  );

  res.status(201).json(comment);
});

// Delete comment
app.delete("/api/comments/:commentId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const comment = db.getCommentById(commentId);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found." });
  }

  // Authorization: author of comment OR author of post OR admin
  const post = db.getPostById(comment.postId);
  const isPostAuthor = post && post.authorId === req.user!.id;
  const isCommentAuthor = comment.authorId === req.user!.id;

  if (!isCommentAuthor && !isPostAuthor && req.user!.id !== "admin-system") {
    return res.status(403).json({ error: "Unauthorized state. You cannot delete this comment." });
  }

  await db.deleteComment(commentId);
  res.json({ success: true, message: "Comment deleted successfully." });
});

// Health metrics
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// AI Assistant (chat + tool suggestions + execution)

type AiChatRequest = {
  message: string;
  // Optional context
  context?: {
    view?: "list" | "view" | "create" | "edit" | "dashboard";
    selectedPostId?: string;
    selectedCommentId?: string;
  };
};

type AiChatAction = {
  id: string;
  type: "createPost" | "updatePost" | "deletePost" | "createComment" | "deleteComment";
  description: string;
  args: Record<string, unknown>;
  confirmRequired: boolean;
};

type AiChatResponse = {
  replyText: string;
  actions: AiChatAction[];
};

// Execute request is validated/permission-checked server-side
type AiExecuteRequest = {
  action: AiChatAction["type"];
  args: Record<string, unknown>;
  nonce: string;
  targetPostId?: string;
  targetCommentId?: string;
};

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Create a .env file or set GEMINI_API_KEY in the environment.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

async function aiGenerateChat(message: string, context?: AiChatRequest["context"]): Promise<AiChatResponse> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  // Minimal grounded context
  const me = (context?.view ? "User provided context." : "") || "";

  const prompt = [
    "You are an AI assistant embedded in a blog platform.",
    "You MUST respond with JSON only.",
    "When you think an action should be executed, propose it in the 'actions' array.",
    "Each action must be one of: createPost, updatePost, deletePost, createComment, deleteComment.",
    "For any destructive action (deletePost, deleteComment) set confirmRequired=true.",
    "For create/update actions also set confirmRequired=true to be safe (the user must approve).",
    "Do not invent ids; if you need ids, require them in args as empty and let client fill from context.",
    "Return: { replyText: string, actions: [{ id, type, description, args, confirmRequired }] }.",
    me,
    `User message: ${message}`,
    `Context (may be empty): ${JSON.stringify(context || {})}`,
    "\nIf you cannot perform actions, return actions: [] and just help with text/ideas." 
  ].join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
    },
  });

  const text = result.response.text();
  // Best-effort parse
  try {
    const parsed = JSON.parse(text);
    return parsed as AiChatResponse;
  } catch {
    return {
      replyText: text || "I couldn't parse the assistant response.",
      actions: [],
    };
  }
}

// 11. AI chat endpoint
app.post("/api/ai/chat", async (req: AuthenticatedRequest, res: Response) => {
  const { message, context } = req.body as AiChatRequest;
  if (!isString(message) || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    // Allow chat for both signed-in and signed-out users, but tool suggestions will be validated at execute time.
    const aiRes = await aiGenerateChat(message, context);
    return res.json(aiRes);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "AI chat failed" });
  }
});

// 12. AI execute endpoint
app.post("/api/ai/execute", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as AiExecuteRequest;

  if (!body || !isString(body.nonce) || !body.action) {
    return res.status(400).json({ error: "Invalid execute payload." });
  }

  const { action, args, targetPostId, targetCommentId } = body;

  if (!isRecord(args)) {
    return res.status(400).json({ error: "args must be an object." });
  }

  const userId = req.user!.id;

  // Helper: permission checks
  const isAdmin = userId === "admin-system";

  try {
    if (action === "createPost") {
      const title = isString(args.title) ? args.title : "";
      const content = isString(args.content) ? args.content : "";
      const summary = isString(args.summary) ? args.summary : "";
      if (!title.trim() || !content.trim()) {
        return res.status(400).json({ error: "createPost requires title and content." });
      }
      const post = await db.createPost(title.trim(), content.trim(), summary.trim(), userId, req.user!.username);
      return res.json({ success: true, post });
    }

    if (action === "updatePost") {
      const postId = isString(targetPostId) ? targetPostId : (isString(args.postId) ? args.postId : "");
      if (!postId) return res.status(400).json({ error: "updatePost requires targetPostId." });
      const post = db.getPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!isAdmin && post.authorId !== userId) {
        return res.status(403).json({ error: "Forbidden: not post author." });
      }
      const title = isString(args.title) ? args.title : post.title;
      const content = isString(args.content) ? args.content : post.content;
      const summary = isString(args.summary) ? args.summary : post.summary;
      const updated = await db.updatePost(postId, title, content, summary);
      return res.json({ success: true, post: updated });
    }

    if (action === "deletePost") {
      const postId = isString(targetPostId) ? targetPostId : (isString(args.postId) ? args.postId : "");
      if (!postId) return res.status(400).json({ error: "deletePost requires targetPostId." });
      const post = db.getPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!isAdmin && post.authorId !== userId) {
        return res.status(403).json({ error: "Forbidden: not post author." });
      }
      await db.deletePost(postId);
      return res.json({ success: true });
    }

    if (action === "createComment") {
      const postId = isString(targetPostId) ? targetPostId : (isString(args.postId) ? args.postId : "");
      const content = isString(args.content) ? args.content : "";
      if (!postId) return res.status(400).json({ error: "createComment requires targetPostId." });
      if (!content.trim()) return res.status(400).json({ error: "createComment requires content." });

      const post = db.getPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const comment = await db.createComment(postId, content.trim(), userId, req.user!.username);
      return res.json({ success: true, comment });
    }

    if (action === "deleteComment") {
      const commentId = isString(targetCommentId) ? targetCommentId : (isString(args.commentId) ? args.commentId : "");
      if (!commentId) return res.status(400).json({ error: "deleteComment requires targetCommentId." });
      const comment = db.getCommentById(commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      const post = db.getPostById(comment.postId);
      const isPostAuthor = !!post && post.authorId === userId;
      const isCommentAuthor = comment.authorId === userId;

      if (!isAdmin && !isPostAuthor && !isCommentAuthor) {
        return res.status(403).json({ error: "Forbidden: cannot delete this comment." });
      }

      await db.deleteComment(commentId);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "AI execute failed" });
  }
});


// Serve frontend SPA or launch dev server middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  // ServeSPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Bind to port 3000 and the all hosts interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server loaded and listening on port http://localhost:${PORT}`);
});
