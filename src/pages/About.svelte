<script>
  import Card from "../components/Card.svelte";

  export let wigetsUpdate;
  export let layoutJson;

  export let showModal = () => {};
  export let syntaxHighlight = (json) => {};
</script>

<button on:click={() => showModal()} type="button"> Toggle modal </button>
<Card title="Редактор JSON">
  <textarea on:input={wigetsUpdate} rows="10" class="jsn-ipt w-full" id="text1">{syntaxHighlight(JSON.stringify(layoutJson))}</textarea>
</Card>
