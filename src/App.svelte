<script>
  /*
   Svelte IoT Manager app
   created by Dmitry Borisenko
   Vienna, Austria 1030, Juchgasse 5/17
   +43 67761588253
  */

  import { onMount } from "svelte";
  import { Route, router } from "tinro";
  router.mode.hash();

  import Alarm from "./components/Alarm.svelte";
  import Progress from "./components/Progress.svelte";
  import DashboardPage from "./pages/Dashboard.svelte";
  import ConfigPage from "./pages/Config.svelte";
  import ConnectionPage from "./pages/Connection.svelte";
  import ListPage from "./pages/List.svelte";
  import SystemPage from "./pages/System.svelte";
  import Login from "./pages/Login.svelte";
  import Profile from "./pages/Profile.svelte";
  import Cookies from "js-cookie";

  import * as portal from "./api/portal.js";
  import * as firmware from "./api/firmware.js";
  import WebSocketManager from "./lib/WebSocketManager.js";
  import { eventEmitter } from "./eventEmitter.js";
  import AppHeader from "./components/layout/AppHeader.svelte";
  import AppNav from "./components/layout/AppNav.svelte";
  import AppFooter from "./components/layout/AppFooter.svelte";

  const devMode = true;
  const myip = devMode ? "127.0.0.1" : document.location.hostname;
  const initialDeviceList = [
    { name: "--", id: "--", ip: myip, ws: 0, status: false },
  ];

  const wsManager = new WebSocketManager(initialDeviceList, { debug: true });

  // Local reactive state (synced from wsManager via events)
  let layoutJson = [];
  let pages = [];
  let deviceList = [...initialDeviceList];
  let pageReady = {
    dash: false,
    config: false,
    connection: false,
    list: false,
    system: false,
    dev: false,
    profile: false,
  };
  let configJson = [];
  let scenarioTxt = " ";
  let widgetsJson = [];
  let itemsJson = [];
  let settingsJson = {};
  let errorsJson = {};
  let ssidJson = {};
  let versionsList = {};
  let choosingVersion = undefined;
  let selectedWs = 0;
  let socketConnected = false;
  let percent = 0;
  let remainingTimeout = 60;

  let opened = true;
  let preventMove = false;
  let screenSize;
  let showInput = false;

  $: currentPageName = wsManager.currentPageName;
  $: wsManager.choosingVersion = choosingVersion;

  router.subscribe(handleNavigation);

  function handleNavigation() {
    wsManager.currentPageName = $router.path.toString() + "|";
    console.log("[i]", "user on page:", wsManager.currentPageName);
    wsManager.clearData();
    if (wsManager.currentPageName === "/|") {
      wsManager.sendToAllDevices(wsManager.currentPageName);
    } else {
      wsManager.sendCurrentPageNameToSelectedWs();
    }
  }

  function devicesDropdownChange() {
    wsManager.selectedWs = selectedWs;
    if (currentPageName === "/list|") {
      console.log("[i]", "user change dropdown on list page!!!");
    } else {
      wsManager.selectedDeviceDataRefresh();
      wsManager.clearData();
      handleNavigation();
      console.log("[i]", "user selected device:", wsManager.selectedDeviceData?.name);
    }
  }

  function onCheck() {
    preventMove = screenSize < 900;
  }

  onMount(async () => {
    console.log("[i]", "mounted");
    console.log("[layout] Layout debug ON. Open dashboard (/) to see layout logs.");
    const JWT = Cookies.get("token_iotm2");
    const res = await portal.getUser(JWT);
    if (res.ok) {
      wsManager.userdata = res.userdata;
      wsManager.serverOnline = true;
    } else {
      wsManager.serverOnline = res.serverOnline !== false;
    }

    wsManager.options.onSystemParsed = async () => {
      const r = await firmware.getVersionsList(wsManager.settingsJson.serverip);
      if (r.ok && r.data) {
        wsManager.versionsList = r.data[wsManager.errorsJson.bn] || {};
        wsManager.choosingVersion = wsManager.errorsJson.bver;
      } else {
        wsManager.choosingVersion = undefined;
      }
    };

    wsManager.options.onProfileParsed = async () => {
      const modRes = await portal.getModInfo();
      if (modRes.ok) wsManager.allmodeinfo = modRes.allmodeinfo;
      const JWT2 = Cookies.get("token_iotm2");
      const profRes = await portal.getProfile(JWT2);
      if (profRes.ok) {
        wsManager.profile = profRes.profile;
        const p = wsManager.profile;
        const fp = wsManager.flashProfileJson;
        if (p && fp) {
          p.projectProp.platformio.default_envs = fp.projectProp?.platformio?.default_envs;
          for (const [compilerCategory, compilerCategoryModules] of Object.entries(p.modules || {})) {
            const devCategoryModules = fp.modules?.[compilerCategory];
            compilerCategoryModules.forEach((compilerModule) => {
              compilerModule.active = false;
              (devCategoryModules || []).forEach((devModule) => {
                if (devModule.path === compilerModule.path) compilerModule.active = devModule.active;
              });
            });
          }
        }
      }
    };

    onCheck();
    opened = screenSize > 900;
    wsManager.firstDevListRequest = true;
    wsManager.selectedDeviceDataRefresh();
    socketConnected = wsManager.socketConnected;
    percent = wsManager.percent;
    remainingTimeout = wsManager.remainingTimeout;
    wsManager.connectToAllDevices();
    wsManager.startReconnectTask();

    eventEmitter.on("layoutJsonUpdated", (data) => {
      layoutJson = data.layoutJson || [];
      pages = data.pages || [];
      if (data.pageReady) pageReady = data.pageReady;
      if (data.configJson !== undefined) configJson = data.configJson;
      if (data.scenarioTxt !== undefined) scenarioTxt = data.scenarioTxt;
    });
    eventEmitter.on("deviceListUpdated", () => {
      deviceList = [...wsManager.deviceList];
      socketConnected = wsManager.socketConnected;
    });
    eventEmitter.on("reconnectTick", (data) => {
      percent = data.percent;
      remainingTimeout = data.remainingTimeout;
    });
    eventEmitter.on("configUpdated", (data) => {
      configJson = data.configJson || [];
      scenarioTxt = data.scenarioTxt ?? " ";
      if (data.widgetsJson) widgetsJson = data.widgetsJson;
      if (data.itemsJson) itemsJson = data.itemsJson;
    });
    eventEmitter.on("connectionUpdated", (data) => {
      if (data.settingsJson) settingsJson = data.settingsJson;
      if (data.errorsJson) errorsJson = data.errorsJson;
      if (data.ssidJson) ssidJson = data.ssidJson;
    });
    eventEmitter.on("systemUpdated", () => {
      versionsList = wsManager.versionsList || {};
      choosingVersion = wsManager.choosingVersion;
    });

    handleNavigation();
  });
