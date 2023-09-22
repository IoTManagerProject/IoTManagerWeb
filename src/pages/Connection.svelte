<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let settingsJson;
  export let errorsJson;
  export let ssidJson;

  export let show;

  export let ssidClick = () => {};
  export let saveSett = () => {};
  export let saveMqtt = () => {};
  export let rebootEsp = () => {};
</script>

{#if show}
  <div class="my-4">
    <div class="grd-2col1">
      <Card title="Подключение к WiFi">
        <div class="grid grid-cols-2 gap-2">
          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Название устройства</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.name} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Точка доступа</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.apssid} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Пароль точки доступа</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.appass} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Название wifi сети</p>
          </div>
          <div class="flex justify-end w-full">
            <select class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" bind:value={settingsJson.routerssid} on:click={() => ssidClick()}>
              {#each Object.entries(ssidJson) as [num, ssid]}
                <option value={ssid}>
                  {ssid}
                </option>
              {/each}
            </select>
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Пароль</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.routerpass} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Сервер обновления</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.serverip} class="content-center px-2 h-8 mb-4 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>
        </div>
        {#if errorsJson.passer === 1}
          <div class="grd-1col1">
            <Alarm title="Введен неправильный пароль" />
          </div>
        {/if}

        <button class="btn-lg" on:click={() => saveSett()}>{"Сохранить"}</button>
      </Card>

      <Card title="Подключение к MQTT">
        <div class="grid grid-cols-2 gap-2">
          <div class="w-full">
            <p class="wgt-dscr-stl text-gray-500 truncate">Состояние подключения</p>
          </div>
          <div class="flex justify-center w-full align-baseline text-sm sm:text-sm md:text-base lg:text-base xl:text-base 2xl:text-base truncate align-text-middle">
            {#if errorsJson.mqtt === "e5"}
              <p class="text-green-500 font-bold m-0 p-0 h-8 bg-green-50 border-2 border-gray-200 rounded w-full text-center">Подключено</p>
            {:else if errorsJson.mqtt === "e13"}
              <p class="text-yellow-500 font-bold h-8 bg-yellow-50 border-2 border-gray-200 rounded w-full text-center">Подключение</p>
            {:else if errorsJson.mqtt === undefined}
              <p class="text-blue-500 font-bold h-8 bg-blue-50 border-2 border-gray-200 rounded w-full text-center">Ожидание</p>
            {:else}
              <p class="text-red-500 font-bold h-8 bg-red-50 border-2 border-gray-200 rounded w-full text-center">Ошибка</p>
            {/if}
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Название сервера</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.mqttServer} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Порт</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.mqttPort} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Префикс</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.mqttPrefix} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Имя пользователя</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.mqttUser} class="content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>

          <div class="w-full">
            <p class="wgt-dscr-stl truncate">Пароль</p>
          </div>
          <div class="flex justify-end w-full">
            <input bind:value={settingsJson.mqttPass} class="content-center px-2 h-8 mb-4 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-left focus:border-indigo-500" type="text" />
          </div>
        </div>
        <button class="btn-lg" on:click={() => saveMqtt()}>{"Сохранить"}</button>
      </Card>
    </div>
  </div>
  <div class="grd-1col1">
    <Card>
      <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
