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
    margin: 0;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    color: #1f2a44;
    background:
      radial-gradient(circle at top, rgba(15, 23, 42, 0.04), transparent 45%),
      #f7f7f8;
  }

  :global(.chatgpt-card) {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }

  .app-header {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 10;
  }
</style>
