import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  MessageSquare, 
  ArrowLeft, 
  Calendar, 
  X, 
  Lock, 
  Mail, 
  UserPlus, 
  Feather,
  AlertCircle,
  Search,
  LayoutGrid
} from "lucide-react";
import { api } from "./api";
import { Post, Comment, User } from "./types";
import type { AiChatResponse, AiSuggestedAction } from "./ai-types";

export default function App() {
  // Navigation & Views
  const [view, setView] = useState<"list" | "view" | "create" | "edit" | "dashboard">("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");

  // Form states
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null); // null means modal closed
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postContent, setPostContent] = useState("");
  const [commentContent, setCommentContent] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const user = await api.getMe();
        setCurrentUser(user);
        await refreshPosts();
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const showNotification = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(message);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(message);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const refreshPosts = async () => {
    try {
      const fetched = await api.getPosts();
      setPosts(fetched);
    } catch (err: any) {
      showNotification(err.message || "Failed to load posts", true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      if (authMode === "login") {
        const response = await api.login(emailInput, passwordInput);
        setCurrentUser(response.user);
        showNotification(`Welcome back, ${response.user.username}!`);
        setAuthMode(null);
        resetAuthForm();
      } else if (authMode === "register") {
        const response = await api.register(usernameInput, emailInput, passwordInput);
        setCurrentUser(response.user);
        showNotification(`Welcome to The Inkwell, ${response.user.username}!`);
        setAuthMode(null);
        resetAuthForm();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication error occurred");
    }
  };

  const resetAuthForm = () => {
    setUsernameInput("");
    setEmailInput("");
    setPasswordInput("");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      showNotification("You have logged out.");
      // If we are in restricted view layouts, bounce to general feeding list
      if (view === "create" || view === "edit" || view === "dashboard") {
        setView("list");
      }
    } catch (err: any) {
      showNotification("Logout failed", true);
    }
  };

  const loadSinglePost = async (id: string, skipLoadingState = false) => {
    try {
      if (!skipLoadingState) setLoading(true);
      const data = await api.getPost(id);
      setCurrentPost(data.post);
      setComments(data.comments);
    } catch (err: any) {
      showNotification(err.message || "Could not view post", true);
      setView("list");
    } finally {
      if (!skipLoadingState) setLoading(false);
    }
  };

  const handleViewPost = (id: string) => {
    setSelectedPostId(id);
    loadSinglePost(id);
    setView("view");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToCreate = () => {
    if (!currentUser) {
      setAuthMode("login");
      showNotification("Please sign in to publish an article.", true);
      return;
    }
    setPostTitle("");
    setPostSummary("");
    setPostContent("");
    setView("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToEdit = (post: Post) => {
    if (!currentUser || (post.authorId !== currentUser.id && currentUser.id !== "admin-system")) {
      showNotification("You do not have permission to edit this post", true);
      return;
    }
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostSummary(post.summary);
    setPostContent(post.content);
    setView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showNotification("Please fill in both the title and raw post content", true);
      return;
    }

    try {
      setLoading(true);
      const freshPost = await api.createPost(postTitle, postContent, postSummary);
      showNotification("Your article has been successfully published!");
      await refreshPosts();
      handleViewPost(freshPost.id);
    } catch (err: any) {
      showNotification(err.message || "Failed to create post", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId) return;
    if (!postTitle.trim() || !postContent.trim()) {
      showNotification("Title and content cannot be empty", true);
      return;
    }

    try {
      setLoading(true);
      await api.updatePost(editingPostId, postTitle, postContent, postSummary);
      showNotification("Successfully updated your article.");
      await refreshPosts();
      await loadSinglePost(editingPostId);
      setView("view");
    } catch (err: any) {
      showNotification(err.message || "Failed to edit post", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you certain you wish to delete this article? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await api.deletePost(id);
      showNotification("The article has been permanently deleted.");
      await refreshPosts();
      if (view === "view" && selectedPostId === id) {
        setView("list");
        setSelectedPostId(null);
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to delete post", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthMode("login");
      showNotification("Please log in to participate in the comments.", true);
      return;
    }
    if (!commentContent.trim() || !selectedPostId) {
      return;
    }

    try {
      await api.createComment(selectedPostId, commentContent);
      setCommentContent("");
      // Refresh current post comments quietly
      await loadSinglePost(selectedPostId, true);
      showNotification("Comment added successfully!");
    } catch (err: any) {
      showNotification(err.message || "Could not publish comment", true);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Remove this comment?")) return;

    try {
      await api.deleteComment(commentId);
      if (selectedPostId) {
        await loadSinglePost(selectedPostId, true);
      }
      showNotification("Comment removed.");
    } catch (err: any) {
      showNotification(err.message || "Failed to delete comment", true);
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // AI Assistant UI state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  type AiMessage = { id: string; role: "user" | "assistant"; text: string };
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);

  const [aiPendingActions, setAiPendingActions] = useState<AiSuggestedAction[]>([]);

  const getAiContext = () => {
    return {
      view,
      selectedPostId: selectedPostId ?? undefined,
    };
  };

  const submitAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = aiInput.trim();
    if (!msg) return;

    setAiError(null);
    setAiLoading(true);

    const myNonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      setAiMessages((prev) => [...prev, { id: myNonce, role: "user", text: msg }]);
      setAiInput("");

      const aiRes = await api.aiChat(msg, getAiContext());

      const assistantId = `${myNonce}-assistant`;
      setAiMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: aiRes.replyText }]);
      setAiPendingActions(aiRes.actions || []);
    } catch (err: any) {
      setAiError(err?.message || "AI chat failed");
    } finally {
      setAiLoading(false);
    }
  };

  const confirmAndExecuteAction = async (action: AiSuggestedAction) => {
    setAiError(null);
    setAiLoading(true);
    try {
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const args = action.args || {};
      const postIdFromArgs = typeof (args as any).postId === "string" ? ((args as any).postId as string) : undefined;
      const commentIdFromArgs = typeof (args as any).commentId === "string" ? ((args as any).commentId as string) : undefined;

      // Deterministic target id mapping (never clobber with undefined if UI context exists)
      const targetPostId =
        action.type === "updatePost" || action.type === "deletePost" || action.type === "createComment"
          ? postIdFromArgs ?? selectedPostId ?? undefined
          : undefined;

      const targetCommentId =
        action.type === "deleteComment"
          ? commentIdFromArgs ?? undefined
          : undefined;

      // Fail fast with helpful messages (backend will also validate)
      if (
        (action.type === "updatePost" || action.type === "deletePost" || action.type === "createComment") &&
        !targetPostId
      ) {
        throw new Error(`This action requires a target post. Open/Select a post first.`);
      }

      if (action.type === "deleteComment" && !targetCommentId) {
        throw new Error(`This action requires a target comment. Delete buttons in the UI provide the correct comment context.`);
      }

      const payload = {
        action: action.type,
        args,
        nonce,
        targetPostId,
        targetCommentId,
      };

      const result = await api.aiExecute(payload as any);


      // Refresh UI if we have relevant targets
      await refreshPosts();
      if (selectedPostId) {
        await loadSinglePost(selectedPostId, true);
      }

      // Clear pending actions on success
      setAiPendingActions([]);

      if (result?.post) {
        setSelectedPostId(result.post.id);
      }

      setAiMessages((prev) => [...prev, { id: `${nonce}-system`, role: "assistant", text: "✅ Action executed successfully." }]);
    } catch (err: any) {
      setAiError(err?.message || "Action execution failed");
      setAiMessages((prev) => [...prev, { id: `${Date.now()}-err`, role: "assistant", text: `⚠️ ${err?.message || "Action execution failed"}` }]);
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] selection:bg-neutral-200">
      <RadheAssistant />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <button 
            id="logo-btn"
            onClick={() => { setView("list"); setSelectedPostId(null); }}
            className="flex items-center space-x-2.5 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-200">
              <Feather className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight text-neutral-900">The Inkwell</h1>
              <p className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">Thoughtful Writings</p>
            </div>
          </button>

          <nav className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline-block text-xs font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded">
                  @{currentUser.username}
                </span>
                <button
                  id="header-dashboard-btn"
                  onClick={() => {
                    setView("dashboard");
                    setDashboardSearchQuery("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 ${view === "dashboard" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>My Stories</span>
                </button>
                <button
                  id="header-write-btn"
                  onClick={handleGoToCreate}
                  className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  id="header-ai-toggle-btn"
                  onClick={() => { setAiOpen(true); setAiError(null); }}
                  title="AI Assistant"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-150 cursor-pointer"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>AI</span>
                  </span>
                </button>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  id="header-login-btn"
                  onClick={() => setAuthMode("login")}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-150"
                >
                  Sign In
                </button>
                <button
                  id="header-register-btn"
                  onClick={() => setAuthMode("register")}
                  className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-full transition-colors duration-150 shadow-sm"
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Notifications Grid */}
      <div className="max-w-5xl mx-auto px-6 mt-4">
        {errorMsg && (
          <div id="error-notice-card" className="flex items-start space-x-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl text-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div id="success-notice-card" className="flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3.5 rounded-xl text-sm animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-6 h-6 border-[2px] border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-mono text-neutral-400 uppercase tracking-widest">Gathering letters...</p>
          </div>
        )}

        {!loading && view === "list" && (
          <div className="space-y-12">
            {/* Spotlight Hero Article */}
            {posts.length > 0 && (
              <div 
                id="hero-post-strip"
                onClick={() => handleViewPost(posts[0].id)}
                className="group relative bg-white border border-neutral-100 rounded-2xl p-6 sm:p-8 hover:border-neutral-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 cursor-pointer overflow-hidden grid md:grid-cols-5 gap-6"
              >
                <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="inline-block bg-neutral-900 text-white text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded">
                      Featured Post
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-neutral-900 group-hover:text-neutral-700 transition-colors duration-200">
                      {posts[0].title}
                    </h2>
                    <p className="text-neutral-500 text-sm sm:text-base leading-relaxed line-clamp-3">
                      {posts[0].summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                    <div className="flex items-center space-x-2 text-xs text-neutral-500">
                      <span className="font-semibold text-neutral-800">{posts[0].authorName}</span>
                      <span>•</span>
                      <span>{formatDate(posts[0].createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-[#f3f4f6] rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-3 border border-neutral-100">
                  <BookOpen className="w-12 h-12 text-neutral-300 stroke-[1]" />
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Written Wisdom</p>
                  <p className="text-xs text-neutral-500 px-4 leading-relaxed">
                    Click to load this feature article's active reading flow & discussion.
                  </p>
                </div>
              </div>
            )}

            {/* List / Feed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-serif text-xl font-bold text-neutral-800">Recent Writings</h3>
                <span className="text-xs font-mono text-neutral-400">{posts.length} articles</span>
              </div>

              {posts.length <= 1 ? (
                posts.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-2xl">
                    <Feather className="w-12 h-12 text-neutral-300 mx-auto stroke-[1.2] mb-3" />
                    <h4 className="font-serif text-lg font-semibold text-neutral-700">No stories yet</h4>
                    <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
                      Become the first author on this platform. Sign up or Log In to write and publish your voice.
                    </p>
                    <button
                      onClick={handleGoToCreate}
                      className="mt-4 px-5 py-2 inline-flex items-center space-x-2 text-xs font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Write First Post</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 italic">No other articles available.</p>
                )
              ) : (
                <div id="posts-grid-system" className="grid sm:grid-cols-2 gap-6">
                  {posts.slice(1).map((post) => (
                    <article
                      key={post.id}
                      onClick={() => handleViewPost(post.id)}
                      className="group bg-white border border-neutral-100 rounded-xl p-5 hover:border-neutral-200 hover:shadow-[0_4px_24px_rgb(0,0,0,0.02)] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <h4 className="font-serif text-lg font-bold leading-snug text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-50 text-xs">
                        <div className="text-neutral-500">
                          <span className="font-medium text-neutral-700">@{post.authorName}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dedicated Workspace Dashboard */}
        {!loading && view === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Dashboard Header Banner */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-block bg-neutral-900 text-white text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded">
                  Author Workspace
                </span>
                <h2 className="font-serif text-3xl font-extrabold text-neutral-900">
                  Manage Your Stories
                </h2>
                <p className="text-neutral-500 text-sm">
                  Write new articles, update written stories, or delete drafts permanently with dedicated administrative options.
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-4 flex-shrink-0 min-w-[240px]">
                <div className="bg-[#fafafa] border border-neutral-100 p-4 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#a3a3a3]">Total Inkings</p>
                  <p className="text-2xl font-serif font-bold text-neutral-900 mt-1">
                    {currentUser ? posts.filter(p => p.authorId === currentUser.id || currentUser.id === "admin-system").length : 0}
                  </p>
                </div>
                <div className="bg-[#fafafa] border border-neutral-100 p-4 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#a3a3a3]">Joined Since</p>
                  <p className="text-xs font-semibold text-neutral-800 mt-2.5">
                    {currentUser ? new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "May 2026"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 text-neutral-400 w-4 h-4 stroke-[1.5]" />
                <input
                  id="dashboard-search-input"
                  type="text"
                  placeholder="Search your library..."
                  value={dashboardSearchQuery}
                  onChange={(e) => setDashboardSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-300"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  id="dashboard-write-new"
                  onClick={handleGoToCreate}
                  className="px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write New Story</span>
                </button>
              </div>
            </div>

            {/* Dashboard List elements */}
            <div className="space-y-4">
              {(() => {
                const filteredPosts = posts
                  .filter(p => currentUser && (p.authorId === currentUser.id || currentUser.id === "admin-system"))
                  .filter(p => !dashboardSearchQuery || p.title.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || p.summary.toLowerCase().includes(dashboardSearchQuery.toLowerCase()));

                if (filteredPosts.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-2xl">
                      <Feather className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <h4 className="font-serif text-lg font-semibold text-neutral-700">No matching stories found</h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        {dashboardSearchQuery ? "Try altering your query characters." : "You have not published any stories yet."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-4">
                    {filteredPosts.map(post => (
                      <div 
                        key={post.id}
                        className="bg-white border border-neutral-100 hover:border-neutral-200 p-5 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <h3 
                            onClick={() => handleViewPost(post.id)}
                            className="font-serif text-lg font-bold text-neutral-900 hover:text-neutral-700 transition-colors cursor-pointer"
                          >
                            {post.title}
                          </h3>
                          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {post.summary}
                          </p>
                          <div className="flex items-center space-x-3 pt-1 text-[10px] font-mono text-neutral-400">
                            <span>Published {formatDate(post.createdAt)}</span>
                            {currentUser && currentUser.id === "admin-system" && post.authorId !== currentUser.id && (
                              <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                                Author: @{post.authorName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* HIGHLY VISIBLE SEPARATE ACTION BUTTONS */}
                        <div className="flex items-center space-x-2.5 flex-shrink-0">
                          <button
                            id={`dashboard-edit-btn-${post.id}`}
                            onClick={() => handleGoToEdit(post)}
                            className="flex-1 sm:flex-initial px-4 py-2 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 rounded-lg text-xs font-bold text-neutral-700 inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                            title="Edit this post article"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Edit Story</span>
                          </button>
                          <button
                            id={`dashboard-delete-btn-${post.id}`}
                            onClick={() => handleDeletePost(post.id)}
                            className="flex-1 sm:flex-initial px-4 py-2 border border-red-100 bg-red-50 text-red-600 hover:bg-neutral-900 hover:text-white rounded-lg text-xs font-bold inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                            title="Permanently remove post article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* View Single Article */}
        {!loading && view === "view" && currentPost && (
          <article className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            {/* Back Button */}
            <button
              id="back-to-list-btn"
              onClick={() => { setView("list"); setSelectedPostId(null); }}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to home</span>
            </button>

            {/* Post Header */}
            <header className="space-y-4 border-b border-neutral-100 pb-6">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-950">
                {currentPost.title}
              </h1>

              {currentPost.summary && (
                <p className="text-neutral-500 text-base sm:text-lg italic font-serif leading-relaxed">
                  {currentPost.summary}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2.5 text-xs text-neutral-500">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-serif font-bold uppercase">
                    {currentPost.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{currentPost.authorName}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{formatDate(currentPost.createdAt)}</p>
                  </div>
                </div>

                {currentUser && (currentPost.authorId === currentUser.id || currentUser.id === "admin-system") && (
                  <div className="flex items-center space-x-2">
                    <button
                      id="view-edit-btn"
                      onClick={() => handleGoToEdit(currentPost)}
                      className="px-3.5 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-xs font-semibold inline-flex items-center space-x-1 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Article</span>
                    </button>
                    <button
                      id="view-delete-btn"
                      onClick={() => handleDeletePost(currentPost.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center space-x-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Post Content Body */}
            <div id="post-rich-content" className="prose text-neutral-800 leading-relaxed text-base sm:text-lg space-y-6 font-serif">
              {currentPost.content.split("\n\n").map((para, idx) => {
                if (para.startsWith("> ")) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-neutral-900 pl-4 py-1 italic my-4 text-neutral-600">
                      {para.slice(2)}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="whitespace-pre-line leading-relaxed">
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Comments Divider */}
            <hr className="border-neutral-100" />

            {/* Comments Area */}
            <section id="discussion-segment" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-neutral-800 stroke-[1.5]" />
                  <h3 className="font-serif text-lg font-bold text-neutral-900">Discussion Zone</h3>
                </div>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-500">
                  {comments.length} Comments
                </span>
              </div>

              {/* Add Comment Block */}
              {currentUser ? (
                <form id="comment-composition-form" onSubmit={handleAddComment} className="space-y-3 bg-white p-4 border border-neutral-100 rounded-xl">
                  <div className="flex items-center space-x-2 text-xs font-mono text-neutral-500">
                    <span>Commenting as</span>
                    <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">@{currentUser.username}</span>
                  </div>
                  <textarea
                    id="comment-textarea"
                    rows={3}
                    placeholder="Contribute your perspective to this article..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full text-sm font-sans bg-[#fafafa] p-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:bg-white transition-all resize-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      id="comment-submit-btn"
                      type="submit"
                      disabled={!commentContent.trim()}
                      className="px-4 py-2 bg-neutral-900 border border-transparent text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Publish Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-6 text-center">
                  <p className="text-sm text-neutral-500">
                    Have an insight or question about this story?
                  </p>
                  <button
                    onClick={() => setAuthMode("login")}
                    className="mt-3 px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5"
                  >
                    <span>Sign In to Comment</span>
                  </button>
                </div>
              )}

              {/* Comments Feed */}
              <div id="comments-feed" className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic text-center py-4">No comments on this post yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="bg-white border border-neutral-100 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-neutral-800">@{comment.authorName}</span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-neutral-400 font-mono text-[10px]">{formatDate(comment.createdAt)}</span>
                        </div>

                        {currentUser && (comment.authorId === currentUser.id || currentPost.authorId === currentUser.id || currentUser.id === "admin-system") && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-neutral-700 leading-relaxed font-sans whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </article>
        )}

        {/* Create / Edit Article Views */}
        {!loading && (view === "create" || view === "edit") && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            {/* Back Header */}
            <div>
              <button
                onClick={() => {
                  if (view === "edit" ? window.confirm("Discard changes?") : window.confirm("Discard unsaved post draft?")) {
                    setView(view === "edit" ? "view" : "list");
                  }
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel draft editing</span>
              </button>
              <h2 className="font-serif text-3xl font-extrabold text-neutral-900 mt-3">
                {view === "create" ? "Write a Story" : "Edit your Story"}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                {view === "create" ? "POSTING NEW ARTICLE" : `REVISING POST ID: ${editingPostId}`}
              </p>
            </div>

            {/* Write Form */}
            <form onSubmit={view === "create" ? handleCreatePost : handleUpdatePost} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 block">Article Title</label>
                <input
                  id="editor-title-input"
                  type="text"
                  placeholder="Enter a compelling title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full font-serif text-2xl sm:text-3xl font-bold bg-white p-4 border border-neutral-200 rounded-xl focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-300"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 block">Excerpt / Summary</label>
                <input
                  id="editor-summary-input"
                  type="text"
                  placeholder="Provide a brief punchy one-sentence summary (optional)"
                  value={postSummary}
                  onChange={(e) => setPostSummary(e.target.value)}
                  className="w-full text-sm font-sans bg-white p-3 border border-neutral-200 rounded-xl focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-500 block">Content</label>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                    TIP: Start lines with {`"> "`} for quotation formats
                  </span>
                </div>
                <textarea
                  id="editor-content-textarea"
                  rows={14}
                  placeholder="Express your ideas here. Create paragraphs using double-line returns..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full text-base font-serif bg-white p-4 sm:p-6 border border-neutral-200 rounded-xl focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-300 resize-y leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    if (view === "edit" ? window.confirm("Discard changes?") : window.confirm("Discard draft?")) {
                      setView(view === "edit" ? "view" : "list");
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
                >
                  Discard Draft
                </button>
                <button
                  id="editor-publish-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
                >
                  {view === "create" ? "Publish Article" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* AI Assistant Drawer */}
      {aiOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAiOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-100 mx-4 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-neutral-800" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-950">AI Assistant</h3>
                  <p className="text-[11px] font-mono text-neutral-500">Gemini-like chat + safe action execution</p>
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                aria-label="Close AI assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {aiError && (
                <div className="mb-3 flex items-start space-x-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">Error:</span> {aiError}
                  </div>
                  <button onClick={() => setAiError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="h-[340px] overflow-y-auto pr-2 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500">
                    <p className="text-xs font-mono uppercase tracking-widest">Ask anything</p>
                    <p className="mt-2 text-sm">Example: “Write a blog post about my project idea: …”</p>
                  </div>
                ) : (
                  aiMessages.map((m) => (
                    <div
                      key={m.id}
                      className={
                        m.role === "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[78%] bg-neutral-900 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow"
                            : "max-w-[78%] bg-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-bl-sm border border-neutral-200"
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  ))
                )}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-bl-sm border border-neutral-200">
                      <p className="text-sm">Thinking…</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending actions */}
              {aiPendingActions.length > 0 && (
                <div className="mt-4 bg-[#fafafa] border border-neutral-100 rounded-xl p-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">Proposed Actions</p>
                  <div className="mt-2 space-y-2">
                    {aiPendingActions.map((a) => (
                      <div key={a.id} className="flex items-start justify-between gap-3 bg-white border border-neutral-100 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{a.type}</p>
                          <p className="text-xs text-neutral-600 mt-1">{a.description}</p>
                        </div>
                        {a.confirmRequired ? (
                          <button
                            onClick={() => confirmAndExecuteAction(a)}
                            disabled={aiLoading}
                            className="px-3 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => confirmAndExecuteAction(a)}
                            disabled={aiLoading}
                            className="px-3 py-2 bg-neutral-100 text-neutral-800 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                          >
                            Execute
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={submitAi} className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-1">Your message</label>
                  <textarea
                    rows={3}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Chat with the assistant. It can suggest actions for your posts/comments."
                    className="w-full text-sm bg-white p-3 border border-neutral-200 rounded-xl focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-3 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Auth Side-Drawer overlay */}
      {authMode && (
        <div id="auth-overlay-backdrop" className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div 
            id="auth-modal-card" 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-100 p-6 md:p-8 relative mx-4 animate-scaleUp"
          >
            {/* Close button */}
            <button 
              onClick={() => { setAuthMode(null); setErrorMsg(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo Accent header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center text-center mx-auto mb-3">
                <Feather className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900">
                {authMode === "login" ? "Welcome Back" : "Join the Community"}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {authMode === "login" ? "Sign in to ink your thoughts and join discussions." : "Create your writer profile to start publishing logs."}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex border-b border-neutral-100 mb-6">
              <button
                id="toggle-login-mode"
                onClick={() => { setAuthMode("login"); setErrorMsg(null); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${authMode === "login" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
              >
                Sign In
              </button>
              <button
                id="toggle-register-mode"
                onClick={() => { setAuthMode("register"); setErrorMsg(null); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${authMode === "register" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
              >
                Register
              </button>
            </div>

            {/* Submit Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-neutral-500 block">Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-neutral-400 text-sm">@</span>
                    <input
                      id="auth-username-input"
                      type="text"
                      placeholder="scribe_ink"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full text-sm bg-[#fafafa] pl-8 pr-3.5 py-2 border border-neutral-200 rounded-lg focus:bg-white focus:border-neutral-800 transition-colors"
                      required
                      minLength={3}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-neutral-500 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-neutral-400 w-4 h-4 stroke-[1.5]" />
                  <input
                    id="auth-email-input"
                    type="email"
                    placeholder="you@domain.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-sm bg-[#fafafa] pl-10 pr-3.5 py-2 border border-neutral-200 rounded-lg focus:bg-white focus:border-neutral-800 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-neutral-500 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-neutral-400 w-4 h-4 stroke-[1.5]" />
                  <input
                    id="auth-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-sm bg-[#fafafa] pl-10 pr-3.5 py-2 border border-neutral-200 rounded-lg focus:bg-white focus:border-neutral-800 transition-colors"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-lg shadow-md transition-colors mt-4 flex items-center justify-center space-x-1 cursor-pointer"
              >
                {authMode === "register" ? <UserPlus className="w-4 h-4" /> : null}
                <span>{authMode === "login" ? "Sign In" : "Register Profile"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Small aesthetic footer */}
      <footer className="mt-20 border-t border-neutral-100 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-neutral-400 text-xs gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span id="server-status-pill" className="font-mono uppercase tracking-wider text-emerald-600 font-semibold bg-emerald-50/50 px-2.5 py-1 rounded border border-emerald-100/50">RKP SERVER ACTIVE</span>
          </div>
          <p className="font-serif italic text-neutral-400">“Writings lock context securely inside memory.”</p>
          <span className="font-mono">@ 2026 RKP SERVER PLATFORM</span>
        </div>
      </footer>
    </div>
  );
}
