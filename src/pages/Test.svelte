<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  import Chart from "svelte-frappe-charts";

  let datachart = {
    labels: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
    datasets: [
      {
        values: [10, 12, 3, 9, 8, 15, 9],
      },
    ],
  };

  //объединение двух массивов с удалением дубликатов полностью
  let a = [
    { item: "1", description: "lorem" },
    { item: "2", description: "impsum" },
  ];
  let b = [
    { item: "2", description: "dolor" },
    { item: "4", description: "enum" },
  ];
  function joinWithoutDupes(A, B) {
    let output = [];
    const a = new Set(A.map((x) => x.item));
    const b = new Set(B.map((x) => x.item));
    output = [...A.filter((x) => !b.has(x.item)), ...B.filter((x) => !a.has(x.item))];
    console.log(output);
  }
  //объединение двух массивов с удалением дубликатов, оставляя один из дубликатов
  let c = [
    { ID: "1", description: "lorem" },
    { ID: "2", description: "impsum" },
  ];
  let d = [
    { ID: "2", description: "dolor" },
    { ID: "4", description: "enum" },
  ];
  function joinWithoutDupesAndRmooving(A, B) {
    var ids = new Set(A.map((d) => d.ID));
    let output = [...A, ...B.filter((d) => !ids.has(d.ID))];
    console.log(output);
  }
</script>

<Alarm>
  <button class="btn-lg" on:click={() => joinWithoutDupesAndRmooving(c, d)}>{"Проверить"}</button>
</Alarm>

<Alarm>
  <Chart data={datachart} type="line" />
</Alarm>
