<script>
  import { onMount } from "svelte";
  import Chart from "svelte-frappe-charts";

  onMount(async () => {
    console.log("[i]", "------------chart mounted--------------");
  });

  let chartRef;

  export let widget;

  let axisOptions = { xAxisMode: "tick", xIsSeries: true };
  let lineOptions;

  if (widget.pointRadius == "0") {
    lineOptions = { regionFill: 1, hideDots: 1, spline: 1 };
  } else {
    lineOptions = { regionFill: 1, dotSize: 3, spline: 1 };
  }

  let labels = ["", ""];
  let values = ["", ""];

  //let datachart = {
  //  labels: [],
  //  datasets: [],
  //};

  let datachart = {
    labels: labels,
    datasets: [
      {
        name: widget.descr,
        values: values,
      },
    ],
  };

  $: widget.status, calc();

  function calc() {
    if (widget.status) {
      let dataArr = widget.status;
      for (let i = 0; i < dataArr.length; i++) {
        chartRef.addDataPoint(getHHMM(dataArr[i].x), [dataArr[i].y1]);
      }
      console.log("-------------------------calc-------------------------");
    }
  }

  function getHHMM(timestamp) {
    var date = new Date(timestamp * 1000);
    return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  }
</script>

<!--<div class="text-center">-->
<!-- svelte-ignore a11y-label-has-associated-control -->
<!--<label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr} </label>-->
<!--</div>-->

<Chart data={datachart} type="line" lineOptions={lineOptions} axisOptions={axisOptions} bind:this={chartRef} />
