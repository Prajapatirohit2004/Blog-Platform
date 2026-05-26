# TODO: AI Assistant (Gemini-like chat + actions) Implementation

## Step 1 — Implement AI API client
- [x] Edit `src/api.ts`
  - Add `api.aiChat()` calling `POST /api/ai/chat`
  - Add `api.aiExecute()` calling `POST /api/ai/execute`


## Step 2 — Add AI UI to frontend
- [x] Edit `src/App.tsx`
  - Add AI panel/modal UI with chat history + input
  - Call `api.aiChat()` on send
  - Render `replyText`
  - Render suggested actions with confirm step when `confirmRequired`


## Step 3 — Execute actions + refresh data
- [x] Edit `src/App.tsx`
  - On confirm: call `api.aiExecute()` with nonce
  - Refresh posts / current post as needed


## Step 4 — Sanity testing
- [x] Run dev server and test chat-only mode
- [x] Test an action suggestion and confirm execution
- [x] Verify permission errors are displayed in UI


