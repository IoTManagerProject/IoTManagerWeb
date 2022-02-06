<script>
  export let widget;
  export let wsPush = (ws, topic, status) => {};
  export let value;
  value = value;
</script>

<div class="crd-itm-psn">
  <div class="wgt-dscr-w">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="wgt-w">
    {#if widget.type == "number"}
      <input class={widget["send"] == true ? "wgt-ipt text-right border-red-500" : "wgt-ipt text-right focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} step="0.1" type="number" />
    {/if}
    {#if widget.type == "text"}
      <input class={widget["send"] == true ? "wgt-ipt text-right border-red-500" : "wgt-ipt text-right focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="text" />
    {/if}
    {#if widget.type == "date"}
      <input class={widget["send"] == true ? "wgt-ipt text-right border-red-500" : "wgt-ipt text-right focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="date" />
    {/if}
    {#if widget.type == "time"}
      <input class={widget["send"] == true ? "wgt-ipt text-right border-red-500" : "wgt-ipt text-right focus:border-indigo-500"} on:change={() => ((widget["send"] = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="time" />
    {/if}
  </div>
</div>
