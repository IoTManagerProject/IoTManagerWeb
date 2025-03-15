<script>
  import { onMount } from "svelte";
  import { Route, router } from "tinro";
  import Alarm from "./components/Alarm.svelte";
  import Progress from "./components/Progress.svelte";
  import DashboardPage from "./pages/Dashboard.svelte";
  import ConfigPage from "./pages/Config.svelte";
  import ConnectionPage from "./pages/Connection.svelte";
  import ListPage from "./pages/List.svelte";
  import SystemPage from "./pages/System.svelte";
  import Cookies from "js-cookie";
  import CloudIcon from "./svg/Cloud.svelte";
  import WebSocketManager from "./WebSocketManager";

  import { eventEmitter } from "../eventEmitter";

  router.mode.hash();

  let opened = true;

  const debug = true;
  const devMode = true;
  let screenSize;
  let myip = document.location.hostname;
  if (devMode) myip = "192.168.0.103";

  let showDropdown = true;
  let showAwaitingCircle = false;
  let currentPageName = undefined;

  let deviceList = [
    {
      name: "--",
      id: "--",
      ip: myip,
      ws: 0,
      status: false,
    },
  ];

  const wsManager = new WebSocketManager(deviceList, debug);

  let layoutJson = wsManager.layoutJson;

  router.subscribe(handleNavigation);

  function handleNavigation() {
    wsManager.currentPageName = $router.path.toString();
    wsManager.currentPageName = wsManager.currentPageName + "|";

    console.log("[i]", "user on page:", wsManager.currentPageName);

    //wsManager.clearData();

    if (wsManager.currentPageName === "/|") {
      wsManager.sendToAllDevices(wsManager.currentPageName);
      showDropdown = false;
    } else {
      if (wsManager.currentPageName === "/list|") {
        showDropdown = false;
      } else {
        showDropdown = true;
      }
      wsManager.sendCurrentPageNameToSelectedWs();
    }
  }

  onMount(async () => {
    console.log("[i]", "mounted");
    await getUser();
    onCheck();
    wsManager.selectedDeviceDataRefresh();
    wsManager.connectToAllDevices();
    wsManager.wsTestMsgTask();

    const updateLayoutJson = (newLayoutJson) => {
      layoutJson = newLayoutJson;
    };

    // Add event listener when component is mounted
    eventEmitter.on("layoutJsonUpdated", updateLayoutJson);

    // Remove event listener when component is destroyed
    return () => {
      eventEmitter.off("layoutJsonUpdated", updateLayoutJson);
    };
  });

  const getUser = async () => {
    try {
      const JWT = Cookies.get("token_iotm2");
      let res = await fetch("https://portal.iotmanager.org/api/user/email", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        wsManager.userdata = await res.json();
        wsManager.serverOnline = true;
      } else {
        console.log("error", res.statusText);
        wsManager.serverOnline = true;
      }
    } catch (e) {
      console.log("error", e);
      wsManager.serverOnline = false;
    }
  };

  function onCheck() {
    if (screenSize < 900) {
      wsManager.preventMove = true;
    } else {
      wsManager.preventMove = false;
    }
  }

  function devicesDropdownChange() {
    if (wsManager.currentPageName === "/list|") {
      console.log("[i]", "user change dropdown on list page!!!");
    } else {
      wsManager.selectedDeviceDataRefresh();
      //wsManager.clearData();
      handleNavigation();
      if (debug) console.log("[i]", "user selected device:", wsManager.selectedDeviceData.name);
      if (wsManager.selectedDeviceData.ip === myip) {
        wsManager.originalWs = wsManager.selectedWs;
        if (debug) console.log("[i]", "user selected original device", wsManager.selectedDeviceData.name);
      }
    }
  }

  function ssidClick() {
    wsManager.wsSendMsg(wsManager.selectedWs, "/scan|");
  }

  function rebootEsp() {
    wsManager.rebootOrUpdateProcess = true;
    if (debug) console.log("[i]", "reboot...");
    wsManager.wsSendMsg(wsManager.selectedWs, "/reboot|");
    wsManager.markDeviceStatus(wsManager.selectedWs, false);
    showAwaitingCircle = true;
    wsManager.socketConnected = false;
    wsManager.reconnectTimeout = 10;
    wsManager.remainingTimeout = wsManager.reconnectTimeout;
  }

  function updateBuild(path) {
    wsManager.rebootOrUpdateProcess = true;
    console.log(path);
    wsManager.wsSendMsg(wsManager.selectedWs, "/update|" + path);
    showAwaitingCircle = true;
    wsManager.socketConnected = false;
    wsManager.reconnectTimeout = 20;
    wsManager.remainingTimeout = wsManager.reconnectTimeout;
  }

  function applicationReboot() {
    console.log("[i]", "reboot svelte...");
    for (const key in wsManager.pageReady) {
      wsManager.pageReady[key] = false;
    }
    showAwaitingCircle = true;
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  function cancelAlarm(alarmKey) {
    console.log("[x]", alarmKey);
    wsManager.errorsJson[alarmKey] = 0;
    wsManager.wsSendMsg(wsManager.selectedWs, '/rorre|{"' + alarmKey + '":0}');
  }

  async function getVersionsList() {
    wsManager.versionsList = {};
    if (wsManager.settingsJson.serverip) {
      try {
        let url = wsManager.settingsJson.serverip + "/iotm/ver.json";
        console.log("url", url);
        let res = await fetch(url, {
          mode: "cors",
          method: "GET",
        });
        if (res.ok) {
          wsManager.versionsList = await res.json();
          wsManager.versionsList = wsManager.versionsList[wsManager.errorsJson.bn];
          wsManager.choosingVersion = wsManager.errorsJson.bver;
          console.log(JSON.stringify(wsManager.versionsList));
        } else {
          wsManager.choosingVersion = undefined;
          console.log("error, versions list not received", res.statusText);
        }
      } catch (e) {
        wsManager.choosingVersion = undefined;
        console.log("error, versions list not received");
        console.log(e);
      }
    } else {
      console.log("error, server missing");
    }
  }

  function moduleOrder(id, key, value) {
    console.log("order: ", id, key, value);
    let json = {
      id: id,
      key: key,
      value: value,
    };
    console.log(json);
    wsManager.wsSendMsg(wsManager.selectedWs, "/order|" + JSON.stringify(json));
  }
</script>

<svelte:window bind:innerWidth={screenSize} />

<div class="flex flex-col h-screen bg-gray-50">
  {#if showAwaitingCircle}
    <Progress />
  {/if}

  <!--{#if authorization}
    <ModalPass checkPassword={(pass) => checkPassword(pass)} />
  {/if}-->

  <header class="h-10 w-full bg-gray-100 overflow-auto shadow-md">
    <div class="flex content-center items-center justify-end">
      {#if showDropdown}
        <div class="px-15 py-1">
          <select class="border border-indigo-500 border-1" bind:value={wsManager.selectedWs} on:change={() => devicesDropdownChange()}>
            {#each deviceList as device}
              <option value={device.ws}>
                {device.name}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <!--<div class="pl-4 pr-1 py-1">-->
      <!--<BookIcon color={socketConnected === true ? "text-green-500" : "text-red-500"} />-->
      <!--</div>-->
      <div class="pl-4 pr-4 py-1">
        <CloudIcon color={wsManager.socketConnected === true ? "text-green-500" : "text-red-500"} />
      </div>
    </div>
  </header>

  <nav class="flex">
    <input class="w-0 h-0" bind:checked={opened} on:change={() => onCheck()} id="menu__toggle" type="checkbox" />

    <label class="menu__btn" for="menu__toggle">
      <span />
    </label>

    <ul class="menu__box">
      <li>
        <a class="menu__item" href="/">{"Управление"}</a>
      </li>
      <li>
        <a class="menu__item" href="/config">{"Конфигуратор"}</a>
      </li>
      <li>
        <a class="menu__item" href="/connection">{"Подключение"}</a>
      </li>
      <li>
        <a class="menu__item" href="/system">{"Системные"}</a>
      </li>
      <li>
        <a class="menu__item" href="/list">{"Устройства"}</a>
      </li>
      {#if wsManager.userdata}
        <li>
          <a class="menu__item" href="/profile">{"Модули"}</a>
        </li>
      {:else}
        <li>
          <a class="menu__item" href="/login">{"Вход"}</a>
        </li>
      {/if}
      <li class="flex flex-col pl-6 pt-3 w-full h-screen">
        <!--<select class="border border-indigo-500 border-1 h-6 w-12" bind:value={$locale}>
          {#each locales as l}
            <option value={l}>{l}</option>
          {/each}
        </select>-->
      </li>
    </ul>
  </nav>

  <main class="flex-1 overflow-y-auto p-0 {opened === true && !wsManager.preventMove ? 'ml-36' : 'ml-0'}">
    <ul class="menu__main">
      <div class="bg-cover pt-0 px-4">
        {#if !wsManager.socketConnected && wsManager.currentPageName != "/|"}
          <Alarm title="Подключение через {wsManager.remainingTimeout} сек." />
        {:else}
          <Route path="/">
            <DashboardPage show={wsManager.pageReady.dash} layoutJson={layoutJson} pages={wsManager.pages} wsPush={(ws, topic, status) => wsManager.wsPush(ws, topic, status)} />
          </Route>
          <!--<Route path="/config">
            <ConfigPage show={pageReady.config} bind:configJson={configJson} bind:scenarioTxt={scenarioTxt} widgetsJson={widgetsJson} itemsJson={itemsJson} saveConfig={() => saveConfig()} cleanLogs={() => cleanLogs()} rebootEsp={() => rebootEsp()} moduleOrder={(id, key, value) => moduleOrder(id, key, value)} userdata={userdata} />
          </Route>
          <Route path="/connection">
            <ConnectionPage show={pageReady.connection} rebootEsp={() => rebootEsp()} ssidClick={() => ssidClick()} saveSett={() => saveSett()} saveMqtt={() => saveMqtt()} settingsJson={settingsJson} errorsJson={errorsJson} ssidJson={ssidJson} />
          </Route>
          <Route path="/list">
            <ListPage show={pageReady.list} deviceList={deviceList} settingsJson={settingsJson} saveSett={() => saveSett()} rebootEsp={() => rebootEsp()} showInput={showInput} addDevInList={() => addDevInList()} newDevice={newDevice} sendToAllDevices={(msg) => sendToAllDevices(msg)} saveList={() => saveList()} percent={percent} devListOverride={() => devListOverride()} applicationReboot={() => applicationReboot()} />
          </Route>
          <Route path="/system">
            <SystemPage show={pageReady.system} errorsJson={errorsJson} settingsJson={settingsJson} saveSett={() => saveSett()} rebootEsp={() => rebootEsp()} cleanLogs={() => cleanLogs()} cancelAlarm={(alarmKey) => cancelAlarm(alarmKey)} versionsList={versionsList} bind:choosingVersion={choosingVersion} coreMessages={coreMessages} />
          </Route>

          <Route path="/profile">
            <Profile show={pageReady.profile} flashProfileJson={flashProfileJson} userdata={userdata} updateBuild={(path) => updateBuild(path)} allmodeinfo={allmodeinfo} profile={profile} serverOnline={serverOnline} otaJson={otaJson} />
          </Route>
          <Route path="/login">
            <Login show={true} serverOnline={serverOnline} />
          </Route>-->
        {/if}
      </div>
    </ul>
  </main>

  <footer class="h-4 bg-gray-100 border-gray-300 shadow-lg">
    <div class="flex justify-center content-center text-xxs text-gray-500">Developed by Dmitry Borisenko</div>
  </footer>
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    /*==================================================grids=====================================================*/
    .grd-1col1 {
      @apply grid grid-cols-1 justify-items-center;
    }
    .grd-2col1 {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 justify-items-center;
    }
    .grd-2col2 {
      @apply grid gap-4 grid-cols-2 justify-items-center;
    }
    .grd-3col1 {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 justify-items-center;
    }
    .grd-4col1 {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center;
    }
    /*=============================================card and items inside===============================================*/
    .crd-itm-psn {
      @apply flex mb-2 h-6 items-center;
    }
    .wgt-dscr-stl {
      @apply pr-4 text-gray-500 font-bold;
    }
    /*====================================================others=====================================================*/
    .btn-i {
      @apply py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
    }
    .wgt-adt-stl {
      @apply text-center text-gray-500 font-bold;
    }
    /*====================================================table=====================================================*/
    .tbl {
      @apply table-fixed w-full select-none my-2;
    }
    .tbl-hd {
      @apply text-center px-1 break-words text-gray-500 font-bold truncate;
    }
    .tbl-bdy-lg {
      @apply text-center px-1 break-words truncate;
    }
    .tbl-bdy-sm {
      @apply px-1 break-words;
    }
    /*====================================================inputs=====================================================*/
    .ipt-lg {
      @apply h-4 sm:h-7 md:h-7 lg:h-7 xl:h-7 2xl:h-7 content-center mt-2 bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500;
    }
    .ipt-sm {
      @apply h-3 sm:h-6 md:h-6 lg:h-6 xl:h-6 2xl:h-6 content-center bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500 rounded-sm;
    }
    .ipt-rnd {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white;
    }
    .ipt-big {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500;
    }
    /*====================================================text=====================================================*/
    .txt-ita {
      @apply inline-block italic align-top text-right text-gray-500;
    }
    .txt-pad {
      @apply px-2 py-0 sm:py-0 md:py-0 lg:py-1 xl:py-2 2xl:py-2;
    }
    .txt-sz {
      @apply text-xxs sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base;
    }
    /*====================================================buttons=====================================================*/
    .btn-lg {
      @apply flex justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base h-6 sm:h-8 md:h-8 lg:h-8 xl:h-8 2xl:h-8 w-full mt-0 border border-gray-300 rounded truncate;
    }
    .btn-tbl {
      @apply flex justify-center content-center text-gray-500 font-bold w-6 h-auto border border-gray-300;
    }
    /*====================================================select=====================================================*/
    .slct-lg {
      @apply flex w-full justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base h-6 sm:h-8 md:h-8 lg:h-8 xl:h-8 2xl:h-8 mb-0 border border-gray-300 rounded;
    }
  }

  #menu__toggle {
    position: relative;
    opacity: 0;
  }
  #menu__toggle:checked ~ .menu__btn > span {
    transform: rotate(45deg);
  }
  #menu__toggle:checked ~ .menu__btn > span::before {
    top: 0;
    transform: rotate(0);
  }
  #menu__toggle:checked ~ .menu__btn > span::after {
    top: 0;
    transform: rotate(90deg);
  }
  #menu__toggle:checked ~ .menu__box {
    visibility: visible;
    left: 0;
  }

  #menu__toggle:checked ~ .menu__main {
    margin-left: 150px; /* насколько сужать правую часть */
    transition-duration: 0.25s;
  }

  .menu__btn {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 2;
    top: 10px;
    left: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .menu__btn > span,
  .menu__btn > span::before,
  .menu__btn > span::after {
    display: block;
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #616161;
    transition-duration: 0.25s;
  }
  .menu__btn > span::before {
    content: "";
    top: -8px;
  }
  .menu__btn > span::after {
    content: "";
    top: 8px;
  }

  .menu__box {
    display: block;
    position: fixed;
    visibility: hidden;
    z-index: 1;
    top: 0;
    left: -100%;
    width: 150px; /* размер выхода бокового меню */
    height: 100%;
    margin: 0;
    padding: 80px 0;
    list-style: none;
    background-color: #eceff1;
    box-shadow: 1px 0px 6px rgba(0, 0, 0, 0.2);
    transition-duration: 0.25s;
  }

  .menu__item {
    display: block;
    padding: 12px 24px;
    color: rgba(51, 51, 51, 0.788);
    font-family: "Roboto", sans-serif;
    font-size: 15px; /* размер шрифта бокового меню */
    font-weight: 600;
    text-decoration: none;
    transition-duration: 0.25s;
  }
  .menu__item:hover {
    background-color: #cfd8dc;
  }

  .upper__bar {
    background-color: rgba(51, 51, 51, 0.144);
    height: 70px;
    position: fixed;
    z-index: -1;
    top: 0px;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: 1px 0px 3px rgba(0, 0, 0, 0.2);
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }
  input[type="time"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    margin-left: 7px;
    margin-right: -6px;
    width: 30px;
    height: 30px;
    opacity: 1;
  }

  /* Toggle */
  input:checked ~ .dot {
    transform: translateX(100%);
    /* background-color: #48bb78;*/
  }

  input[type="file"] {
    display: none;
  }

  /* width */
  ::-webkit-scrollbar {
    width: 8px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #ebebeb;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #cbcbcb;
    border-radius: 2px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #aeaeae;
  }
</style>
