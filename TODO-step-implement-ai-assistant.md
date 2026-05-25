# TODO-step-implement-ai-assistant

1. Update `server.ts`:
   - Add `POST /api/ai/chat` that calls Gemini and returns `{ reply, actions[] }`.
   - Add `POST /api/ai/execute` that validates auth + permissions and executes allowed actions (create/update/delete posts, create/delete comments).
   - Keep execution conservative: reject unknown actions; validate args.

2. Update `src/App.tsx`:
   - Add AI assistant panel (chat UI).
   - Send chat messages to `/api/ai/chat`.
   - Render suggested actions with Confirm buttons.
   - On confirm, call `/api/ai/execute`, then refresh posts / reload post if needed.

3. Update `TODO.md` checkboxes.

4. Run `npx tsc --noEmit` to ensure TypeScript builds.

