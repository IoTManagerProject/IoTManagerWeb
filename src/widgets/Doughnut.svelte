<script>
  /**
   * Doughnut chart: multiple sectors. status = number[], labels = string[].
   * Same as app: segmentPath for each sector, legend in center.
   */
  export let widget;

  const DEFAULT_COLORS = ['#3880ff', '#10dc60', '#ffce00', '#f04141', '#0cd1e8'];

  function toNum(v, def) {
    if (v === undefined || v === null) return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }

  function normalizeStatus(status) {
    if (Array.isArray(status)) return status.map((v) => toNum(v, 0));
    if (typeof status === 'number') return [status];
    if (typeof status === 'string') {
      const trimmed = status.trim();
      if (trimmed === '') return [];
      if (trimmed.startsWith('[')) {
        try {
          const arr = JSON.parse(trimmed);
          return Array.isArray(arr) ? arr.map((v) => toNum(v, 0)) : [toNum(status, 0)];
        } catch {
          return [toNum(status, 0)];
        }
      }
      return [toNum(status, 0)];
    }
    return [];
  }

  function segmentPath(cx, cy, startAngle, endAngle, outerR, innerR) {
    const toRad = (a) => (a * Math.PI) / 180;
    const x1 = cx + outerR * Math.cos(toRad(startAngle));
    const y1 = cy + outerR * Math.sin(toRad(startAngle));
    const x2 = cx + outerR * Math.cos(toRad(endAngle));
    const y2 = cy + outerR * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    if (innerR == null || innerR <= 0) {
      return `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} Z`;
    }
    const x3 = cx + innerR * Math.cos(toRad(endAngle));
    const y3 = cy + innerR * Math.sin(toRad(endAngle));
    const x4 = cx + innerR * Math.cos(toRad(startAngle));
    const y4 = cy + innerR * Math.sin(toRad(startAngle));
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  $: rawValues = normalizeStatus(widget.status);
  $: values = rawValues.length > 0 ? rawValues : [33, 33, 34];
  $: total = values.reduce((a, b) => a + b, 0) || 1;
  $: labels = Array.isArray(widget.labels) ? widget.labels : [];

  const SIZE = 200;
  const STROKE_PX = 28;
  const r = (SIZE - STROKE_PX) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const innerR = r - STROKE_PX;

  $: paths = (() => {
    let angle = -90;
    return values.map((v, i) => {
      const sweep = (v / total) * 360;
      const start = angle;
      angle += sweep;
      return {
        path: segmentPath(cx, cy, start, start + sweep, r, innerR),
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      };
    });
  })();
</script>

<div class="crd-itm-psn flex flex-col items-center h-auto mb-4">
  <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  <div class="relative" style="width: {SIZE}px; height: {SIZE}px;">
    <svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}" class="absolute inset-0">
      {#each paths as seg, i}
        <path d={seg.path} fill={seg.color} stroke="transparent" stroke-width="1" />
      {/each}
    </svg>
    {#if labels.length > 0}
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="flex flex-col items-center">
          {#each labels.slice(0, values.length) as label, i}
            <span class="text-xs font-bold" style="color: {paths[i]?.color ?? '#374151'}">{label}: {values[i]}</span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
