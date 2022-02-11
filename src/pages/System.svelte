<script>
  const wifiState = {
    0: "не подключено",
    1: "нет сигнала",
    2: "очень низкий",
    3: "низкий",
    4: "хороший",
    5: "очень хороший",
    6: "отличный",
  };

  const systemErrorsRus = {
    mqtt: {
      e1: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Нет ответа от сервера",
        cancel: false,
      },
      e2: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Соединение было разорвано",
        cancel: false,
      },
      e3: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Ошибка соединения. Обычно возникает когда неверно указано название сервера MQTT",
        cancel: false,
      },
      e4: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Клиент был отключен",
        cancel: false,
      },
      e6: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Ошибка версии",
        cancel: false,
      },
      e7: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Отклонен идентификатор",
        cancel: false,
      },
      e8: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Не могу установить соединение",
        cancel: false,
      },
      e9: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Неправильное имя пользователя/пароль",
      },
      e10: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Не авторизован для подключения",
        cancel: false,
      },
      e11: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Название сервера пустое",
        cancel: false,
      },
      e12: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Имя пользователя или пароль пустые",
        cancel: false,
      },
      e13: {
        descr: "Mqtt",
        color: "text-red-500",
        txt: "Подключение в процессе",
        cancel: false,
      },
    },
    wse1: {
      1: {
        descr: "Ошибка веб сокетов",
        color: "text-red-500",
        txt: "Слишком много клиентов было открыто. Допускается не более четырех.",
        cancel: true,
      },
    },
    jse1: {
      1: {
        descr: "Ошибка json",
        color: "text-red-500",
        txt: "Недостаточный размер буфера библиотеки Arduino Json. Устройство может вести себя непредсказуемо. Обратитесь к разработчику.",
        cancel: true,
      },
    },
    jse2: {
      1: {
        descr: "Ошибка json",
        color: "text-red-500",
        txt: "Ошибка записи/чтения json. Устройство может вести себя непредсказуемо. Обратитесь к разработчику.",
        cancel: true,
        num: true,
      },
    },
  };

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
      <!--ошибки-->
      {#each Object.entries(errorsJson) as [key, param]}
        {#if key in systemErrorsRus && param in systemErrorsRus[key]}
          <Alarm title={systemErrorsRus[key][param].descr} cross={systemErrorsRus[key][param].cancel} close={() => cancelAlarm(key)}>
            <p class="break-words text-center">{systemErrorsRus[key][param].txt}</p>
            {#if systemErrorsRus[key][param].num}
              <p class="break-words text-center">{"Количество: " + errorsJson[key + "n"]}</p>
            {/if}
          </Alarm>
        {/if}
      {/each}
    </div>
  </Card>
</div>
<div class="grd-1col1">
  <Card>
    <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
  </Card>
</div>
