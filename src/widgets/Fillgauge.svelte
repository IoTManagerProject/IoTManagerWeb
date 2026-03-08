<script>
  /**
   * Fill gauge (liquid/level style). Read-only. status within min..max.
   */
  export let widget;

  $: numStatus = Number(widget.status);
  $: numMin = Number(widget.min) ?? 0;
  $: numMax = Number(widget.max) ?? 100;
  $: safeMax = numMax <= numMin ? numMin + 1 : numMax;
  $: value = Math.max(0, Math.min(1, (numStatus - numMin) / (safeMax - numMin)));
  $: pct = Math.round(value * 100);
</script>

<div class="crd-itm-psn flex flex-col items-center h-auto mb-4">
  <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  <div class="w-full max-w-[120px] h-24 rounded-lg border-2 border-gray-200 overflow-hidden flex flex-col justify-end">
    <div
      class="w-full transition-all duration-300 rounded-t"
      style="height: {pct}%; background: {widget.color || '#6366f1'};"
    ></div>
  </div>
  <p class="text-sm text-gray-500 mt-1">{widget.before || ""}{numStatus}{widget.after || ""}</p>
</div>
