<script lang="ts">
  import type { MessageRecord } from '$lib/storage/db';
  import { currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { settingsStore } from '$lib/stores/settings';
  import { uiStore, type UiError } from '$lib/stores/ui';
  import { renderMarkdown } from '$lib/utils/markdown';
  import { ChatCompletionError, streamChatCompletions } from '$lib/api/chat';

  let currentMessages: MessageRecord[] = [];
  let activeError: UiError | null = null;
  let editingMessageId: string | null = null;
  let editingDraft = '';
  let refreshingMessageId: string | null = null;

  $: if ($currentConversationIdStore) {
    void messagesStore.load($currentConversationIdStore);
  }

  $: currentMessages = $currentConversationIdStore
    ? $messagesStore[$currentConversationIdStore] ?? []
    : [];

  $: activeError =
    $uiStore.error &&
    ($uiStore.error.conversationId ?? null) === $currentConversationIdStore
      ? $uiStore.error
      : null;

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const startEditing = (message: MessageRecord) => {
    editingMessageId = message.id;
    editingDraft = message.content;
  };

  const cancelEditing = () => {
    editingMessageId = null;
    editingDraft = '';
  };

  const saveEditing = async (message: MessageRecord) => {
    const updated = { ...message, content: editingDraft };
    await messagesStore.update(updated);
    cancelEditing();
  };

  const handleEditClick = async (message: MessageRecord) => {
    if (editingMessageId === message.id) {
      await saveEditing(message);
      return;
    }

    startEditing(message);
  };

  const handleEditKeydown = async (event: KeyboardEvent, message: MessageRecord) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
      return;
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      await saveEditing(message);
    }
  };

  const copyMessage = async (message: MessageRecord) => {
    if (!navigator?.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(message.content);
  };

  const reportRefreshError = (error: unknown, conversationId: string) => {
    const base: UiError = {
      id: crypto.randomUUID(),
      title: 'Unable to refresh response',
      message: 'The chat service did not respond. Please try again.',
      conversationId,
      mode: 'direct',
    };

    if (error instanceof ChatCompletionError) {
      uiStore.setError({
        ...base,
        title: 'Refresh failed',
        message: error.message || base.message,
        detail: error.detail,
        status: error.status,
      });
      return;
    }

    if (error instanceof Error) {
      uiStore.setError({
        ...base,
        title: 'Refresh failed',
        message: error.message || base.message,
        detail: error.message,
      });
      return;
    }

    uiStore.setError(base);
  };

  const refreshMessage = async (message: MessageRecord) => {
    if (refreshingMessageId) {
      return;
    }

    const settings = $settingsStore;
    if (!settings.baseUrl || !settings.defaultModel) {
      uiStore.setError({
        id: crypto.randomUUID(),
        title: 'Missing settings',
        message: 'Add your API base URL and default model before refreshing responses.',
        conversationId: message.conversationId,
        mode: 'direct',
      });
      return;
    }

    const index = currentMessages.findIndex((item) => item.id === message.id);
    if (index === -1) {
      return;
    }

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
      ...currentMessages.slice(0, index).map((item) => ({
        role: item.role as 'system' | 'user' | 'assistant',
        content: item.content,
      })),
    ];

    refreshingMessageId = message.id;
    const updatedMessage = { ...message, content: '' };
    await messagesStore.update(updatedMessage);

    try {
      await streamChatCompletions({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        request: {
          model: settings.defaultModel,
          messages: payloadMessages,
          temperature: settings.temperature,
        },
        onDelta: async (content) => {
          updatedMessage.content += content;
          await messagesStore.update({ ...updatedMessage });
        },
      });
    } catch (error) {
      reportRefreshError(error, message.conversationId);
    } finally {
      refreshingMessageId = null;
    }
  };

</script>

