<svelte:head>
  <title>QuillChat</title>
</svelte:head>

<div class="app-shell">
  <header class="app-header">
    <div class="brand">
      <span class="brand-mark">✒️</span>
      <span>QuillChat</span>
    </div>
    <nav class="nav">
      <a href="/">Chat</a>
      <a href="/settings">Settings</a>
    </nav>
  </header>

  <main class="app-main">
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    background: #f6f7fb;
    color: #1f2a44;
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2.5rem;
    background: #ffffff;
    border-bottom: 1px solid #e4e7f0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
  }

  .brand-mark {
    font-size: 1.5rem;
  }

  .nav {
    display: flex;
    gap: 1.5rem;
  }

  .nav a {
    text-decoration: none;
    color: inherit;
    font-weight: 500;
  }

  .app-main {
    flex: 1;
    padding: 2.5rem;
  }
</style>
