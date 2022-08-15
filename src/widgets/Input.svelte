<script>
  export let widget;
  export let wsPush = (ws, topic, status) => {};
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="flex justify-end w-1/3">
    {#if widget.type == "number"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} step="0.01" type="number" />
    {/if}
    {#if widget.type == "text"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="text" />
    {/if}
    {#if widget.type == "date"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="date" />
    {/if}
    {#if widget.type == "time"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="time" />
    {/if}
  </div>
</div>
