<script>
  /**
   * Select (dropdown). options = array of strings; status = selected index (number).
   * On change sends index via wsPush (WebSocket control).
   */
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  $: options = Array.isArray(widget.options) ? widget.options : [];
  $: idx = Number(widget.status);
  $: selectedIndex = Number.isNaN(idx) || idx < 0 || idx >= options.length ? 0 : idx;

  function onChange(ev) {
    const i = parseInt(ev.target.value, 10);
    widget.sent = true;
    widget.status = String(i);
    wsPush(widget.ws, widget.topic, String(i));
  }
</script>

<div class="crd-itm-psn h-auto mb-4">
  <div class="w-2/3">
    <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  </div>
  <div class="flex justify-end w-1/3">
    <select
      class="slct-lg {widget.sent ? 'border-red-500' : ''}"
      value={selectedIndex}
      on:change={onChange}
    >
      {#each options as opt, i}
        <option value={i}>{opt}</option>
      {/each}
    </select>
  </div>
</div>
