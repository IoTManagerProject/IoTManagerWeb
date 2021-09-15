<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let title;
  export let value;
</script>

<div class="container">
  <div class="card-items">
    <div class="md:w-1/3">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="descr-gray">{title}</label>
    </div>
    <div class="md:w-2/3">
      <input bind:value on:change={WSpush(value)} class="widget-input-indigo" type="text" />
    </div>
  </div>
</div>
