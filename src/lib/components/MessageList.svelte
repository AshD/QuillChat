<script lang="ts">
  import type { MessageRecord } from '$lib/storage/db';
  import { currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { uiStore, type UiError } from '$lib/stores/ui';
  import { renderMarkdown } from '$lib/utils/markdown';

  let currentMessages: MessageRecord[] = [];
  let activeError: UiError | null = null;

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

</script>

<section class="message-list d-flex flex-column gap-3 flex-grow-1">
  <header class="d-flex justify-content-between align-items-end">
    <div>
      <h2 class="h6 text-uppercase text-muted mb-1">Messages</h2>
      <p class="text-muted small mb-0">Conversation history appears here.</p>
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
            <div class="meta d-flex justify-content-between small text-uppercase text-muted">
              <span class="role fw-semibold">{message.role}</span>
              <span>{formatTime(message.createdAt)}</span>
            </div>
            <div class="message-content mt-2">{@html renderMarkdown(message.content)}</div>
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
    max-width: min(720px, 100%);
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
