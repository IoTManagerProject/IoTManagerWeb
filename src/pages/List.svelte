<script>
  import Card from "../components/Card.svelte";

  export let deviceList;
  export let showInput;

  export let newDevice = {};

  export let devListSave = () => {};
  export let deleteLineFromDevlist = (num) => {};
</script>

<div class="grd-1cols">
  <Card title={"Список устройств"}>
    <table class="tbl">
      <thead class="bg-gray-100">
        <tr class="tbl-txt-sz tbl-txt-p">
          <th class="tbl-hd">Название устройства</th>
          <th class="tbl-hd">IP адрес</th>
          <th class="tbl-hd">Идентификатор</th>
          <th class="tbl-hd">Состояние</th>
          <th class="tbl-hd w-7" />
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each deviceList as device, i}
          <tr class="tbl-txt-sz tbl-txt-p">
            <td class="tbl-bdy tbl-ipt w-full">{device.name}</td>
            <td class="tbl-bdy tbl-ipt w-full"><a href={"http://" + device.ip}>{device.ip}</a></td>
            <td class="tbl-bdy tbl-ipt w-full">{device.id}</td>
            <td class="tbl-bdy tbl-ipt w-full {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
            <td class="tbl-bdy"><svg on:click={() => deleteLineFromDevlist(i)} class="h-6 w-6 text-red-400 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <line x1="18" y1="6" x2="6" y2="18" /> <line x1="6" y1="6" x2="18" y2="18" /></svg></td>
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
</div>
