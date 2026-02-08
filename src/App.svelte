<script>
  /*
   Svelte IoT Manager app
   created by Dmitry Borisenko
   Vienna, Austria 1030, Juchgasse 5/17
   +43 67761588253
  */

  //6+49 кб 09/06/2023
  //6+51 кб 02/09/2023
  //6+64 кб 02/10/2023 + axios
  //6+53 кб 03/10/2023 + fetch

  //******************************************************import section*********************************************************/
  //*****************************************************************************************************************************/
  import { onMount } from "svelte";
  import { Route, router, active } from "tinro";
  router.mode.hash();

  import Alarm from "./components/Alarm.svelte";
  import Progress from "./components/Progress.svelte";
  //import Card from "./components/Card.svelte";

  //import ModalPass from "./components/ModalPass.svelte";
  import DashboardPage from "./pages/Dashboard.svelte";
  import ConfigPage from "./pages/Config.svelte";
  import ConnectionPage from "./pages/Connection.svelte";
  import ListPage from "./pages/List.svelte";
  import SystemPage from "./pages/System.svelte";
  import Login from "./pages/Login.svelte";
  import Profile from "./pages/Profile.svelte";
  import { t, locale, locales } from "./i18n";
  import Cookies from "js-cookie";

  //import UtilitiesPage from "./pages/Utilities.svelte";
  //import LogPage from "./pages/Log.svelte";
  //import AboutPage from "./pages/About.svelte";

  import * as portal from "./api/portal.js";
  import * as firmware from "./api/firmware.js";
  import * as deviceSocket from "./api/deviceSocket.js";
  import * as deviceConnection from "./lib/deviceConnection.js";
  import * as deviceListManager from "./lib/deviceListManager.js";
  import * as blobProtocol from "./lib/blobProtocol.js";
  import * as wsReconnect from "./lib/wsReconnect.js";
  import AppHeader from "./components/layout/AppHeader.svelte";
  import AppNav from "./components/layout/AppNav.svelte";
  import AppFooter from "./components/layout/AppFooter.svelte";

  //****************************************************constants section*********************************************************/
  //******************************************************************************************************************************/
  const debug = true;
  const LOG_MAX_MESSAGES = 100;
  let reconnectTimeout = 60; //период проверки соединения с устройством
  let remainingTimeout = reconnectTimeout;
  let preventReconnect = false;
  const waitingAckTimeout = 18000; //время ожидания ответа от устройства
  let rebootOrUpdateProcess = false;
  let rebootTimer;
  let opened = true;
  let preventMove = false;
  let screenSize;
  const blobDebug = false;
  const devMode = true;

  let percent;

  //****************************************************variable section**********************************************************/
  //******************************************************************************************************************************/
  let myip = document.location.hostname;
  if (devMode) myip = "127.0.0.1";

  //Flags
  let firstDevListRequest = true;
  let showInput = false;
  let authorization = false;
  let showDropdown = true;

  let showAwaitingCircle = false;

  //dashboard
  let pages = [];

  //ready
  let pageReady = {
    dash: false,
    config: false,
    connection: false,
    list: false,
    system: false,
    dev: false,
  };

  //update esp
  let versionsList = {};
  let choosingVersion = undefined;

  //JSON Files====================================
  let itemsJson = [];
  let widgetsJson = [];
  let configJson = [];
  let scenarioTxt = " ";
  let settingsJson = {};
  let ssidJson = {};
  let errorsJson = {};
  let flashProfileJson = {};
  let otaJson = {};
  let deviceList = [];
  deviceList = [
    {
      name: "--",
      id: "--",
      ip: myip,
      ws: 0,
      status: false,
    },
  ];

  // ack state lives in wsReconnect.createAck

  let incDeviceList = [];
  let layoutJson = [];
  let paramsJson = {};

  let userdata = null;
  let allmodeinfo = null;
  let profile = null;

  let serverOnline = false;

  let parsed = {
    itemsJson: false,
    widgetsJson: false,
    configJson: false,
    scenarioTxt: false,
    settingsJson: false,
    ssidJson: false,
    incDeviceList: false,
    deviceListJson: false,
    errorsJson: false,
    statusJson: false,
    paramsJson: false,
    flashProfileJson: false,
    otaJson: false,
  };

  //===============================================

  // web sockets: pool in api/deviceSocket.js
  let socketConnected = false;
  let selectedDeviceData = undefined;
  let selectedWs = 0;
  let originalWs = 0;

  let newDevice = {};
  let coreMessages = [];

  //***********************************************************navigation********************************************************/
  let currentPageName = undefined;

  router.subscribe(handleNavigation);

  function handleNavigation() {
    currentPageName = $router.path.toString();
    currentPageName = currentPageName + "|";

    console.log("[i]", "user on page:", currentPageName);

    clearData();

    //если мы на странице dashboard то рассылаем всем устройствам запрос данных
    if (currentPageName === "/|") {
      sendToAllDevices(currentPageName);
      showDropdown = false;
      //в остальных случаях шлем только выбранному устройству запрос данных
    } else {
      if (currentPageName === "/list|") {
        //если мы перешли на страницу списка устройств отключаем выпадающий список
        showDropdown = false;
      } else {
        showDropdown = true;
      }
      //если мы на любой другой странице то запрашиваем данные
      sendCurrentPageNameToSelectedWs();
    }
  }

  function sendCurrentPageNameToSelectedWs() {
    if (selectedWs !== undefined) {
      wsSendMsg(selectedWs, currentPageName);
    }
  }

  //*******************************************************initialisation********************************************************************/
  onMount(async () => {
    console.log("[i]", "mounted");
    await getUser();
    onCheck();
    opened = screenSize > 900 ? true : false;
    selectedDeviceDataRefresh();
    //флаг первого запроса списка устройств
    firstDevListRequest = true;
    //вначале подключимся к известному нам ip этого устройства
    connectToAllDevices();
    wsTestMsgTask();
    //sortingLayout();
  });

  const getUser = async () => {
    const JWT = Cookies.get("token_iotm2");
    const res = await portal.getUser(JWT);
    if (res.ok) {
      userdata = res.userdata;
      serverOnline = true;
    } else {
      if (!res.serverOnline) serverOnline = false;
      else {
        console.log("error", "getUser");
        serverOnline = true;
      }
    }
  };

  //****************************************************web sockets section******************************************************/
  function getIP(ws) {
    return deviceConnection.getIP(ws, deviceList);
  }

  function wsSendMsg(ws, msg) {
    if (deviceSocket.send(ws, msg)) {
      if (debug) console.log("[i]", getIP(ws), ws, "msg send success", msg);
    } else {
      if (debug) console.log("[e]", getIP(ws), ws, "msg not send");
    }
  }

  const openHandler = () =>
    deviceConnection.createOpenHandler({
      markDeviceStatus,
      sendMsg: wsSendMsg,
      firstDevListRequest,
      currentPageName,
      selectedWs,
      sendCurrentPageNameToSelectedWs,
    });

  function messageHandler(ws, data) {
    if (typeof data === "string") {
      if (data === "/tstr|") ack(ws, true);
      return;
    }
    if (data instanceof Blob) {
      if (ws === selectedWs) parseBlob(data, ws);
      if (currentPageName === "/|") parseAllBlob(data, ws);
    }
  }

  function createConnection(wsIndex, ip) {
    if (ip === "error") {
      if (debug) console.log("[e]", "device list wrong");
      return;
    }
    if (debug) console.log("[i]", ip, wsIndex, "started connecting...");
    deviceSocket.createConnection(wsIndex, ip, {
      onOpen: (ws) => openHandler()(ws),
      onMessage: messageHandler,
      onClose: (ws) => markDeviceStatus(ws, false),
      onError: (ws) => markDeviceStatus(ws, false),
    });
  }

  function connectToAllDevices() {
    deviceConnection.connectToAllDevices(deviceList, getSelectedDeviceData, selectedWs, createConnection);
  }

  function printAllCreatedWs() {
    if (debug) console.log("[i]", "[ws]", "device count:", deviceList.length);
  }

  function markDeviceStatus(ws, status) {
    deviceList.forEach((device) => {
      if (device.ws === ws) {
        device.status = status;
        device.ping = 0;
        if (device.status === true) {
          console.log("[i]", device.ip, ws, "status online");
        } else {
          console.log("[i]", device.ip, ws, "status offline");
          deleteWidget(ws);
          sortingLayout(ws);
        }
      }
    });
    selectedDeviceDataRefresh();
    deviceList = deviceList;
  }

  function deleteWidget(ws) {
    layoutJson = layoutJson.filter((item) => item.ws !== ws);
  }

  const blobHandlers = {
    setItemsJson: (v) => (itemsJson = v),
    setParsedItemsJson: (v) => (parsed.itemsJson = v),
    setWidgetsJson: (v) => (widgetsJson = v),
    setParsedWidgetsJson: (v) => (parsed.widgetsJson = v),
    setConfigJson: (v) => (configJson = v),
    setParsedConfigJson: (v) => (parsed.configJson = v),
    setScenarioTxt: (v) => (scenarioTxt = v),
    setSettingsJson: (v) => (settingsJson = v),
    setParsedSettingsJson: (v) => (parsed.settingsJson = v),
    setSsidJson: (v) => (ssidJson = v),
    setParsedSsidJson: (v) => (parsed.ssidJson = v),
    setErrorsJson: (v) => (errorsJson = v),
    setParsedErrorsJson: (v) => (parsed.errorsJson = v),
    setParsedIncDeviceList: (v) => (parsed.incDeviceList = v),
    onDevlis: async (json) => {
      incDeviceList = json;
      deviceConnection.handleDevListReceived(incDeviceList, deviceList, firstDevListRequest, {
        setDeviceList: (list) => (deviceList = list),
        setFirstDevListRequest: (v) => (firstDevListRequest = v),
        setParsedDeviceListJson: (v) => (parsed.deviceListJson = v),
        onParced,
        selectedDeviceDataRefresh,
        connectToAllDevices,
      });
    },
    setFlashProfileJson: (v) => (flashProfileJson = v),
    setParsedFlashProfileJson: (v) => (parsed.flashProfileJson = v),
    setOtaJson: (v) => (otaJson = v),
    setParsedOtaJson: (v) => (parsed.otaJson = v),
    addCoreMsg: (msg) => addCoreMsg(msg),
    onParced: () => onParced(),
  };

  async function parseBlob(blob, ws) {
    await blobProtocol.parseBlob(blob, ws, blobHandlers);
  }

  const allBlobHandlers = {
    updateWidget: (v) => updateWidget(v),
    combineLayoutsInOne: (ws, layout) => combineLayoutsInOne(ws, layout),
    mergeParams: (devParams) => {
      paramsJson = { ...paramsJson, ...devParams };
      paramsJson = paramsJson;
    },
    updateAllStatuses: (ws) => updateAllStatuses(ws),
    onParced: () => onParced(),
    apdateWidgetByArray: (v) => apdateWidgetByArray(v),
  };

  async function parseAllBlob(blob, ws) {
    await blobProtocol.parseAllBlob(blob, ws, allBlobHandlers);
  }

  async function onParced() {
    if (currentPageName === "/|") {
      pageReady.dash = true;
    }

    if (currentPageName === "/config|" && parsed.itemsJson && parsed.widgetsJson && parsed.configJson && parsed.settingsJson) {
      clearParcedFlags();
      pageReady.config = true;
      if (debug) console.log("✔✔", "config page parced");
    }

    //&& parsed.widgetsJson && parsed.configJson - добавить когда 451 прошивка уйдет в прошлое
    if (currentPageName === "/connection|" && parsed.ssidJson && parsed.settingsJson && parsed.errorsJson) {
      clearParcedFlags();
      if (debug) console.log("✔✔", "connection page parced");
      pageReady.connection = true;
    }

    if (currentPageName === "/list|" && parsed.settingsJson) {
      clearParcedFlags();
      if (debug) console.log("✔✔", "list page parced");
      pageReady.list = true;
    }

    if (currentPageName === "/system|" && parsed.errorsJson && parsed.settingsJson) {
      clearParcedFlags();
      getVersionsList();
      if (debug) console.log("✔✔", "system page parced");
      pageReady.system = true;
    }

    //&& parsed.otaJson
    if (currentPageName === "/profile|" && parsed.flashProfileJson) {
      clearParcedFlags();
      if (debug) console.log("✔✔", "profile page parced");
      pageReady.profile = true;
      await getModInfo();
      await getProfile();
    }
  }

  const getModInfo = async () => {
    const res = await portal.getModInfo();
    if (res.ok) allmodeinfo = res.allmodeinfo;
    else console.log("error", "getModInfo");
  };

  const getProfile = async () => {
    const JWT = Cookies.get("token_iotm2");
    const res = await portal.getProfile(JWT);
    if (res.ok) {
      profile = res.profile;
      await markProfileAsPerThisDevProfile();
    } else console.log("error", "getProfile");
  };

  const markProfileAsPerThisDevProfile = async () => {
    profile.projectProp.platformio.default_envs = flashProfileJson.projectProp.platformio.default_envs;
    for (const [compilerCategory, compilerCategoryModules] of Object.entries(profile.modules)) {
      let devCategoryModules = flashProfileJson.modules[compilerCategory];
      compilerCategoryModules.forEach((compilerModule) => {
        compilerModule.active = false;
        if (devCategoryModules) {
          devCategoryModules.forEach((devModule) => {
            if (devModule.path === compilerModule.path) {
              compilerModule.active = devModule.active;
            }
          });
        }
      });
    }
  };

  function devListOverride() {
    deviceList = deviceListManager.devListOverride(incDeviceList);
    console.log("[i]", "[devlist]", "devlist overrided");
  }

  function devListCombine() {
    deviceList = deviceListManager.devListCombine(deviceList, incDeviceList);
    console.log("[i]", "[devlist]", "devlist combined");
  }

  function combineArrays(A, B) {
    return deviceListManager.combineArrays(A, B);
  }

  //***********************************************************dashboard***************************************************************/

  //слияние layout-ов всех устройств в общий layout
  async function combineLayoutsInOne(ws, devLayout) {
    for (let i = 0; i < devLayout.length; i++) {
      devLayout[i].ws = ws;
    }
    layoutJson = layoutJson.concat(devLayout);
    console.log("[2]", ws, "devLayout pushed to layout");
    sortingLayout(ws);
  }

  function sortingLayout(ws) {
    //сортируем весь layout по алфавиту
    layoutJson.sort(function (a, b) {
      if (a.descr < b.descr) {
        return -1;
      }
      if (a.descr > b.descr) {
        return 1;
      }
      return 0;
    });
    //формируем json всех карточек
    pages = [];
    const newPage = Array.from(new Set(Array.from(layoutJson, ({ page }) => page)));
    newPage.forEach(function (item, i, arr) {
      pages = [
        ...pages,
        JSON.parse(
          JSON.stringify({
            page: item,
          })
        ),
      ];
    });
    //сортируем карточки по алфавиту
    pages.sort(function (a, b) {
      if (a.page < b.page) {
        return -1;
      }
      if (a.page > b.page) {
        return 1;
      }
      return 0;
    });

    layoutJson = layoutJson;
    console.log("[3]", ws, "layout sort, requested params...");
    wsSendMsg(ws, "/params|");
  }

  function updateAllStatuses(ws) {
    for (const [key, value] of Object.entries(paramsJson)) {
      for (let i = 0; i < layoutJson.length; i++) {
        let topic = layoutJson[i].topic;
        if (topic) {
          //layoutJson[i].ws = ws;
          topic = topic.substring(topic.lastIndexOf("/") + 1, topic.length);
          if (key === topic) {
            console.log("[i]", "updated =>" + topic, value);
            layoutJson[i].status = value;
            break;
          }
        }
      }
    }
    wsSendMsg(ws, "/charts|");
  }

  //обработка интервально прилетающих статусов
  function updateWidget(newStatusJson) {
    for (let i = 0; i < layoutJson.length; i++) {
      let topic = layoutJson[i].topic;
      if (topic === newStatusJson.topic) {
        layoutJson[i] = jsonConcat(layoutJson[i], newStatusJson);
        //получен ответ - выключаем красный цвет
        layoutJson[i].sent = false;
        break;
      }
    }
  }

  //если статус виджета это массив и его нужно накопить
  //должна вызываться когда весь layout в сборе
  async function apdateWidgetByArray(newStatusJson) {
    console.log("[i]", "collecting arrays");
    let error = true;
    if (layoutJson.length > 0) {
      for (let i = 0; i < layoutJson.length; i++) {
        let topic = layoutJson[i].topic;
        if (topic === newStatusJson.topic) {
          error = false;
          layoutJson[i] = jsonConcatEx(layoutJson[i], newStatusJson);
          let prevArr = layoutJson[i].status; //который был в layout
          let newArr = newStatusJson.status; //тот что получили
          if (prevArr) {
            //если что то было в layout то делаем слияние
            prevArr = [...prevArr, ...newArr];
            layoutJson[i].status = prevArr;
          } else {
            //если ничего не было то просто запишем новый
            layoutJson[i].status = newArr;
          }
          //получен ответ - выключаем красный цвет
          layoutJson[i].sent = false;
        }
      }
    } else {
      console.log("[E]", "layoutJson missing");
    }
    if (error) console.log("[E]", "topic not found ", newStatusJson.topic);
  }

  function jsonConcat(o1, o2) {
    for (var key in o2) {
      o1[key] = o2[key];
    }
    return o1;
  }

  //объединяем исклчая статус так как статус в данном случае накопительная переменная
  function jsonConcatEx(o1, o2) {
    for (var key in o2) {
      if (key !== "status") {
        o1[key] = o2[key];
      }
    }
    return o1;
  }

  function saveConfig() {
    wsSendMsg(selectedWs, "/tuoyal|" + JSON.stringify(generateLayout()));
    modify();
    wsSendMsg(selectedWs, "/gifnoc|" + JSON.stringify(configJson));

    wsSendMsg(selectedWs, "/oiranecs|" + scenarioTxt);
    clearData();
    sendCurrentPageNameToSelectedWs();
  }

  function saveSett() {
    var size = Object.keys(settingsJson).length;
    console.log("[i]", "settingsJson length: " + size);
    if (size > 5) {
      jsonArrWrite(deviceList, "ip", getIP(selectedWs), "name", settingsJson.name);
      deviceList = deviceList;
      wsSendMsg(selectedWs, "/sgnittes|" + JSON.stringify(settingsJson));
    } else {
      window.alert("Ошибка размера settingsJson (возможно не был передан странице)");
    }
    clearData();
    sendCurrentPageNameToSelectedWs();
  }

  function saveList() {
    //при сохранении списка в память необходимо удалить все статусы
    let devListForSave = Object.assign([], deviceList);
    for (let i = 0; i < devListForSave.length; i++) {
      //delete devListForSave[i].status;
      devListForSave[i].status = false;
    }
    wsSendMsg(selectedWs, "/tsil|" + JSON.stringify(devListForSave));
  }

  function cleanLogs() {
    wsSendMsg(selectedWs, "/clean|");
  }

  function saveMqtt() {
    var size = Object.keys(settingsJson).length;
    wsSendMsg(selectedWs, "/tuoyal|" + JSON.stringify(generateLayout()));
    if (size > 5) {
      wsSendMsg(selectedWs, "/sgnittes|" + JSON.stringify(settingsJson));
    } else {
      window.alert("Ошибка");
    }
    clearData();
    wsSendMsg(selectedWs, "/mqtt|");
  }

  function getInput() {
    let input = {
      name: "inputDate",
      //descr: "Выберите дату",
      widget: "input",
      size: "small",
      color: "orange",
      type: "date",
    };
    return input;
  }

  function modify() {
    for (let i = 0; i < configJson.length; i++) {
      let config = configJson[i];
      delete config["show"];
    }
  }

  //по конфигу делаем виджеты
  function generateLayout() {
    let layout = [];
    for (let i = 0; i < configJson.length; i++) {
      let config = Object.assign({}, configJson[i]);
      let setWidget = config.widget;
      let error = true;
      for (let w = 0; w < widgetsJson.length; w++) {
        if (setWidget === widgetsJson[w].name) {
          let widget = Object.assign({}, widgetsJson[w]);
          widget.page = config.page;
          widget.descr = config.descr;
          widget.topic = settingsJson.mqttPrefix + "/" + settingsJson.id + "/" + config.id;
          if (setWidget !== "nil") layout.push(widget);
          //создаем графики с окнами ввода
          if (widget.widget === "chart" && widget.type !== "bar") {
            let input = getInput();
            input.page = config.page;
            input.topic = settingsJson.mqttPrefix + "/" + settingsJson.id + "/" + config.id + "-date";
            input.descr = config.descr;
            //console.log("[i]", "topic ", widget.topic);
            layout.push(input);
          }
          error = false;
          break;
        } else {
          error = true;
        }
      }
      if (error) console.log("[E]", "error, widget not found: " + setWidget);
    }

    //сортируем весь layout по алфавиту
    layout.sort(function (a, b) {
      if (a.descr < b.descr) {
        return -1;
      }
      if (a.descr > b.descr) {
        return 1;
      }
      return 0;
    });

    for (let i = 0; i < layout.length; i++) {
      layout[i].order = i;
    }

    return layout;
  }

  function clearData() {
    itemsJson = [];
    widgetsJson = [];
    configJson = [];
    scenarioTxt = " ";
    settingsJson = {};
    //ssidJson = {};
    errorsJson = {};
    layoutJson = [];
    paramsJson = {};
    otaJson = {};
    flashProfileJson = {};

    //incDeviceList = [];

    for (const [key, value] of Object.entries(pageReady)) {
      pageReady[key] = false;
    }

    clearParcedFlags();

    if (debug) console.log("[i]", "all json files cleared");
  }

  function clearParcedFlags() {
    console.log("[i]", "parced flags cleared");
    for (const [key, value] of Object.entries(parsed)) {
      parsed[key] = false;
    }
  }

  function wsPush(ws, topic, status) {
    let msg = topic + " " + status;
    if (debug) console.log("[i]", "ws: ", ws, msg);
    //layoutJson = layoutJson;
    let key = topic.substring(topic.lastIndexOf("/") + 1, topic.length);
    wsSendMsg(ws, "/control|" + key + "/" + status);
  }

  const ack = wsReconnect.createAck({
    markDeviceStatus,
    getDeviceList: () => deviceList,
    setDeviceList: (list) => (deviceList = list),
    waitingAckTimeout,
  });

  const wsTestMsgTask = wsReconnect.createWsTestMsgTask({
    getDeviceList: () => deviceList,
    send: wsSendMsg,
    markDeviceStatus,
    connectDevice: (ws) => createConnection(ws, getIP(ws)),
    ack,
    getRemainingTimeout: () => remainingTimeout,
    setRemainingTimeout: (v) => (remainingTimeout = v),
    reconnectTimeout,
    getPreventReconnect: () => preventReconnect,
    setPercent: (v) => (percent = v),
    getRebootOrUpdateProcess: () => rebootOrUpdateProcess,
    setRebootOrUpdateProcess: (v) => (rebootOrUpdateProcess = v),
    getSocketConnected: () => socketConnected,
    setShowAwaitingCircle: (v) => (showAwaitingCircle = v),
    setReconnectTimeout: (v) => (reconnectTimeout = v),
    printAllCreatedWs,
  });

  function sendToAllDevices(msg) {
    deviceList.forEach((device) => {
      if (device.status === true) {
        wsSendMsg(device.ws, msg);
      }
    });
  }

  //***********************************************************logging******************************************************************/
  const addCoreMsg = (msg) => {
    if (coreMessages.length >= LOG_MAX_MESSAGES) {
      coreMessages.shift();
    }
    //const time = new Date().getTime();
    coreMessages = [
      ...coreMessages,
      {
        msg,
      },
    ];
    coreMessages.sort(function (a, b) {
      if (a.time > b.time) {
        return -1;
      }
      if (a.time < b.time) {
        return 1;
      }
      return 0;
    });
  };

  //***********************************************************dev list******************************************************************/

  //всякий раз когда список устройств был обновлен
  function selectedDeviceDataRefresh() {
    //запишем в переменную selectedDeviceData выбранное устройство, что бы в коде было известно выбранное устройство
    getSelectedDeviceData(selectedWs);
    socketConnected = selectedDeviceData.status;
  }

  function devicesDropdownChange() {
    if (currentPageName === "/list|") {
      console.log("[i]", "user change dropdown on list page!!!");
    } else {
      selectedDeviceDataRefresh();
      clearData();
      //запускаем навигацию что дать контроллеру запрос данных
      handleNavigation();
      if (debug) console.log("[i]", "user selected device:", selectedDeviceData.name);
      if (selectedDeviceData.ip === myip) {
        originalWs = selectedWs;
        if (debug) console.log("[i]", "user selected original device", selectedDeviceData.name);
      }
    }
  }

  //функция которая записывает в переменную данные выбранного юзером устройства
  function getSelectedDeviceData(ws) {
    for (let i = 0; i < deviceList.length; i++) {
      let device = deviceList[i];
      if (device.ws === ws) {
        selectedDeviceData = device;
        break;
      }
    }
  }

  function addDevInList() {
    if (!showInput) {
      if (newDevice.name !== undefined && newDevice.ip !== undefined && newDevice.id !== undefined) {
        newDevice.status = false;
        newDevice.ws = deviceList.length;
        incDeviceList.push(newDevice);
        devListCombine();
        //onParced();
        //selectedDeviceDataRefresh();
        connectToAllDevices();
        if (debug) console.log("[i]", "selected device: ", selectedDeviceData);
        return true;
      } else {
        if (debug) console.log("[e]", "wrong data");
        return false;
      }
    }
  }

  function jsonArrWrite(jsonArr, idKey, idValue, paramKey, paramValue) {
    for (let i = 0; i < jsonArr.length; i++) {
      let obj = jsonArr[i];
      for (const [key, value] of Object.entries(obj)) {
        if (key == idKey && value == idValue) {
          obj[paramKey] = paramValue;
          break;
        }
      }
    }
  }

  //**********************************************************modal*************************************************************************/
  function onCheck() {
    if (screenSize < 900) {
      preventMove = true;
    } else {
      preventMove = false;
    }
  }

  //************************************************elements and presets dropdown************************************************************/

  function ssidClick() {
    wsSendMsg(selectedWs, "/scan|");
  }

  function rebootEsp() {
    rebootOrUpdateProcess = true;
    if (debug) console.log("[i]", "reboot...");
    wsSendMsg(selectedWs, "/reboot|");
    markDeviceStatus(selectedWs, false);
    showAwaitingCircle = true;
    socketConnected = false;
    reconnectTimeout = 10;
    remainingTimeout = reconnectTimeout;
  }

  function updateBuild(path) {
    rebootOrUpdateProcess = true;
    console.log(path);
    wsSendMsg(selectedWs, "/update|" + path);
    showAwaitingCircle = true;
    socketConnected = false;
    reconnectTimeout = 20;
    remainingTimeout = reconnectTimeout;
  }

  function applicationReboot() {
    console.log("[i]", "reboot svelte...");
    for (const [key, value] of Object.entries(pageReady)) {
      pageReady[key] = false;
    }
    showAwaitingCircle = true;
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  function cancelAlarm(alarmKey) {
    console.log("[x]", alarmKey);
    errorsJson[alarmKey] = 0;
    wsSendMsg(selectedWs, '/rorre|{"' + alarmKey + '":0}');
  }

  //************************************************update esp firm************************************************************//

  async function getVersionsList() {
    versionsList = {};
    const res = await firmware.getVersionsList(settingsJson.serverip);
    if (res.ok && res.data) {
      versionsList = res.data[errorsJson.bn];
      choosingVersion = errorsJson.bver;
      console.log(JSON.stringify(versionsList));
    } else {
      choosingVersion = undefined;
      if (settingsJson.serverip) console.log("error, versions list not received");
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
    wsSendMsg(selectedWs, "/order|" + JSON.stringify(json));
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

  <AppHeader
    {deviceList}
    bind:selectedWs
    {showDropdown}
    {socketConnected}
    {devicesDropdownChange}
  />
  <AppNav bind:opened onCheck={() => onCheck()} {userdata} />

  <main class="flex-1 overflow-y-auto p-0 {opened === true && !preventMove ? 'ml-36' : 'ml-0'}">
    <ul class="menu__main">
      <div class="bg-cover pt-0 px-4">
        {#if !socketConnected && currentPageName != "/|"}
          <Alarm title="Подключение через {remainingTimeout} сек." />
        {:else}
          <Route path="/">
            <DashboardPage show={pageReady.dash} layoutJson={layoutJson} pages={pages} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
          </Route>
          <Route path="/config">
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
