<script>
  import Chart from "svelte-frappe-charts";

  export let widget;

  let labels = [0, 0];
  let values = [0, 0];

  let datachart = {
    labels: labels,
    datasets: [
      {
        values: values,
      },
    ],
  };

  $: widget.status, calc();

  function calc() {
    if (widget.status) {
      let dataArr = widget.status;
      for (let i = 0; i < dataArr.length; i++) {
        var date = new Date(dataArr[i].x * 1000);
        let hhmm = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
        labels[i] = hhmm;
        values[i] = dataArr[i].y1;
      }

      datachart = {
        labels: labels,
        datasets: [
          {
            values: values,
          },
        ],
      };

      //console.log("chart data: ", JSON.stringify(datachart));
    }
  }

  function convert() {
    // Months array
    var months_arr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Convert timestamp to milliseconds
    var date = new Date(unixtimestamp * 1000);
    // Year
    var year = date.getFullYear();
    // Month
    var month = months_arr[date.getMonth()];
    // Day
    var day = date.getDate();
    // Hours
    var hours = date.getHours();
    // Minutes
    var minutes = "0" + date.getMinutes();
    // Seconds
    var seconds = "0" + date.getSeconds();
    // Display date time in MM-dd-yyyy h:m:s format
    var convdataTime = month + "-" + day + "-" + year + " " + hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
  }
</script>

<div class="text-center">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr} </label>
</div>
<Chart data={datachart} type="line" />
