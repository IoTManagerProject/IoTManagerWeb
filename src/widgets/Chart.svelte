<script>
  import Chart from "svelte-frappe-charts";
  import { onMount } from "svelte";

  onMount(async () => {
    console.log("[i]", "chart component mounted");
  });

  export let widget;

  //необходимые по умолчанию значения из за тупости библиотеки
  let labels = [0, 0];
  let values = [0, 0];

  let datachart = {
    labels: labels,
    datasets: [
      {
        name: widget.descr,
        values: values,
      },
    ],
  };

  let axisOptions = { xAxisMode: "tick", xIsSeries: true };
  let lineOptions;

  let collectingDataArray = [];
  let prevSatus = [];

  if (widget.pointRadius == "0") {
    lineOptions = { regionFill: 1, hideDots: 1, spline: 1 };
  } else {
    lineOptions = { regionFill: 1, dotSize: 3, spline: 1 };
  }

  $: widget.status, collectDataToArr();

  function collectDataToArr() {
    if (widget.status && Array.isArray(widget.status)) {
      //отсекаем лишние события изменения переменной widget
      if (prevSatus !== widget.status) {
        console.log("[i]", "collecting chart data to array, topic:", widget.topic);
        let incomingDataArr = widget.status;

        //console.log("[i]", "array:", incomingDataArr);

        collectingDataArray = [...collectingDataArray, ...incomingDataArr];

        for (let i = 0; i < collectingDataArray.length; i++) {
          labels[i] = getHHMM(collectingDataArray[i].x);
          values[i] = [collectingDataArray[i].y1];
        }

        if (widget.maxCount == 0 || widget.maxCount == "0") {
          clearCart();
          console.log("[i]", "clear cart data");
          return;
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
        prevSatus = widget.status;
        datachart = datachart;
      }
    } else {
      console.log("[i]", "skipping event, topic:", widget.topic);
    }
  }

  function getHHMM(timestamp) {
    var date = new Date(timestamp * 1000);
    return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  }

  function clearCart() {
    datachart = {
      labels: [0],
      datasets: [
        {
          name: widget.descr,
          values: [0],
        },
      ],
    };
  }
</script>

<div class="text-center">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="inline-block italic align-top text-center text-gray-500 txt-sz">{!widget.descr ? "" : widget.descr}</label>
</div>
<Chart data={datachart} type="line" lineOptions={lineOptions} axisOptions={axisOptions} />
