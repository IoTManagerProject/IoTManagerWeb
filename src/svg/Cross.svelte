<script>
  export let click = () => {};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<svg on:click={click()} class="h-6 w-6 text-red-400 cursor-pointer" viewBox="0 -2 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" /></svg>
