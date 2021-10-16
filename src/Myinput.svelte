<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let value;
  export let widget;
  //style="min-width:50%; max-width:100%; width:{value.length * 10}px" on:change={(WSpush(ws, topic, value), console.log(value.length))}
</script>

<div class="card-items">
  <div class="md:w-2/3 lg:w-2/3 2xl:w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-gray-left">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="md:w-1/3 lg:w-1/3 2xl:w-1/3">
    <!-- on:change={WSpush(ws, topic, value)} -->
    {#if widget.type == "number"}
      <input class="widget-input-indigo text-right" step="0.1" on:change={WSpush(widget.ws, widget.topic, widget.value)} bind:value type="number" />
    {/if}
    {#if widget.type == "text"}
      <input class="widget-input-indigo text-right" on:change={WSpush(widget.ws, widget.topic, widget.value)} bind:value type="text" />
    {/if}
    {#if widget.type == "date"}
      <input class="widget-input-indigo text-right" on:change={WSpush(widget.ws, widget.topic, widget.value)} bind:value type="date" />
    {/if}
    {#if widget.type == "time"}
      <input class="widget-input-indigo text-right" on:change={WSpush(widget.ws, widget.topic, widget.value)} bind:value type="time" />
    {/if}
  </div>
</div>
