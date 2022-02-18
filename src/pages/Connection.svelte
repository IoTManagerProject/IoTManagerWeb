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
  <div class="grd-2col1">
    <Card title="Подключение к WiFi">
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Название устройства</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.name} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Точка доступа</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.apssid} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Пароль точки доступа</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.appass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Название wifi сети</p>
        </div>
        <div class="flex justify-end w-3/6">
          <select class="ipt-rnd text-left focus:border-indigo-500" bind:value={settingsJson.routerssid} on:click={() => ssidClick()}>
            {#each Object.entries(ssidJson) as [num, ssid]}
              <option value={ssid}>
                {ssid}
              </option>
            {/each}
          </select>
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Пароль</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.routerpass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Сервер обновления</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.serverip} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
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
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Состояние подключения</p>
        </div>
        <div class="flex justify-center w-3/6 align-baseline text-sm sm:text-sm md:text-base lg:text-base xl:text-base 2xl:text-base break-words">
          {#if errorsJson.mqtt === "e5"}
            <p class="text-green-500 font-bold h-8 bg-green-50 border-2 border-gray-200 rounded w-full text-center">Подключено</p>
          {:else if errorsJson.mqtt === "e13"}
            <p class="text-yellow-500 font-bold h-8 bg-yellow-50 border-2 border-gray-200 rounded w-full text-center">Подключение</p>
          {:else if errorsJson.mqtt === undefined}
            <p class="text-blue-500 font-bold h-8 bg-blue-50 border-2 border-gray-200 rounded w-full text-center">Ожидание</p>
          {:else}
            <p class="text-red-500 font-bold h-8 bg-red-50 border-2 border-gray-200 rounded w-full text-center">Ошибка</p>
          {/if}
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Название сервера</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.mqttServer} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Порт</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.mqttPort} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Префикс</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.mqttPrefix} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Имя пользователя</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.mqttUser} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <div class="crd-itm-psn">
        <div class="w-4/6">
          <p class="wgt-dscr-stl">Пароль</p>
        </div>
        <div class="flex justify-end w-3/6">
          <input bind:value={settingsJson.mqttPass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
        </div>
      </div>
      <button class="btn-lg" on:click={() => saveMqtt()}>{"Сохранить"}</button>
    </Card>
  </div>
  <div class="grd-1col1">
    <Card>
      <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
