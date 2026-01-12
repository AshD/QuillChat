<script lang="ts">
  import { get } from 'svelte/store';

  import { streamChatCompletions } from '$lib/api/chat';
  import type { ConversationRecord, MessageRecord } from '$lib/storage/db';
  import { conversationsStore, currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { settingsStore } from '$lib/stores/settings';

  let message = '';

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

    try {
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
    } catch (error) {
      console.error(error);
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