<section class="message-list d-flex flex-column gap-3 flex-grow-1">
  <header class="d-flex justify-content-between align-items-end">
    <div>
      <h2 class="h6 text-uppercase text-muted mb-1">Messages</h2>
    </div>
  </header>

  {#if activeError}
    <div class="alert alert-warning d-flex justify-content-between align-items-start gap-3 mb-0">
      <div>
        <strong class="d-block">{activeError.title}</strong>
        <p class="mb-1">{activeError.message}</p>
        {#if activeError.mode || activeError.status}
          <p class="context mb-1 text-uppercase small">
            {#if activeError.mode}
              {activeError.mode === 'proxy' ? 'Proxy mode' : 'Direct mode'}
            {/if}
            {#if activeError.status}
              {activeError.mode ? ' · ' : ''}Status {activeError.status}
            {/if}
          </p>
        {/if}
        {#if activeError.detail}
          <p class="detail small mb-0">{activeError.detail}</p>
        {/if}
      </div>
      <div class="actions d-flex gap-2 flex-wrap">
        {#if activeError.retry}
          <button type="button" class="btn btn-warning btn-sm" on:click={() => void activeError.retry?.()}>
            {activeError.actionLabel ?? 'Retry'}
          </button>
        {/if}
        <button type="button" class="btn btn-outline-warning btn-sm" on:click={() => uiStore.clearError()}>
          Dismiss
        </button>
      </div>
    </div>
  {/if}

    <div class="messages d-flex flex-column gap-3 flex-grow-1">
      {#if !$currentConversationIdStore}
      <div class="empty border border-dashed rounded-4 text-center text-muted p-4 bg-light">
        Select or start a conversation to begin chatting.
      </div>
    {:else if currentMessages.length === 0}
      <div class="empty border border-dashed rounded-4 text-center text-muted p-4 bg-light">
        No messages yet. Say hello!
      </div>
    {:else}
      {#each currentMessages as message (message.id)}
        <div class="message-row d-flex {message.role}">
          <article class="message-bubble {message.role}">
            <div class="meta d-flex justify-content-between align-items-start small text-uppercase text-muted">
              <div class="meta-details d-flex align-items-center gap-2">
                <span>{formatTime(message.createdAt)}</span>
                {#if message.role === 'assistant'}
                  <div class="assistant-actions d-flex align-items-center gap-1">
                    <button
                      type="button"
                      class="assistant-action btn btn-light btn-sm icon-button"
                      on:click={() => void copyMessage(message)}
                      aria-label="Copy response"
                      title="Copy response"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path
                          d="M8.25 7.5V6a2.25 2.25 0 0 1 2.25-2.25h6A2.25 2.25 0 0 1 18.75 6v6A2.25 2.25 0 0 1 16.5 14.25H15"
                        />
                        <path
                          d="M3.75 9.75A2.25 2.25 0 0 1 6 7.5h6A2.25 2.25 0 0 1 14.25 9.75v6A2.25 2.25 0 0 1 12 18H6a2.25 2.25 0 0 1-2.25-2.25v-6Z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="assistant-action btn btn-light btn-sm icon-button"
                      on:click={() => void handleEditClick(message)}
                      aria-label="Edit response"
                      title={editingMessageId === message.id ? 'Save edits' : 'Edit response'}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path d="M16.862 4.487a2.25 2.25 0 0 1 3.182 3.182L7.5 20.213 3 21l.787-4.5L16.862 4.487Z" />
                        <path d="m19.5 7.125-2.625-2.625" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="assistant-action btn btn-light btn-sm icon-button"
                      on:click={() => void refreshMessage(message)}
                      aria-label="Refresh response"
                      title="Refresh response"
                      disabled={refreshingMessageId === message.id}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.303" />
                        <path d="M19.5 4.5v4.5h-4.5" />
                        <path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.303" />
                        <path d="M4.5 19.5V15h4.5" />
                      </svg>
                    </button>
                  </div>
                {/if}
              </div>
            </div>
            {#if editingMessageId === message.id}
              <div class="message-content mt-2">
                <textarea
                  class="form-control form-control-sm edit-message"
                  rows="4"
                  bind:value={editingDraft}
                  on:keydown={(event) => void handleEditKeydown(event, message)}
                ></textarea>
                <p class="edit-hint small text-muted mt-2 mb-0">
                  Press Ctrl/Cmd + Enter to save, Esc to cancel.
                </p>
              </div>
            {:else}
              <div class="message-content mt-2">{@html renderMarkdown(message.content)}</div>
            {/if}
          </article>
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .messages {
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .message-row.user {
    justify-content: flex-end;
  }

  .message-row.assistant {
    justify-content: flex-start;
  }

  .message-bubble {
    width: 80%;
    max-width: 80%;
    padding: 1rem 1.25rem;
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }

  .message-bubble.user {
    background: #eefbf5;
    border-color: #bbf7d0;
  }

  .message-bubble.assistant {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .message-content {
    word-break: break-word;
  }

  .assistant-actions {
    margin-left: 0.25rem;
  }

  .assistant-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
  }

  .assistant-action svg {
    display: block;
  }

  .icon-button {
    border: none;
  }

  .icon-button:focus {
    box-shadow: none;
  }

  .assistant-action:disabled {
    opacity: 0.6;
  }

  .edit-message {
    font-size: 0.95rem;
  }

  .edit-hint {
    letter-spacing: 0.02em;
  }

  .message-content :global(p) {
    margin: 0;
  }

  .message-content :global(p + p) {
    margin-top: 0.75rem;
  }

  .message-content :global(ul),
  .message-content :global(ol) {
    margin: 0.5rem 0 0.5rem 1.25rem;
  }

  .message-content :global(pre) {
    margin: 0.75rem 0 0;
    padding: 0.75rem 1rem;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 12px;
    overflow-x: auto;
  }

  .message-content :global(code) {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.9em;
  }

  .message-content :global(pre code) {
    color: inherit;
  }

  .border-dashed {
    border-style: dashed;
  }
</style>
