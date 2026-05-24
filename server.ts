import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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
