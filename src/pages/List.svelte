<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  import CrossIcon from "../svg/Cross.svelte";
  import OpenIcon from "../svg/Open.svelte";

  export let deviceList;
  export let showInput;
  export let newDevice = {};

  export let devListSave = () => {};

  let debug = true;

  function deleteLineFromDevlist(num) {
    for (let i = 0; i < deviceList.length; i++) {
      if (num === i) {
        deviceList.splice(i, 1);
        deviceList = deviceList;
        if (debug) console.log("[i]", "item " + num + " deleted from dev list");
        break;
      }
    }
  }
</script>

<div class="grd-1col1">
  <Card title={"Список устройств"}>
    <table class="tbl">
      <thead class="bg-gray-100">
        <tr class="txt-sz txt-pad">
          <th class="tbl-hd">Название устройства</th>
          <th class="tbl-hd">IP адрес</th>
          <th class="tbl-hd">Идентификатор</th>
          <th class="tbl-hd">Состояние</th>
          <th class="tbl-hd w-7" />
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each deviceList as device, i}
          <tr class="txt-sz txt-pad">
            <td class="tbl-bdy-lg ipt-lg w-full">{device.name}</td>
            <td class="tbl-bdy-lg ipt-lg w-full"><a href={"http://" + device.ip}>{device.ip}</a></td>
            <td class="tbl-bdy-lg ipt-lg w-full">{device.id}</td>
            <td class="tbl-bdy-lg ipt-lg w-full {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
            <td class="tbl-bdy-lg"><CrossIcon i={i} click={(i) => deleteLineFromDevlist(i)} /></td>
          </tr>
        {/each}
        {#if showInput}
          <tr class="txt-sz txt-pad">
            <td class="tbl-bdy-lg"><input bind:value={newDevice.name} class="ipt-lg w-full" type="text" /></td>
            <td class="tbl-bdy-lg"><input bind:value={newDevice.ip} class="ipt-lg w-full" type="text" /></td>
            <td class="tbl-bdy-lg"><input bind:value={newDevice.id} class="ipt-lg w-full" type="text" /></td>
            <td class="tbl-bdy-lg" />
          </tr>
        {/if}
      </tbody>
    </table>
    <button class="btn-lg" on:click={() => ((showInput = !showInput), devListSave())}>{showInput ? "Сохранить" : "Добавить устройство"}</button>
  </Card>
  <Alarm>
    <p>Список устройств будет обновляться автоматически. Подключенные к одному роутеру устройства будут появляться в списке в течении двух минут. Ручное добавление сделано в целях проверки для разработчика.</p>
  </Alarm>
</div>
