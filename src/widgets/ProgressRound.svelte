<script>
  /**
   * Circular progress (semicircle or full). Read-only.
   * Uses widget.status, widget.min, widget.max, widget.after; optional widget.semicircle.
   */
  export let widget;

  $: numStatus = Number(widget.status);
  $: numMin = Number(widget.min) ?? 0;
  $: numMax = Number(widget.max) ?? 100;
  $: safeMax = numMax <= numMin ? numMin + 1 : numMax;
  $: value = Math.max(0, Math.min(1, (numStatus - numMin) / (safeMax - numMin)));
  $: deg = widget.semicircle === "1" || widget.semicircle === true ? value * 180 : value * 360;
  $: stroke = widget.stroke ?? 10;
  $: r = 45;
  $: c = 2 * Math.PI * r;
  $: dash = (deg / 360) * c;
</script>

<div class="crd-itm-psn flex flex-col items-center h-auto mb-4">
  <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  <div class="relative inline-flex items-center justify-center" style="width: 100px; height: 60px;">
    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100" style="overflow: visible;">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#e5e7eb"
        stroke-width={stroke}
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={widget.color || "#6366f1"}
        stroke-width={stroke}
        stroke-dasharray={c}
        stroke-dashoffset={c - dash}
        stroke-linecap="round"
        style="transition: stroke-dashoffset 0.3s ease;"
      />
    </svg>
    <span class="absolute text-gray-600 font-bold text-sm">{widget.before || ""}{numStatus}{widget.after || ""}</span>
  </div>
</div>
