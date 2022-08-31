<script>
  import Chart from "svelte-frappe-charts";

  export let widget;

  let axisOptions = { xAxisMode: "tick", xIsSeries: true };
  let lineOptions;

  if (widget.pointRadius == "0") {
    lineOptions = { regionFill: 1, hideDots: 1, spline: 1 };
  } else {
    lineOptions = { regionFill: 1, dotSize: 3, spline: 1 };
  }

  let collectingDataArray = [];
  let prevSatus = [];

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

  $: widget.status, collectDataToArr();

  function collectDataToArr() {
    if (Array.isArray(widget.status)) {
      //отсекаем лишние события изменения переменной widget
      if (prevSatus !== widget.status) {
        console.log("[i]", "collecting chart data, topic:", widget.topic);
        let incomingDataArr = widget.status;
        //console.log("[i]", incomingDataArr);
        collectingDataArray = [...collectingDataArray, ...incomingDataArr];

        for (let i = 0; i < collectingDataArray.length; i++) {
          labels[i] = getHHMM(collectingDataArray[i].x);
          values[i] = [collectingDataArray[i].y1];
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
    }
  }

  function getHHMM(timestamp) {
    var date = new Date(timestamp * 1000);
    return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  }
</script>

<Chart data={datachart} type="line" lineOptions={lineOptions} axisOptions={axisOptions} />