</script>

<svelte:window bind:innerWidth={screenSize} />

<div class="flex flex-col h-screen bg-gray-50">
  {#if wsManager.showAwaitingCircle}
    <Progress />
  {/if}

  <AppHeader
    {deviceList}
    bind:selectedWs
    showDropdown={wsManager.currentPageName !== "/|" && wsManager.currentPageName !== "/list|"}
    {socketConnected}
    {devicesDropdownChange}
  />
  <AppNav bind:opened onCheck={() => onCheck()} userdata={wsManager.userdata} />

  <main class="flex-1 overflow-y-auto p-0 {opened === true && !preventMove ? 'ml-36' : 'ml-0'}">
    <ul class="menu__main">
      <div class="bg-cover pt-0 px-4">
        {#if !socketConnected && wsManager.currentPageName !== "/|"}
          <Alarm title="Подключение через {remainingTimeout} сек." />
        {:else}
          <Route path="/">
            <DashboardPage show={pageReady.dash} layoutJson={layoutJson} pages={pages} wsPush={(ws, topic, status) => wsManager.wsPush(ws, topic, status)} />
          </Route>
          <Route path="/config">
            <ConfigPage show={pageReady.config} bind:configJson bind:scenarioTxt {widgetsJson} {itemsJson} saveConfig={() => { wsManager.configJson = configJson; wsManager.scenarioTxt = scenarioTxt; wsManager.saveConfig(); }} cleanLogs={() => wsManager.cleanLogs()} rebootEsp={() => wsManager.rebootEsp()} moduleOrder={(id, key, value) => wsManager.moduleOrder(id, key, value)} userdata={wsManager.userdata} />
          </Route>
          <Route path="/connection">
            <ConnectionPage show={pageReady.connection} rebootEsp={() => wsManager.rebootEsp()} ssidClick={() => wsManager.ssidClick()} saveSett={() => { wsManager.settingsJson = settingsJson; wsManager.saveSett(); }} saveMqtt={() => { wsManager.settingsJson = settingsJson; wsManager.saveMqtt(); }} {settingsJson} {errorsJson} {ssidJson} />
          </Route>
          <Route path="/list">
            <ListPage show={pageReady.list} deviceList={deviceList} settingsJson={wsManager.settingsJson} saveSett={() => wsManager.saveSett()} rebootEsp={() => wsManager.rebootEsp()} showInput={showInput} addDevInList={() => wsManager.addDevInList()} newDevice={wsManager.newDevice} sendToAllDevices={(msg) => wsManager.sendToAllDevices(msg)} saveList={() => wsManager.saveList()} {percent} devListOverride={() => wsManager.devListOverride()} applicationReboot={() => wsManager.applicationReboot()} />
          </Route>
          <Route path="/system">
            <SystemPage show={pageReady.system} errorsJson={wsManager.errorsJson} settingsJson={wsManager.settingsJson} saveSett={() => wsManager.saveSett()} rebootEsp={() => wsManager.rebootEsp()} cleanLogs={() => wsManager.cleanLogs()} cancelAlarm={(alarmKey) => wsManager.cancelAlarm(alarmKey)} versionsList={versionsList} bind:choosingVersion coreMessages={wsManager.coreMessages} />
          </Route>

          <Route path="/profile">
            <Profile show={pageReady.profile} flashProfileJson={wsManager.flashProfileJson} userdata={wsManager.userdata} updateBuild={(path) => wsManager.updateBuild(path)} allmodeinfo={wsManager.allmodeinfo} profile={wsManager.profile} serverOnline={wsManager.serverOnline} otaJson={wsManager.otaJson} />
          </Route>
          <Route path="/login">
            <Login show={true} serverOnline={wsManager.serverOnline} />
          </Route>
        {/if}
      </div>
    </ul>
  </main>

  <AppFooter />
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
      @apply flex min-h-[2.25rem] mb-4 items-center;
    }
    .wgt-dscr-stl {
      @apply pr-4 text-gray-500 font-bold;
    }
    /*====================================================others=====================================================*/
    .btn-i {
      @apply py-2 px-4 bg-blue-100 hover:bg-blue-200 text-gray-700 font-semibold rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
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
