# QuillChat Architecture (SvelteKit OpenAI-Compatible Web Client)

## Goals
- Build a SvelteKit web chat client inspired by the llama.cpp web UI.
- Connect to any OpenAI-compatible ChatCompletion API endpoint (base URL + API key).
- Provide a fast, simple chat experience with streaming responses.
- Maintain user privacy by keeping messages local unless explicitly sent to the configured API.

## Non-Goals
- Hosting or bundling a model runtime (no local inference in the browser).
- Building a full multi-tenant backend; this is a client-first application.
- Supporting proprietary vendor features beyond the OpenAI-compatible spec unless explicitly added later.

## Target Users
- Developers and hobbyists running OpenAI-compatible endpoints (local or hosted).
- Users who want a lightweight, configurable web client.

## Architectural Overview

### High-Level System
- **Frontend (SvelteKit)**: Single-page app experience with routing, UI components, and state management.
- **Server Routes (SvelteKit)**: Optional proxy endpoints for API calls and streaming, used when CORS or security requires it.
- **Storage**: Local storage/IndexedDB for user settings and conversation history.

```
Browser
  └─ SvelteKit UI
      ├─ Chat UI (messages, composer, model selection)
      ├─ Settings (endpoint, API key, model defaults)
      └─ Storage (local settings + history)

SvelteKit Server (optional proxy)
  └─ /api/chat (streams to client)

OpenAI-Compatible API
  └─ /v1/chat/completions
```

## Key Requirements

### Functional
- Configure API base URL and API key.
- Send ChatCompletion requests with model, messages, temperature, max_tokens, etc.
- Stream responses to the UI in real time.
- Persist chat history and settings locally.
- Allow multiple conversations with basic metadata (title, timestamp).

### Non-Functional
- Low latency, responsive UI.
- Security for API keys (client-side only unless server proxy is enabled).
- Clear error handling with actionable messages.

## API Compatibility
Assumes OpenAI-style ChatCompletion endpoint:
- `POST {baseUrl}/v1/chat/completions`
- Request shape:
  - `model: string`
  - `messages: {role: 'system'|'user'|'assistant', content: string}[]`
  - `temperature?: number`
  - `max_tokens?: number`
  - `stream?: boolean`
- Response:
  - Non-stream: `choices[0].message.content`
  - Stream: SSE-style `data: {choices:[{delta:{content}}]}` chunks

## Frontend Architecture

### Pages & Routes
- `/` (Chat View)
  - Main chat interface.
  - Conversation list sidebar.
- `/settings`
  - Endpoint URL, API key, default model, system prompt.

### Core Components
- `ChatLayout.svelte`: main page layout.
- `ConversationList.svelte`: list of sessions with create/delete.
- `MessageList.svelte`: render messages with role styling.
- `MessageComposer.svelte`: input and send button.
- `SettingsForm.svelte`: endpoint + model config.

### State Management
- Use Svelte stores for:
  - `settingsStore` (base URL, API key, default model, temperature).
  - `conversationsStore` (array of conversations and active selection).
  - `messagesStore` (messages for current conversation).

### Storage
- `localStorage` for settings.
- `IndexedDB` (via a lightweight wrapper) for conversations and messages.

## Networking & Streaming

### Option A: Direct Browser Calls (default)
- Client directly calls `{baseUrl}/v1/chat/completions`.
- Requires CORS on the endpoint.

### Option B: SvelteKit Proxy
- Client calls `/api/chat` on same origin.
- Server route forwards to configured endpoint.
- Server handles streaming and relays chunks to client.
- API key can be sent from client to proxy (still user-provided) or stored in session.

### Streaming Flow
1. User sends a prompt.
2. `messagesStore` appends user message.
3. Request is sent with `stream: true`.
4. Stream parser reads chunks and appends assistant tokens to the message.
5. UI updates in real-time.

## Security Considerations
- API keys are stored locally and never sent elsewhere except the configured endpoint.
- Proxy option should warn users that the key transits the server route.
- Implement request size and timeouts on proxy to mitigate abuse.

## Error Handling
- Show clear error messages (network, authentication, invalid model).
- Allow retry with preserved conversation state.

## Observability
- Client-side logging for requests and errors (disabled by default in production).
- Optional debug panel for stream tracing.

## Future Enhancements
- Model discovery from `/v1/models`.
- Export/import conversations.
- Markdown rendering with code highlighting.
- Prompt templates and presets.
- Multi-tab sync using BroadcastChannel.

## Technology Stack
- SvelteKit
- TypeScript
- Tailwind CSS (or another utility-first CSS framework)
- `fetch` + stream parsing utilities
- IndexedDB wrapper (e.g., `idb`)

## Implementation Plan (High-Level)
1. Scaffold SvelteKit project with TypeScript.
2. Build settings and persistence layer.
3. Implement chat UI and conversation storage.
4. Add streaming support.
5. Optional: add server proxy route for streaming + CORS.

