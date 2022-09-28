<script>
  import Chart from "svelte-frappe-charts";
  import { onMount } from "svelte";

  onMount(async () => {
    console.log("[i]", "chart component mounted");
  });

  export let widget;

  let datachart = {
    labels: [0, 0],
    datasets: [
      {
        name: widget.descr,
        values: [0, 0],
      },
    ],
  };

  let prevStatus = {};

  let firstTime = true;

  let labels = [];
  let values = [];

  let axisOptions = { xAxisMode: "tick", xIsSeries: true };
  let lineOptions;
  if (widget.pointRadius == "0") {
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
      if (Array.isArray(widget.status)) {
        //console.log("[i]", "=======================================================");
        prevStatus = widget.status;

        if (widget.maxCount === 0) {
          clearCart();
          widget.status = [];
          console.log("[i]", "clear cart data");
          return;
        }

        for (let i = 0; i < widget.status.length; i++) {
          if (type === "bar") {
            labels[i] = getDDMM(widget.status[i].x);
          } else if (i === 0) {
            labels[i] = getDDMM(widget.status[i].x);
          } else {
            labels[i] = getHHMM(widget.status[i].x);
          }
          values[i] = [widget.status[i].y1];
        }

        datachart = {
          labels: labels,
          datasets: [
            {
              name: widget.descr,
              values: values,
            },
          ],
        };
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
    widget.status = [];

    labels = [];
    values = [];

    datachart = {
      labels: [0, 0],
      datasets: [
        {
          name: widget.descr,
          values: [0, 0],
        },
      ],
    };
  }
</script>

<div class="text-center">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="inline-block italic align-top text-center text-gray-500 txt-sz">{!widget.descr ? "" : widget.descr}</label>
</div>

<Chart data={datachart} type={type} lineOptions={lineOptions} axisOptions={axisOptions} height="200" padding="0px" />
