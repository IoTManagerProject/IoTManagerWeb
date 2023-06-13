<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  import CrossIcon from "../svg/Cross.svelte";
  import OpenIcon from "../svg/Open.svelte";

  export let show;

  export let deviceList;
  export let showInput;
  export let newDevice = {};
  export let settingsJson;
  export let percent;

  export let addDevInList = () => {};
  export let saveList = () => {};
  export let saveSett = () => {};
  export let sendToAllDevices = (msg) => {};
  export let applicationReboot = () => {};

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

  function onModeChange() {
    show = false;
    saveSett();
    applicationReboot();
    //location.reload();
  }

  function onSaveList() {
    //если ручной режим
    if (!settingsJson.udps) {
      //если открыли поля для заполнения
      if (showInput) {
        //если поля были заполнены
        if (addDevInList()) {
          saveList();
          showInput = false;
          applicationReboot();
        } else {
          showInput = false;
        }
        //если не открыли поля для заполнения
      } else {
        saveList();
        applicationReboot();
      }
      //если авторежим
    } else {
      saveList();
      window.alert("Список устройств сохранен в память ESP. Перейдите в ручной режим для использования сохраненного списка");
      applicationReboot();
    }
  }
</script>

{#if show}
  <div class="my-4">
    <div class="grd-1col1">
      <Card title={settingsJson.udps ? "Список устройств (авто режим)" : "Список устройств (ручной режим)"}>
        <table class="tbl mb-0">
          <thead class="bg-gray-100">
            <tr class="txt-sz txt-pad">
              <th class="tbl-hd w-7">№</th>
              <th class="tbl-hd">Название устройства</th>
              <th class="tbl-hd">IP адрес</th>
              <th class="tbl-hd">Идентификатор</th>
              <th class="tbl-hd">Версия</th>
              <th class="tbl-hd">Состояние</th>
              <th class="tbl-hd">Пинг</th>
              <th class="tbl-hd w-7" />
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each deviceList as device, i}
              <tr class="txt-sz txt-pad">
                <td class="tbl-bdy-lg ipt-lg w-full">{device.ws + 1}</td>
                <td class="tbl-bdy-lg ipt-lg w-full">{device.name}</td>
                <td class="tbl-bdy-lg ipt-lg w-full"><a href={"http://" + device.ip}>{device.ip}</a></td>
                <td class="tbl-bdy-lg ipt-lg w-full">{device.id}</td>
                <td class="tbl-bdy-lg ipt-lg w-full">{device.fv ? device.fv : "-"}</td>
                <td class="tbl-bdy-lg ipt-lg w-full {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
                <td class="tbl-bdy-lg ipt-lg w-full">{device.ping ? device.ping : "-"}</td>

                {#if i > 0}
                  <td class="tbl-bdy-lg"><CrossIcon click={() => deleteLineFromDevlist(i)} /></td>
                {/if}
              </tr>
            {/each}
            {#if showInput}
              <tr class="txt-sz txt-pad">
                <td class="tbl-bdy-lg" />
                <td class="tbl-bdy-lg"><input bind:value={newDevice.name} class="ipt-lg w-full m-0" type="text" /></td>
                <td class="tbl-bdy-lg"><input bind:value={newDevice.ip} class="ipt-lg w-full m-0" type="text" /></td>
                <td class="tbl-bdy-lg"><input bind:value={newDevice.id} class="ipt-lg w-full m-0" type="text" /></td>
                <td class="tbl-bdy-lg" />
              </tr>
            {/if}
          </tbody>
        </table>
        <div class="mb-4">
          <div class="w-full bg-gray-200 rounded-full h-0.5 dark:bg-gray-700">
            <div class="bg-green-300 h-0.5 rounded-full" style="width: {percent}%" />
          </div>
        </div>
        <div class={settingsJson.udps ? "grd-2col1" : "grd-3col1"}>
          {#if !settingsJson.udps && !showInput}
            <button class="btn-lg" on:click={() => (showInput = !showInput)}>{"Добавить устройство"}</button>
          {/if}
          <button class="btn-lg" on:click={() => onSaveList()}>{"Сохранить"}</button>
          <button class="btn-lg" on:click={(msg) => (sendToAllDevices("/reboot|"), window.alert("Все устройства будут перезагружены"))}>{"Перезагрузить все устройства"}</button>
        </div>

        <!--Dev list mode-->
        <div class="mt-4">
          <div class="flex mb-2 h-6 items-center">
            <div class="w-3/4">
              <p class="pr-4 text-gray-500 font-bold text-sm truncate">Автоматический поиск устройств по UDP</p>
            </div>
            <div class="flex justify-end w-1/4">
              <label for="udps" class="items-center cursor-pointer">
                <div class="relative">
                  <input bind:checked={settingsJson.udps} on:change={() => onModeChange()} id="udps" type="checkbox" class="sr-only" />
                  <div class="block {settingsJson.udps ? 'bg-blue-600' : 'bg-gray-600'} w-10 h-6 rounded-full shadow-lg" />
                  <div class="dot bg-gray-100 absolute left-1 top-1 w-4 h-4 rounded-full transition shadow-lg" />
                </div>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
    <Alarm>
      <p>Авто режим - список создается автоматически, можно нажать кнопку "сохранить список" что бы использовать его потом в ручном режиме. Ручной режим - используется сохраненный список, возможно ручное добавление удаление устройств.</p>
    </Alarm>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
