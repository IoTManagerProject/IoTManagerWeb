<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let title;
  export let value;
  export let topic;
  export let ws;
</script>

<div class="container">
  <div class="block-psn-center-when-md">
    <div class="md:w-2/3">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="descr-gray-left">{title}</label>
    </div>
    <div class="md:w-3/3">
      <!-- on:change={WSpush(ws, topic, value)} -->
      <input bind:value class="input-indigo" type="text" />
    </div>
    <div class="md:w-3/3">
      <button on:click={WSpush(ws, topic, value)} class="btn-indigo" type="button">Set</button>
    </div>
  </div>
</div>
