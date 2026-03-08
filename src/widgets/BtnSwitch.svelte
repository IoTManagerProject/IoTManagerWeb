<script>
  /**
   * btn-switch widget: same protocol and feedback as Toggle (topic/control "0"|"1", widget.sent).
   * mode "toggle": each click flips 1<->0 and sends. mode "momentary": press sends 1, release sends 0.
   * Web: no icons, use colors (blue = 1, gray = 0) like Toggle track.
   */
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  $: mode = (widget.mode || "toggle").toString().toLowerCase();
  $: isOn = widget.status === "1" || widget.status === true;

  function sendVal(val) {
    widget.sent = true;
    widget.status = val;
    wsPush(widget.ws, widget.topic, val);
  }

  function onToggleClick() {
    const next = isOn ? "0" : "1";
    sendVal(next);
  }

  function onMomentaryDown() {
    sendVal("1");
  }

  function onMomentaryUp() {
    sendVal("0");
  }
</script>

<div class="crd-itm-psn h-auto mb-4">
  <div class="w-2/3">
    <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  </div>
  <div class="flex justify-end w-1/3">
    {#if mode === "momentary"}
      <button
        type="button"
        class="shrink-0 h-7 min-h-7 min-w-[4rem] w-[4rem] flex items-center justify-center rounded-lg border-0 outline-none cursor-pointer {isOn ? 'bg-blue-600' : 'bg-gray-100'}"
        on:mousedown={onMomentaryDown}
        on:mouseup={onMomentaryUp}
        on:mouseleave={onMomentaryUp}
      >
      </button>
    {:else}
      <button
        type="button"
        class="shrink-0 h-7 min-h-7 min-w-[4rem] w-[4rem] flex items-center justify-center rounded-lg border-0 outline-none cursor-pointer {isOn ? 'bg-blue-600' : 'bg-gray-100'}"
        on:click={onToggleClick}
      >
      </button>
    {/if}
  </div>
</div>
