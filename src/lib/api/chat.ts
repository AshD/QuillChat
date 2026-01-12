export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export class ChatCompletionError extends Error {
  status?: number;
  mode: 'direct' | 'proxy';
  detail?: string;

  constructor(
    message: string,
    options: { status?: number; mode: 'direct' | 'proxy'; detail?: string },
  ) {
    super(message);
    this.name = 'ChatCompletionError';
    this.status = options.status;
    this.mode = options.mode;
    this.detail = options.detail;
  }
}

type StreamOptions = {
  baseUrl: string;
  apiKey?: string;
  request: ChatCompletionRequest;
  onDelta: (content: string) => void | Promise<void>;
  useProxy?: boolean;
};

const buildChatUrl = (baseUrl: string) =>
  `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

const parseStreamChunk = async (
  chunk: string,
  onDelta: (content: string) => void | Promise<void>,
) => {
  const lines = chunk.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('data:')) {
      continue;
    }

    const payload = line.replace(/^data:\s?/, '').trim();
    if (!payload || payload === '[DONE]') {
      continue;
    }

    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      await onDelta(content);
    }
  }
};

export const streamChatCompletions = async ({
  baseUrl,
  apiKey,
  request,
  onDelta,
  useProxy = false,
}: StreamOptions) => {
  if (!baseUrl) {
    throw new Error('Base URL is required to send chat completions.');
  }

  const response = await fetch(
    useProxy ? '/api/chat' : buildChatUrl(baseUrl),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useProxy ? {} : apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(
        useProxy
          ? {
              baseUrl,
              apiKey,
              request: {
                ...request,
                stream: true,
              },
            }
          : {
              ...request,
              stream: true,
            },
      ),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = errorBody;
    let message = errorBody;

    if (errorBody) {
      try {
        const parsed = JSON.parse(errorBody) as {
          error?: { message?: string };
          message?: string;
        };
        message =
          parsed.error?.message ??
          parsed.message ??
          message ??
          response.statusText;
      } catch {
        message = errorBody || response.statusText;
      }
    } else {
      message = response.statusText || 'Chat completion failed.';
      detail = response.statusText;
    }

    throw new ChatCompletionError(message, {
      status: response.status,
      mode: useProxy ? 'proxy' : 'direct',
      detail,
    });
  }

  if (!response.body) {
    throw new Error('Chat completion response did not include a stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      const chunk = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);
      await parseStreamChunk(chunk, onDelta);
      boundaryIndex = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim().length > 0) {
    await parseStreamChunk(buffer, onDelta);
  }
};
