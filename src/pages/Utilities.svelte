<script>
  import Card from "../components/Card.svelte";
  import Chart from "svelte-frappe-charts";

  let datachart = {
    labels: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
    datasets: [
      {
        values: [10, 12, 3, 9, 8, 15, 9],
      },
    ],
  };
</script>

<Card title={"Пример графика"}>
  <Chart data={datachart} type="line" />
</Card>
