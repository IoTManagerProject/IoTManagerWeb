<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  export let version;
  export let errorsJson;
  export let rebootEsp = () => {};

  export let cancelAlarm = (alarmKey) => {};
</script>

<div class="grd-2col1">
  <Card title="Системная информация">
    <div class="crd-itm-psn">
      <div class="w-3/4">
        <p class="wgt-dscr-stl">Версия прошивки</p>
      </div>
      <div class="flex justify-center w-1/4">
        <p class="text-gray-500 font-bold">{errorsJson.bver}</p>
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="w-3/4">
        <p class="wgt-dscr-stl">Версия файловой системы</p>
      </div>
      <div class="flex justify-center w-1/4">
        <p class="text-gray-500 font-bold">{version}</p>
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="w-3/4">
        <p class="wgt-dscr-stl">Время работы устройства</p>
      </div>
      <div class="flex justify-center w-1/4">
        <p class="text-gray-500 font-bold">{errorsJson.upt}</p>
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="w-3/4">
        <p class="wgt-dscr-stl">Качество WiFi сигнала</p>
      </div>
      <div class="flex justify-center w-1/4 text-xs sm:text-sm md:text-base lg:text-base xl:text-base 2xl:text-base break-words">
        {#if errorsJson.rssi === 0}
          <p class="text-red-500 font-bold">не подключено</p>
        {/if}
        {#if errorsJson.rssi === 1}
          <p class="text-red-500 font-bold">нет сигнала</p>
        {/if}
        {#if errorsJson.rssi === 2}
          <p class="text-red-500 font-bold">очень низкий</p>
        {/if}
        {#if errorsJson.rssi === 3}
          <p class="text-yellow-500 font-bold">низкий</p>
        {/if}
        {#if errorsJson.rssi === 4}
          <p class="text-yellow-500 font-bold">хороший</p>
        {/if}
        {#if errorsJson.rssi === 5}
          <p class="text-green-500 font-bold">очень хороший</p>
        {/if}
        {#if errorsJson.rssi === 6}
          <p class="text-green-500 font-bold">отличный</p>
        {/if}
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="w-3/4">
        <p class="wgt-dscr-stl">Остаток оперативной памяти</p>
      </div>
      <div class="flex justify-center w-1/4">
        <p class="text-green-500 font-bold">{errorsJson.heap}</p>
      </div>
    </div>
  </Card>
  <Card title="Системные ошибки">
    <div class="grd-2col1">
      {#if errorsJson.wscle === 1}
        <Alarm title={"Ошибка web sockets"} close={() => cancelAlarm("wscle")}>
          <p class="break-words text-center">Слишком много клиентов было открыто. Допускается не более четырех. Для исчезновения ошибки перезагрузите устройство</p>
        </Alarm>
      {/if}
      {#if errorsJson.bver != version}
        <Alarm title={"Ошибка версии"} close={() => cancelAlarm("bver")}>
          <p class="break-words text-center">Версия файловой системы не совпадает с версией прошивки. Вероятно произошла ошибка во время обновления устройства по воздуху.</p>
        </Alarm>
      {/if}
      {#if errorsJson.rssi < 3 && errorsJson.rssi > 0}
        <Alarm title={"WiFi"}>
          <p class="break-words text-center">Уровень сигнала WiFi предельно низкий, веб интерфейс может работать со сбоями и потерей данных, рекомендуется переместить устройство ближе к роутеру</p>
        </Alarm>
      {/if}
    </div>
  </Card>
</div>
<div class="grd-1col1">
  <Card>
    <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
  </Card>
</div>
