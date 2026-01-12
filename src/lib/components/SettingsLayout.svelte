<script lang="ts">
  import SettingsForm from '$lib/components/SettingsForm.svelte';
</script>

<section class="settings-layout d-grid gap-4">
  <header>
    <h1 class="h3 mb-1">Settings</h1>
    <p class="text-muted mb-0">Tune your workspace and model preferences.</p>
  </header>
  <SettingsForm />
</section>

<style>
  .settings-layout {
    max-width: 720px;
  }
</style>
