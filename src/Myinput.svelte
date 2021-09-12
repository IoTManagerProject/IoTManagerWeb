<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let title;
  export let value;
</script>

<div class="container">
  <div class="block-psn-center-when-md">
    <div class="md:w-1/3">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="descr-gray-left">{title}</label>
    </div>
    <div class="md:w-1/3">
      <input bind:value on:change={WSpush(value)} class="input-indigo" type="text" />
    </div>
    <div class="md:w-1/3">
      <button on:click={WSpush(value)} class="btn-indigo" type="button">Set</button>
    </div>
  </div>
</div>
