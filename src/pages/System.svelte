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
      <!--Ошибки которые можно сбросить пользователю, связанные с ядром-->
      {#if errorsJson.wscle === 1}
        <Alarm title={"Ошибка web sockets"} cross={true} close={() => cancelAlarm("wscle")}>
          <p class="break-words text-center">Слишком много клиентов было открыто. Допускается не более четырех.</p>
        </Alarm>
      {/if}
      {#if errorsJson.jsbuf === 1}
        <Alarm title={"Ошибка json"} cross={true} close={() => cancelAlarm("jsbuf")}>
          <p class="break-words text-center">Недостаточный размер буфера библиотеки Arduino Json. Устройство может вести себя непредсказуемо. Обратитесь к разработчику</p>
        </Alarm>
      {/if}
      {#if errorsJson.jserr > 0}
        <Alarm title={"Ошибка json"} cross={true} close={() => cancelAlarm("jserr")}>
          <p class="break-words text-center">Ошибка записи/чтения json. Устройство может вести себя непредсказуемо. Количество ошибок: {errorsJson.jserr}. Обратитесь к разработчику.</p>
        </Alarm>
      {/if}
      <!--Ошибки которые нельзя сбросить пользователю-->
      {#if errorsJson.bver != version}
        <Alarm title={"Ошибка версии"}>
          <p class="break-words text-center">Версия файловой системы не совпадает с версией прошивки. Вероятно произошла ошибка во время обновления устройства по воздуху.</p>
        </Alarm>
      {/if}
      {#if errorsJson.rssi < 3 && errorsJson.rssi > 0}
        <Alarm title={"WiFi"}>
          <p class="break-words text-center">Уровень сигнала WiFi предельно низкий, веб интерфейс может работать со сбоями и потерей данных, рекомендуется переместить устройство ближе к роутеру</p>
        </Alarm>
      {/if}
      <!--MQTT ошибки-->
      {#if errorsJson.mqtt === -4}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Нет ответа от сервера</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === -3}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Соединение было разорвано</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === -2}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Ошибка соединения. Обычно возникает когда неверно указано название сервера MQTT</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === -1}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Клиент был отключен</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 1}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Ошибка версии</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 2}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Отклонен идентификатор</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 3}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Не могу установить соединение</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 4}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Неправильное имя пользователя/пароль</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 5}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Не авторизован для подключения</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 6}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Название сервера пустое</p>
        </Alarm>
      {/if}
      {#if errorsJson.mqtt === 7}
        <Alarm title={"MQTT"}>
          <p class="break-words text-center">Имя пользователя или пароль пустые</p>
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
