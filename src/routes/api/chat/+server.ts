import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 90_000;

const buildChatUrl = (baseUrl: string) =>
  `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

export const POST: RequestHandler = async ({ request }) => {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return json(
      {
        error: {
          message: 'Request body exceeds the allowed size limit.',
        },
      },
      { status: 413 },
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return json(
      {
        error: {
          message: 'Request body exceeds the allowed size limit.',
        },
      },
      { status: 413 },
    );
  }

  let payload: {
    baseUrl?: string;
    apiKey?: string;
    request?: Record<string, unknown>;
  };

  try {
    payload = JSON.parse(rawBody) as {
      baseUrl?: string;
      apiKey?: string;
      request?: Record<string, unknown>;
    };
  } catch {
    return json(
      {
        error: {
          message: 'Invalid JSON payload.',
        },
      },
      { status: 400 },
    );
  }

  if (!payload.baseUrl || typeof payload.baseUrl !== 'string') {
    return json(
      {
        error: {
          message: 'A valid baseUrl is required for proxy requests.',
        },
      },
      { status: 400 },
    );
  }

  if (!payload.request || typeof payload.request !== 'object') {
    return json(
      {
        error: {
          message: 'A valid chat completion request is required.',
        },
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort('Upstream request timed out.');
  }, REQUEST_TIMEOUT_MS);

  let upstream: Response;

  try {
    upstream = await fetch(buildChatUrl(payload.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.apiKey ? { Authorization: `Bearer ${payload.apiKey}` } : {}),
      },
      body: JSON.stringify({
        ...payload.request,
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    return json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to reach the upstream chat service.',
        },
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const errorBody = await upstream.text();
    clearTimeout(timeoutId);
    return json(
      {
        error: {
          message: `Upstream error: ${upstream.status} ${
            errorBody || upstream.statusText
          }`,
        },
      },
      { status: upstream.status },
    );
  }

  if (!upstream.body) {
    clearTimeout(timeoutId);
    return json(
      {
        error: {
          message: 'Upstream response did not include a stream.',
        },
      },
      { status: 502 },
    );
  }

  const reader = upstream.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async pull(streamController) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          clearTimeout(timeoutId);
          streamController.close();
          return;
        }
        if (value) {
          streamController.enqueue(value);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        streamController.error(error);
      }
    },
    async cancel() {
      clearTimeout(timeoutId);
      await reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
