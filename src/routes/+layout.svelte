<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { settingsStore } from '$lib/stores/settings';

  let prefersDarkQuery: MediaQueryList | null = null;

  const resolveTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      const prefersDark =
        prefersDarkQuery?.matches ??
        (browser && window.matchMedia('(prefers-color-scheme: dark)').matches);
      return prefersDark ? 'dark' : 'light';
    }

    return theme;
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (!browser) {
      return;
    }

    document.body.dataset.theme = resolveTheme(theme);
  };

  onMount(() => {
    if (!browser) {
      return;
    }

    prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme($settingsStore.theme);
    prefersDarkQuery.addEventListener('change', handler);
    applyTheme($settingsStore.theme);

    return () => {
      prefersDarkQuery?.removeEventListener('change', handler);
    };
  });

  $: if (browser) {
    applyTheme($settingsStore.theme);
  }
</script>

<svelte:head>
  <title>QuillChat</title>
</svelte:head>

<div class="app-shell d-flex flex-column min-vh-100">
  <header class="app-header border-bottom">
    <div class="container-fluid px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
      <a class="navbar-brand d-flex align-items-center gap-2 fw-semibold mb-0" href="/">
        <span class="fs-4">✒️</span>
        <span>QuillChat</span>
        <span class="badge rounded-pill text-bg-dark ms-2">GPT-5</span>
      </a>
      <nav class="d-flex align-items-center gap-2">
        <a class="btn btn-sm btn-light border-0 text-secondary" href="/">Chat</a>
        <a class="btn btn-sm btn-outline-secondary" href="/settings">Settings</a>
      </nav>
    </div>
  </header>

  <main class="flex-grow-1 py-4">
    <div class="container-fluid px-4">
      <slot />
    </div>
  </main>
</div>

<style>
  :global(body) {
    --app-bg:
      radial-gradient(circle at top, rgba(15, 23, 42, 0.04), transparent 45%),
      #f7f7f8;
    --app-text: #1f2a44;
    --card-bg: #ffffff;
    --card-border: #e5e7eb;
    --header-bg: rgba(255, 255, 255, 0.9);
    --composer-bg: #f9fafb;
    --composer-border: #e5e7eb;
    --preview-bg: #ffffff;
    --preview-border: #e2e8f0;
    --muted-text: #6b7280;
    --input-bg: #ffffff;
    --input-border: #d1d5db;
    margin: 0;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    color: var(--app-text);
    background: var(--app-bg);
  }

  :global(.chatgpt-card) {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }

  .app-header {
    background: var(--header-bg);
    backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  :global(body[data-theme='dark']) {
    --app-bg:
      radial-gradient(circle at top, rgba(148, 163, 184, 0.14), transparent 45%),
      #0f172a;
    --app-text: #e2e8f0;
    --card-bg: #111827;
    --card-border: #1f2937;
    --header-bg: rgba(15, 23, 42, 0.92);
    --composer-bg: #0b1120;
    --composer-border: #1f2937;
    --preview-bg: #0f172a;
    --preview-border: #1f2937;
    --muted-text: #94a3b8;
    --input-bg: #0b1120;
    --input-border: #1f2937;
  }

  :global(body[data-theme='dark'] .text-muted) {
    color: var(--muted-text) !important;
  }

  :global(body[data-theme='dark'] .form-control),
  :global(body[data-theme='dark'] .form-select) {
    background-color: var(--input-bg);
    color: var(--app-text);
    border-color: var(--input-border);
  }

  :global(body[data-theme='dark'] .form-control::placeholder) {
    color: rgba(226, 232, 240, 0.6);
  }

  :global(body[data-theme='dark'] .btn-light) {
    background-color: #1f2937;
    color: var(--app-text);
    border-color: #374151;
  }

  :global(body[data-theme='dark'] .bg-light) {
    background-color: #111827 !important;
    color: var(--app-text);
  }
</style>
