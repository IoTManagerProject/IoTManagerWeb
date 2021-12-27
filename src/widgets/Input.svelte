<script>
  export let widget;
  export let wsPushProp = (ws, topic, status) => {};
  export let value;
  value = value;
</script>

<div class="card-items-psn">
  <div class="widget-descr-width">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-style">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="widget-width">
    {#if widget.type == "number"}
      <input class={widget["send"] == true ? "widget-input border-red-500" : "widget-input focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPushProp(widget.ws, widget.topic, widget.status))} bind:value={widget.status} step="0.1" type="number" />
    {/if}
    {#if widget.type == "text"}
      <input class={widget["send"] == true ? "widget-input border-red-500" : "widget-input focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPushProp(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="text" />
    {/if}
    {#if widget.type == "date"}
      <input class={widget["send"] == true ? "widget-input border-red-500" : "widget-input focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPushProp(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="date" />
    {/if}
    {#if widget.type == "time"}
      <input class={widget["send"] == true ? "widget-input border-red-500" : "widget-input focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPushProp(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="time" />
    {/if}
  </div>
</div>
