<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let title;
  export let value;
  export let topic;
  export let ws;
  export let type;
</script>

<div class="container">
  <div class="block-psn-center-when-md">
    <div class="md:w-1/2">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="descr-gray-left">{title}</label>
    </div>
    <div class="md:w-1/2">
      <!-- on:change={WSpush(ws, topic, value)} -->
      {#if type == "number"}
        <input on:change={WSpush(ws, topic, value)} bind:value class="input-indigo" type="number" />
      {/if}
      {#if type == "text"}
        <input on:change={WSpush(ws, topic, value)} bind:value class="input-indigo" type="text" />
      {/if}
      {#if type == "date"}
        <input on:change={WSpush(ws, topic, value)} bind:value class="input-indigo" type="date" />
      {/if}
      {#if type == "time"}
        <input on:change={WSpush(ws, topic, value)} bind:value class="input-indigo" type="time" />
      {/if}
    </div>
    <!-- <div class="md:w-3/3"> -->
    <!--  <button on:click={WSpush(ws, topic, value)} class="btn-indigo" type="button">Set</button> -->
    <!-- </div> -->
  </div>
</div>
