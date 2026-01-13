# QuillChat Runbook

## Can it connect to a chat endpoint?
Yes. The codebase already includes direct and proxy support for OpenAI-compatible
ChatCompletion endpoints. The client builds requests to `POST {baseUrl}/v1/chat/completions`
with streaming enabled and supports either direct browser calls or an optional
SvelteKit proxy at `/api/chat`.

**What you need**
- A reachable OpenAI-compatible endpoint (e.g., local or hosted) that accepts
  `POST /v1/chat/completions`.
- Optional API key for Authorization (Bearer token).
- If you plan to call the endpoint directly from the browser, the endpoint must
  allow CORS from your app’s origin. If not, enable the proxy mode in the app.

## Steps to run locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Open the app
Navigate to:
```
http://localhost:5173
```

### 4. Configure your chat endpoint
1. Open the **Settings** page in the UI.
2. Enter:
   - **Base URL** (e.g., `https://api.example.com` or `http://localhost:8080`).
   - **API key** (if required by the endpoint).
   - **Default model** (must match a model your endpoint exposes).
3. Save settings and return to the chat view.

### 5. Send a message
- Start a new conversation and send a prompt. The UI will stream responses in
  real time.

## Proxy mode (when CORS is an issue)
If your endpoint does not support CORS, the app can send requests through the
SvelteKit proxy at `/api/chat`.

- The UI will call `/api/chat` and the server route will forward to
  `{baseUrl}/v1/chat/completions`.
- The proxy supports streaming responses and forwards the `Authorization` header
  when an API key is provided.

## Build & preview
```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Troubleshooting
- **401/403**: Check API key and ensure it has access to the model.
- **CORS errors**: Enable proxy mode or configure the endpoint to allow CORS.
- **Network errors**: Verify base URL and that the endpoint is reachable.
