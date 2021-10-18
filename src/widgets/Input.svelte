<script context="module">
  import { WSpush } from "../App.svelte";
</script>

<script>
  export let widget;
</script>

<div class="card-items">
  <div class="md:w-2/3 lg:w-2/3 2xl:w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-gray-left"
      >{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="md:w-1/3 lg:w-1/3 2xl:w-1/3">
    {#if widget.type == "number"}
      <input
        class={widget["send"] == true
          ? "widget-input border-red-500"
          : "widget-input focus:border-indigo-500"}
        on:change={() => (
          (widget["send"] = true),
          WSpush(widget.ws, widget.topic, widget.status)
        )}
        bind:value={widget.status}
        step="0.1"
        type="number" />
    {/if}
    {#if widget.type == "text"}
      <input
        class={widget["send"] == true
          ? "widget-input border-red-500"
          : "widget-input focus:border-indigo-500"}
        on:change={() => (
          (widget["send"] = true),
          WSpush(widget.ws, widget.topic, widget.status)
        )}
        bind:value={widget.status}
        type="text" />
    {/if}
    {#if widget.type == "date"}
      <input
        class={widget["send"] == true
          ? "widget-input border-red-500"
          : "widget-input focus:border-indigo-500"}
        on:change={() => (
          (widget["send"] = true),
          WSpush(widget.ws, widget.topic, widget.status)
        )}
        bind:value={widget.status}
        type="date" />
    {/if}
    {#if widget.type == "time"}
      <input
        class={widget["send"] == true
          ? "widget-input border-red-500"
          : "widget-input focus:border-indigo-500"}
        on:change={() => (
          (widget["send"] = true),
          WSpush(widget.ws, widget.topic, widget.status)
        )}
        bind:value={widget.status}
        type="time" />
    {/if}
  </div>
</div>
