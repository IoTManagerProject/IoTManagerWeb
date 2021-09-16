<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let value;
  export let descr;
  export let topic;
  export let ws;
  export let type;
  //style="min-width:50%; max-width:100%; width:{value.length * 10}px" on:change={(WSpush(ws, topic, value), console.log(value.length))}
</script>

<div class="container">
  <div class="card-items">
    <div class="w-full md:w-2/3 lg:w-2/3 2xl:w-2/3">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="widget-descr-gray-left">{!descr ? "" : descr}</label>
    </div>
    <div class="w-full md:w-1/3 lg:w-1/3 2xl:w-1/3">
      <!-- on:change={WSpush(ws, topic, value)} -->
      {#if type == "number"}
        <input class="widget-input-indigo text-right md:w-24 lg:w-24 2xl:w-24" step="0.1" on:change={WSpush(ws, topic, value)} bind:value type="number" />
      {/if}
      {#if type == "text"}
        <input class="widget-input-indigo text-right" on:change={WSpush(ws, topic, value)} bind:value type="text" />
      {/if}
      {#if type == "date"}
        <input class="widget-input-indigo text-right" on:change={WSpush(ws, topic, value)} bind:value type="date" />
      {/if}
      {#if type == "time"}
        <input class="widget-input-indigo text-right md:w-24 lg:w-24 2xl:w-24" on:change={WSpush(ws, topic, value)} bind:value type="time" />
      {/if}
    </div>
  </div>
</div>
