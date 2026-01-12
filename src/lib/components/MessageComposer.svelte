<script lang="ts">
  import { get } from 'svelte/store';

  import { ChatCompletionError, streamChatCompletions } from '$lib/api/chat';
  import type { ConversationRecord, MessageRecord } from '$lib/storage/db';
  import { conversationsStore, currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { settingsStore } from '$lib/stores/settings';
  import { uiStore, type UiError } from '$lib/stores/ui';

  let message = '';

  const buildUiError = (
    error: unknown,
    context: { conversationId: string; model: string; mode: 'direct' | 'proxy' },
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
          message:
            context.mode === 'proxy'
              ? 'The proxy could not reach the chat service. Try again shortly.'
              : 'The chat service is temporarily unavailable. Try again shortly.',
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
    const title = initialMessage.trim().slice(0, 40) || 'New conversation';
    const conversation: ConversationRecord = {
      id,
      title,
      updatedAt: now,
    };

    conversationsStore.upsert(conversation);
    currentConversationIdStore.set(id);

    return conversation;
  };

  const updateConversationTimestamp = (conversationId: string, content: string) => {
    const existing = $conversationsStore.find((item) => item.id === conversationId);
    const fallbackTitle = content.trim().slice(0, 40) || 'New conversation';
    const title =
      existing?.title === 'New conversation'
        ? fallbackTitle
        : existing?.title ?? fallbackTitle;

    const conversation: ConversationRecord = {
      id: conversationId,
      title,
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
    const payloadMessages = messages.map((item) => ({
      role: item.role as 'system' | 'user' | 'assistant',
      content: item.content,
    }));

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
        useProxy: settings.useProxy,
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
        mode: settings.useProxy ? 'proxy' : 'direct',
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

<section class="message-composer">
  <label for="message-input">Message</label>
  <div class="composer">
    <textarea
      id="message-input"
      rows="3"
      placeholder="Send a message..."
      bind:value={message}
    ></textarea>
    <button type="button" on:click={sendMessage} disabled={!message.trim()}>
      Send
    </button>
  </div>
</section>

<style>
  .message-composer {
    display: grid;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px solid #e5eaf3;
    background: #fff;
  }

  label {
    font-weight: 600;
    color: #1f2a44;
  }

  .composer {
    display: grid;
    gap: 0.75rem;
  }

  textarea {
    width: 100%;
    resize: vertical;
    border-radius: 12px;
    border: 1px solid #c8d0e0;
    padding: 0.75rem 1rem;
    font-family: inherit;
    font-size: 0.95rem;
  }

  textarea:focus {
    outline: none;
    border-color: #4c6fff;
    box-shadow: 0 0 0 3px rgba(76, 111, 255, 0.15);
  }

  button {
    justify-self: end;
    border: none;
    background: #4c6fff;
    color: #fff;
    font-weight: 600;
    padding: 0.6rem 1.5rem;
    border-radius: 999px;
  }

  button:disabled {
    background: #cbd5f5;
    cursor: not-allowed;
  }
</style>
