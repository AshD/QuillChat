<script lang="ts">
  import SettingsForm from '$lib/components/SettingsForm.svelte';
</script>

<section class="settings-layout">
  <header>
    <h1>Settings</h1>
    <p>Configure account preferences and integrations.</p>
  </header>
  <SettingsForm />
</section>

<style>
  .settings-layout {
    display: grid;
    gap: 1.5rem;
  }
</style>
