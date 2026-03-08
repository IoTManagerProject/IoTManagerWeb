<script>
  /**
   * Button widget. On click sends "1" via wsPush (WebSocket control).
   */
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  function onClick() {
    widget.sent = true;
    widget.status = "1";
    wsPush(widget.ws, widget.topic, "1");
  }
</script>

<div class="crd-itm-psn h-auto mb-4">
  <div class="w-2/3">
    <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  </div>
  <div class="flex justify-end w-1/3">
    <button
      type="button"
      on:click={onClick}
      class="btn-i h-7 min-h-7 flex items-center {widget.sent ? 'ring-2 ring-red-400' : ''}"
    >
      {widget.status !== undefined && widget.status !== null && widget.status !== "" ? widget.status : "OK"}
    </button>
  </div>
</div>
