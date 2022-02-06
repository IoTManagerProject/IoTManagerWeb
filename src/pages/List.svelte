<script>
  import Card from "../components/Card.svelte";

  export let deviceList;
  export let showInput;

  let newDevice = {};

  export let devListSave = () => {};
</script>

<Card title={"Список устройств"}>
  <table class="table-fixed gap-4 w-full">
    <thead class="bg-gray-50 ">
      <tr class="tbl-txt-sz tbl-txt-p">
        <th class="tbl-hd">Название устройства</th>
        <th class="tbl-hd">IP адрес</th>
        <th class="tbl-hd">Идентификатор</th>
        <th class="tbl-hd">Состояние</th>
      </tr>
    </thead>
    <tbody class="bg-white">
      {#each deviceList as device}
        <tr class="tbl-txt-sz tbl-txt-p">
          <td class="tbl-bdy">{device.name}</td>
          <td class="tbl-bdy"><a href={"http://" + device.ip}>{device.ip}</a></td>
          <td class="tbl-bdy">{device.id}</td>
          <td class="tbl-bdy {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
        </tr>
      {/each}
      {#if showInput}
        <tr class="tbl-txt-sz tbl-txt-p">
          <td class="tbl-bdy"><input bind:value={newDevice.name} class="tbl-ipt w-full" type="text" /></td>
          <td class="tbl-bdy"><input bind:value={newDevice.ip} class="tbl-ipt w-full" type="text" /></td>
          <td class="tbl-bdy"><input bind:value={newDevice.id} class="tbl-ipt w-full" type="text" /></td>
          <td class="tbl-bdy" />
        </tr>
      {/if}
    </tbody>
  </table>
  <button class="btn-lg" on:click={() => ((showInput = !showInput), devListSave())}>{showInput ? "Сохранить" : "Добавить устройство"}</button>
</Card>
