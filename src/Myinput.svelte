<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let value;
  export let descr;
  export let topic;
  export let ws;
  export let type;
  export let after;
</script>

<div class="container">
  <div class="card-items">
    <div class="md:w-6/12">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="widget-descr-gray-left">{!descr ? "" : descr}</label>
    </div>
    <div class="md:w-5/12">
      <!-- on:change={WSpush(ws, topic, value)} -->
      {#if type == "number"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="number" />
      {/if}
      {#if type == "text"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="text" />
      {/if}
      {#if type == "date"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="date" />
      {/if}
      {#if type == "time"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="time" />
      {/if}
    </div>
    {#if after}
      <div class="md:1/12">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="widget-after">{!after ? "" : after}</label>
      </div>
    {/if}
  </div>
</div>
