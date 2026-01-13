<script lang="ts">
  import { get } from 'svelte/store';

  import { ChatCompletionError, streamChatCompletions } from '$lib/api/chat';
  import type { ConversationRecord, MessageRecord } from '$lib/storage/db';
  import { conversationsStore, currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { settingsStore } from '$lib/stores/settings';
  import { uiStore, type UiError } from '$lib/stores/ui';
  import { renderMarkdown } from '$lib/utils/markdown';

  let message = '';


  const buildUiError = (
    error: unknown,
    context: { conversationId: string; model: string; mode: 'direct' },
  ): UiError => {
    const base: UiError = {
      id: crypto.randomUUID(),
      title: 'Unable to send message',
      message: 'The chat service did not respond. Please try again.',
      conversationId: context.conversationId,
      mode: context.mode,
    };

    if (error instanceof ChatCompletionError) {
      const lower = error.message.toLowerCase();
      base.detail = error.message;
      base.status = error.status;
      base.mode = error.mode;

      if (error.status === 401 || error.status === 403 || lower.includes('api key')) {
        return {
          ...base,
          title: 'Authentication error',
          message:
            'We could not authenticate the request. Check your API key in Settings and try again.',
        };
      }

      if (
        error.status === 404 ||
        (lower.includes('model') && (lower.includes('not found') || lower.includes('missing')))
      ) {
        return {
          ...base,
          title: 'Model not found',
          message: `The model "${context.model}" is unavailable. Update the default model in Settings.`,
        };
      }

      if (error.status === 429 || lower.includes('rate limit')) {
        return {
          ...base,
          title: 'Rate limit reached',
          message: 'The service is rate limiting requests. Wait a moment and retry.',
        };
      }

      if (error.status && error.status >= 500) {
        return {
          ...base,
          title: 'Service unavailable',
          message: 'The chat service is temporarily unavailable. Try again shortly.',
        };
      }

      if (error.status === 400) {
        return {
          ...base,
          title: 'Request rejected',
          message:
            'The request was rejected. Verify the model name and settings, then retry.',
        };
      }

      return {
        ...base,
        title: 'Request failed',
        message: error.message || base.message,
      };
    }

    if (error instanceof Error) {
      const lower = error.message.toLowerCase();
      if (error.name === 'AbortError') {
        return {
          ...base,
          title: 'Request timed out',
          message: 'The request took too long. Retry in a moment.',
          detail: error.message,
        };
      }

      if (lower.includes('failed to fetch') || lower.includes('network')) {
        return {
          ...base,
          title: 'Network error',
          message:
            'Network error while contacting the chat service. Check your connection and retry.',
          detail: error.message,
        };
      }

      return {
        ...base,
        title: 'Unexpected error',
        message: error.message || base.message,
        detail: error.message,
      };
    }

    return base;
  };

  const createConversation = (initialMessage: string) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const title = initialMessage.trim().slice(0, 40) || 'New Chat';
    const conversation: ConversationRecord = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
    };

    conversationsStore.upsert(conversation);
    currentConversationIdStore.set(id);

    return conversation;
  };

  const updateConversationTimestamp = (conversationId: string, content: string) => {
    const existing = $conversationsStore.find((item) => item.id === conversationId);
    const fallbackTitle = content.trim().slice(0, 40) || 'New Chat';
    const title =
      existing?.title === 'New Chat'
        ? fallbackTitle
        : existing?.title ?? fallbackTitle;
    const createdAt = existing?.createdAt ?? Date.now();

    const conversation: ConversationRecord = {
      id: conversationId,
      title,
      createdAt,
      updatedAt: Date.now(),
    };

    conversationsStore.upsert(conversation);
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    uiStore.clearError();

    let conversationId = $currentConversationIdStore;

    if (!conversationId) {
      const conversation = createConversation(trimmed);
      conversationId = conversation.id;
    } else {
      updateConversationTimestamp(conversationId, trimmed);
    }

    const outgoing: MessageRecord = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };

    await messagesStore.add(outgoing);
    message = '';

    const settings = get(settingsStore);
    const messages = get(messagesStore)[conversationId] ?? [];
    const systemInstructions = settings.customInstructions.trim();
    const payloadMessages = [
      ...(systemInstructions
        ? [
            {
              role: 'system' as const,
              content: systemInstructions,
            },
          ]
        : []),
      ...messages.map((item) => ({
        role: item.role as 'system' | 'user' | 'assistant',
        content: item.content,
      })),
    ];

    const assistantMessage: MessageRecord = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    await messagesStore.add(assistantMessage);

    const streamResponse = async () => {
      assistantMessage.content = '';
      await messagesStore.update({ ...assistantMessage });

      await streamChatCompletions({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        request: {
          model: settings.defaultModel,
          messages: payloadMessages,
          temperature: settings.temperature,
        },
        onDelta: async (content) => {
          assistantMessage.content += content;
          await messagesStore.update({ ...assistantMessage });
        },
      });
    };

    const handleStreamError = (error: unknown) => {
      console.error(error);
      const uiError = buildUiError(error, {
        conversationId,
        model: settings.defaultModel,
        mode: 'direct',
      });
      uiStore.setError({
        ...uiError,
        actionLabel: 'Retry request',
        retry: async () => {
          uiStore.clearError();
          try {
            await streamResponse();
          } catch (retryError) {
            handleStreamError(retryError);
          }
        },
      });
    };

    try {
      await streamResponse();
    } catch (error) {
      handleStreamError(error);
    }
  };
</script>

<section class="message-composer chatgpt-card">
  <div class="card-body d-grid gap-3">
    <label for="message-input" class="form-label visually-hidden">Message</label>
    <div class="composer">
      <textarea
        id="message-input"
        class="form-control form-control-lg border-0 bg-transparent"
        rows="3"
        placeholder="Message QuillChat..."
        bind:value={message}
      ></textarea>
      {#if message.trim()}
        <div class="markdown-preview">
          <p class="text-uppercase small text-muted mb-2">Preview</p>
          <div class="preview-content">{@html renderMarkdown(message)}</div>
        </div>
      {/if}
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">Shift + Enter for a new line · Markdown supported</small>
        <button
          type="button"
          class="btn btn-success rounded-pill px-4"
          on:click={sendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  .message-composer {
    border-radius: 20px;
  }

  .composer {
    border-radius: 18px;
    padding: 1rem 1.25rem;
    background: var(--composer-bg);
    border: 1px solid var(--composer-border);
  }

  textarea {
    resize: vertical;
  }

  textarea:focus {
    box-shadow: none;
  }

  .markdown-preview {
    border-radius: 14px;
    border: 1px dashed var(--preview-border);
    background: var(--preview-bg);
    padding: 0.75rem 1rem;
  }

  .preview-content {
    word-break: break-word;
  }

  .preview-content :global(p) {
    margin: 0;
  }

  .preview-content :global(p + p) {
    margin-top: 0.75rem;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin: 0.5rem 0 0.5rem 1.25rem;
  }

  .preview-content :global(pre) {
    margin: 0.75rem 0 0;
    padding: 0.75rem 1rem;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 12px;
    overflow-x: auto;
  }

  .preview-content :global(code) {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.9em;
  }

  .preview-content :global(pre code) {
    color: inherit;
  }
</style>
