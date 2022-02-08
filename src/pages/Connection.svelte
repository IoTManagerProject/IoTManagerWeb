<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let settingsJson;
  export let errorsJson;
  export let ssidJson;
  export let ssidDropdownClick = () => {};
  export let saveSettings = () => {};
  export let rebootEsp = () => {};
</script>

<div class="grd-2col1">
  <Card title="Подключение к WiFi роутеру">
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название устройства</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.name} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Точка доступа</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.apssid} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль точки доступа</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.appass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название wifi сети</p>
      </div>
      <div class="wgt-w">
        <select class="ipt-rnd text-left focus:border-indigo-500" bind:value={settingsJson.routerssid} on:click={() => ssidDropdownClick()}>
          {#each Object.entries(ssidJson) as [num, ssid]}
            <option value={ssid}>
              {ssid}
            </option>
          {/each}
        </select>
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.routerpass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    {#if errorsJson.passer === 1}
      <div class="grd-1col1">
        <Alarm title="Введен неправильный пароль" />
      </div>
    {/if}
    <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить"}</button>
  </Card>
  <Card title="Подключение к MQTT брокеру">
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название сервера</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttServer} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Порт</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPort} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Префикс</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPrefix} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Имя пользователя</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttUser} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPass} class="ipt-rnd text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить и проверить подключение"}</button>
  </Card>
</div>
<div class="grd-1col1">
  <Card title="Дополнительные опции">
    <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
  </Card>
</div>
