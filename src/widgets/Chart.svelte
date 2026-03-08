<script>
  import Chart from "svelte-frappe-charts";
  export let widget;

  function safeDatachart(labels, values, descr) {
    const lab = Array.isArray(labels) && labels.length > 0 ? labels : ["0", "0"];
    let vals = Array.isArray(values) && values.length > 0 ? values : [[0], [0]];
    // Ensure all numbers are finite (frappe-charts throws on NaN)
    vals = vals.map((row) => (Array.isArray(row) ? row : [row]).map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0)));
    if (vals.length === 0) vals = [[0], [0]];
    return {
      labels: lab,
      datasets: [{ name: descr || "Chart", values: vals }],
    };
  }
  let datachart = safeDatachart([], [], widget && widget.descr);

  let prevStatus = {};

  let firstTime = true;

  let labels = [];
  let values = [];

  let axisOptions = { xAxisMode: "tick", xIsSeries: true, xIsSeries: true };
  let lineOptions;
  if (widget && widget.pointRadius == "0") {
    lineOptions = { regionFill: 1, hideDots: 1, spline: 1 };
  } else {
    lineOptions = { regionFill: 1, dotSize: 3, spline: 1 };
  }

  let type = "line";
  if (widget.type == "bar") {
    type = widget.type;
  }

  $: widget, collectDataToArr();

  function collectDataToArr() {
    if (prevStatus !== widget.status && !firstTime) {
      if (Array.isArray(widget.status) && widget.status.length > 0) {
        prevStatus = widget.status;

        if (widget.maxCount === 0) {
          clearCart();
          widget.status = [];
          return;
        }

        const safeLabels = [];
        const safeValues = [];
        for (let i = 0; i < widget.status.length; i++) {
          const pt = widget.status[i];
          const x = Number(pt?.x);
          const y1 = Number(pt?.y1);
          if (Number.isNaN(x) || Number.isNaN(y1)) continue;
          if (type === "bar") {
            safeLabels.push(getDDMM(x));
          } else if (i === 0) {
            safeLabels.push(getDDMM(x));
          } else {
            safeLabels.push(getHHMM(x));
          }
          safeValues.push([y1]);
        }
        if (safeLabels.length === 0 || safeValues.length === 0) return;

        labels = safeLabels;
        values = safeValues;
        datachart = safeDatachart(labels, values, widget.descr);
      }
    }
    firstTime = false;
  }

  function getHHMM(timestamp) {
    var date = new Date(timestamp * 1000);
    return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  }

  function getDDMM(timestamp) {
    var date = new Date(timestamp * 1000);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return day + "." + month + "." + year;
  }

  function clearCart() {
    if (widget) widget.status = [];
    labels = [];
    values = [];
    datachart = safeDatachart([], [], widget && widget.descr);
  }
</script>

<div class="text-center">
  <p class="inline-block italic truncate align-top text-center text-{widget.descrColor ? widget.descrColor : 'gray'}-500 txt-sz">{!widget.descr ? "" : widget.descr}</p>
</div>

{#if widget && datachart && datachart.datasets && datachart.datasets[0] && Array.isArray(datachart.datasets[0].values) && datachart.datasets[0].values.length > 0}
  <Chart id={widget.topic || "chart"} data={datachart} type={type} title={""} lineOptions={lineOptions} axisOptions={axisOptions} height={150} />
{/if}
