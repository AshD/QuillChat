<script lang="ts">
  import type { MessageRecord } from '$lib/storage/db';
  import { currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';

  let currentMessages: MessageRecord[] = [];

  $: if ($currentConversationIdStore) {
    void messagesStore.load($currentConversationIdStore);
  }

  $: currentMessages = $currentConversationIdStore
    ? $messagesStore[$currentConversationIdStore] ?? []
    : [];

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
</script>

<section class="message-list">
  <header>
    <h2>Messages</h2>
    <p>Conversation history appears here.</p>
  </header>

  <div class="messages">
    {#if !$currentConversationIdStore}
      <div class="empty">Select or start a conversation to begin chatting.</div>
    {:else if currentMessages.length === 0}
      <div class="empty">No messages yet. Say hello!</div>
    {:else}
      {#each currentMessages as message (message.id)}
        <article class="message {message.role}">
          <div class="meta">
            <span class="role">{message.role}</span>
            <span>{formatTime(message.createdAt)}</span>
          </div>
          <p>{message.content}</p>
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .message-list {
    display: grid;
    gap: 1rem;
    flex: 1;
    min-height: 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  h2 {
    margin: 0;
  }

  p {
    margin: 0;
    color: #667085;
  }

  .messages {
    display: grid;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .message {
    padding: 1rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e5eaf3;
  }

  .message.user {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .message.assistant {
    background: #ecfdf3;
    border-color: #b7ebc6;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #667085;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .message p {
    margin: 0.5rem 0 0;
    white-space: pre-wrap;
  }

  .empty {
    padding: 2rem;
    border-radius: 12px;
    border: 1px dashed #c8d0e0;
    text-align: center;
    color: #667085;
  }
</style>
