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

  import CloudIcon from "./svg/Cloud.svelte";

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
  const devMode = false;

  let percent;

  //****************************************************variable section**********************************************************/
  //******************************************************************************************************************************/
  let myip = document.location.hostname;
  if (devMode) myip = "192.168.1.235";

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

  var ackTimeoutsArr = [];
  var startMillis = [];
  var ping = [];

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

  //web sockets
  let socket = [];
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
        userdata = await res.json();
        serverOnline = true;
      } else {
        console.log("error", res.statusText);
        serverOnline = true;
      }
    } catch (e) {
      console.log("error", e);
      serverOnline = false;
    }
  };

  //****************************************************web sockets section******************************************************/
  function connectToAllDevices() {
    getSelectedDeviceData(selectedWs);
    for (let i = 0; i < deviceList.length; i++) {
      deviceList[i].ws = i;
      if (deviceList[i].status === false || deviceList[i].status === undefined) {
        wsConnect(i);
        wsEventAdd(i);
      }
    }
  }

  function printAllCreatedWs() {
    if (socket) {
      for (let i = 0; i < socket.length; i++) {
        if (debug) console.log("[i]", "[ws]", "WebSocket client No: ", i);
      }
    }
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

  function wsConnect(ws) {
    let ip = getIP(ws);
    if (ip === "error") {
      if (debug) console.log("[e]", "device list wrong");
    } else {
      socket[ws] = new WebSocket("ws://" + ip + ":81");
      socket.binaryType = "blob";
      if (debug) console.log("[i]", ip, ws, "started connecting...");
    }
  }

  function getIP(ws) {
    let ret = "error";
    deviceList.forEach((device) => {
      if (ws === device.ws) {
        ret = device.ip;
      }
    });
    return ret;
  }

  function wsEventAdd(ws) {
    if (socket[ws]) {
      let ip = getIP(ws);
      socket[ws].addEventListener("open", function (event) {
        //if (debug) console.log("[i]", ip, ws, "completed connecting");

        markDeviceStatus(ws, true);
        //при первом подключении запросим список устройств
        if (firstDevListRequest && ws === 0) wsSendMsg(ws, "/devlist|");
        //при подключении отправляем название страницы
        if (currentPageName === "/|") {
          //всем устройствам
          wsSendMsg(ws, currentPageName);
        } else {
          //только выбранному
          if (ws === selectedWs) {
            sendCurrentPageNameToSelectedWs();
          }
        }
      });

      //события веб сокетов
      socket[ws].addEventListener("message", function (event) {
        if (typeof event.data === "string") {
          let data = event.data;
          if (data === "/tstr|") {
            //прилетело подтверждение значит устройство онлайн

            ack(ws, true);
          }
        }
        if (event.data instanceof Blob) {
          //принимаем данные только для выбранного устройства
          if (ws === selectedWs) {
            parseBlob(event.data, ws);
          }
          //собираем данные со всех устройств только в случае если пользователь на dashboard
          if (currentPageName === "/|") {
            parseAllBlob(event.data, ws);
          }
        }
      });
      socket[ws].addEventListener("close", (event) => {
        if (debug) console.log("[e]", ip, "connection closed");
        //socket[ws].close();
        markDeviceStatus(ws, false);
      });
      socket[ws].addEventListener("error", function (event) {
        if (debug) console.log("[e]", ip, "connection error");
        //socket[ws].close();
        markDeviceStatus(ws, false);
      });
    } else {
      if (debug) console.log("[e]", "socket not exist");
    }
  }

  async function parseBlob(blob, ws) {
    //получаем заголовок
    var blobHeader = blob.slice(0, 6);
    let header = await blobHeader.text();
    //console.log("header: ", header);
    //получаем размер
    var blobSize = blob.slice(7, 11);
    let size = await blobSize.text();
    //console.log("size: ", size);

    if (header === "itemsj") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        itemsJson = out.json;
        parsed.itemsJson = true;
        if (blobDebug) console.log("[✔]", "itemsJson: ", itemsJson);
      } else {
        parsed.itemsJson = false;
        if (blobDebug) console.log("[e]", "itemsJson parse error");
      }
    }
    if (header === "widget") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        widgetsJson = out.json;
        parsed.widgetsJson = true;
        if (blobDebug) console.log("[✔]", "widgetsJson: ", widgetsJson);
      } else {
        parsed.widgetsJson = false;
        if (blobDebug) console.log("[e]", "widgetsJson parse error");
      }
    }
    if (header === "config") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        configJson = out.json;
        parsed.configJson = true;
        if (blobDebug) console.log("[✔]", "configJson: ", configJson);
      } else {
        parsed.configJson = false;
        if (blobDebug) console.log("[e]", "configJson parse error");
      }
    }
    if (header === "scenar") {
      scenarioTxt = await getPayloadAsTxt(blob, size);
      if (blobDebug) console.log("[i]", "scenarioTxt: ", scenarioTxt);
    }
    if (header === "settin") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        settingsJson = out.json;
        parsed.settingsJson = true;
        if (blobDebug) console.log("[✔]", "settingsJson: ", settingsJson);
      } else {
        parsed.settingsJson = false;
        if (blobDebug) console.log("[e]", "settingsJson parse error");
      }
    }
    if (header === "ssidli") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        ssidJson = out.json;
        parsed.ssidJson = true;
        if (blobDebug) console.log("[✔]", "ssidJson: ", ssidJson);
      } else {
        parsed.ssidJson = false;
        if (blobDebug) console.log("[e]", "ssidJson parse error");
      }
    }
    //прием данных об ошибках
    if (header === "errors") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        errorsJson = out.json;
        parsed.errorsJson = true;
        if (blobDebug) console.log("[✔]", "errorsJson: ", errorsJson);
      } else {
        parsed.errorsJson = false;
        if (blobDebug) console.log("[e]", "errorsJson parse error");
      }
    }
    //приход списка устройств
    if (header === "devlis") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        incDeviceList = [];
        incDeviceList = out.json;
        parsed.incDeviceList = true;
        if (blobDebug) console.log("[✔]", "incDeviceList: ", incDeviceList);
        await initDevList();
      } else {
        parsed.incDeviceList = false;
        if (blobDebug) console.log("[e]", "incDeviceList parse error");
      }
    }
    //приход профиля
    if (header === "prfile") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        flashProfileJson = out.json;
        parsed.flashProfileJson = true;
        if (blobDebug) console.log("[✔]", "flashProfileJson: ", flashProfileJson);
      } else {
        parsed.flashProfileJson = false;
        if (blobDebug) console.log("[e]", "flashProfileJson parse error");
      }
    }

    if (header === "otaupd") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        otaJson = out.json;
        parsed.otaJson = true;
        if (blobDebug) console.log("[✔]", "otaJson: ", otaJson);
      } else {
        parsed.otaJson = false;
        if (blobDebug) console.log("[e]", "otaJson parse error");
      }
    }

    if (header === "corelg") {
      let txt = await getPayloadAsTxt(blob, size);
      //console.log("[--]", ws, txt);
      addCoreMsg(txt);
    }

    await onParced();
  }

  async function parseAllBlob(blob, ws) {
    //получаем заголовок
    var blobHeader = blob.slice(0, 6);
    let header = await blobHeader.text();
    //console.log("header: ", header);
    //получаем размер
    var blobSize = blob.slice(7, 11);
    let size = await blobSize.text();
    //console.log("size: ", size);

    if (header === "status") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        let statusJson = out.json;
        updateWidget(statusJson);
        //if (blobDebug)
        console.log("[✔]", "statusJson: ", statusJson);
      } else {
        if (blobDebug) console.log("[e]", "statusJson parse error");
      }
    }
    if (header === "layout") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        let devLayout = out.json;
        combineLayoutsInOne(ws, devLayout);
        if (blobDebug) console.log("[✔]", "devLayout: ", devLayout);
      } else {
        if (blobDebug) console.log("[e]", "devLayout parse error");
      }
    }
    if (header === "params") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        let devParams = out.json;
        paramsJson = {
          ...paramsJson,
          ...devParams,
        };
        paramsJson = paramsJson;
        updateAllStatuses(ws);
        onParced();
        if (blobDebug) console.log("[✔]", "devParams: ", devParams);
      } else {
        if (blobDebug) console.log("[e]", "devParams parse error");
      }
    }
    if (header === "charta") {
      let txt = await getPayloadAsTxt(blob, size);
      txt = "[" + txt.substring(0, txt.length - 1) + "]";
      let chartJson;
      try {
        chartJson = JSON.parse(txt);
        if (blobDebug) console.log("[i]", "chart data json: ", chartJson);
      } catch (e) {
        if (blobDebug) console.log("[e]", "chart json data parce error, return");
        return;
      }
      let out = {};
      let addJson = {};
      if (await getJsonAsJson(blob, size, out)) {
        addJson = out.json;
        if (blobDebug) console.log("[i]", "chart add json: ", addJson);
      } else {
        if (blobDebug) console.log("[e]", "chart json add-ns parce error, return");
        return;
      }
      let finalDataJson = {};
      finalDataJson.status = chartJson;

      finalDataJson = {
        ...finalDataJson,
        ...addJson,
      };
      if (blobDebug) console.log("[✔]", "chartJson: ", finalDataJson);
      apdateWidgetByArray(finalDataJson);
    }
    if (header === "chartb") {
      let out = {};
      if (await getPayloadAsJson(blob, size, out)) {
        let status = out.json;
        apdateWidgetByArray(status);
        if (blobDebug) console.log("[✔]", "chart status: ", status);
      } else {
        if (blobDebug) console.log("[e]", "status parse error");
      }
    }
  }

  async function getJsonAsJson(blob, size, out) {
    let partBlob = blob.slice(12, size);
    let txt = await partBlob.text();
    try {
      out.json = JSON.parse(txt);
      out.parse = true;
    } catch (e) {
      if (debug) console.log("[e]", "json parce error: ", txt);
      out.parse = false;
    }
    return out.parse;
  }

  async function getPayloadAsJson(blob, size, out) {
    let partBlob = blob.slice(size, blob.length);
    let txt = await partBlob.text();
    try {
      out.json = JSON.parse(txt);
      out.parse = true;
    } catch (e) {
      if (debug) console.log("[e]", "json parse error: ", txt);
      out.parse = false;
    }
    return out.parse;
  }

  async function getPayloadAsTxt(blob, size) {
    let txtBlob = blob.slice(size, blob.length);
    let txt = await txtBlob.text();
    return txt;
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
    try {
      let res = await fetch("https://portal.iotmanager.org/compiler/allmodinfo", {
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        allmodeinfo = await res.json();
        allmodeinfo = allmodeinfo.message;
      } else {
        console.log("error", res.statusText);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  const getProfile = async () => {
    try {
      const JWT = Cookies.get("token_iotm2");
      let res = await fetch("https://portal.iotmanager.org/compiler/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        profile = await res.json();
        profile = profile.message;
        await markProfileAsPerThisDevProfile();
      } else {
        console.log("error", res.statusText);
      }
    } catch (e) {
      console.log("error", e);
    }
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

  async function initDevList() {
    if (firstDevListRequest) {
      //при первом запросе листа устройств запишем его целеком
      devListOverride();
    } else {
      //при последующих прилетах списка устройств мы переписываем в массиве только то что изменилось
      devListCombine();
    }
    firstDevListRequest = false;
    deviceList = deviceList;
    parsed.deviceListJson = true;
    if (blobDebug) console.log("[✔]", "deviceList parced");
    onParced();
    selectedDeviceDataRefresh();
    //затем подключимся к всему полученному списку устройств
    connectToAllDevices();
  }

  //перезапись листа устройств
  async function devListOverride() {
    deviceList = incDeviceList;
    sortList(deviceList);
    //установим заведомо статус уже присутствующего устроства в true для того что бы предотвратить повторное подключение!!!
    deviceList[0].status = true;
    console.log("[i]", "[devlist]", "devlist overrided");
  }

  //добавление только новых элементов в лист устройств (если такого ip не было)
  async function devListCombine() {
    deviceList = combineArrays(deviceList, incDeviceList);
    sortList(deviceList);
    console.log("[i]", "[devlist]", "devlist combined");
  }

  function sortList(list) {
    let firstDev = list.shift();
    list.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    list.unshift(firstDev);
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
    paramsJson = {}; //?

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

  function scale(number, inMin, inMax, outMin, outMax) {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  //тикер который тикает каждую секунду и на каждую 0 секунду запускает проверку соединения
  function wsTestMsgTask() {
    tickerTask = setTimeout(wsTestMsgTask, 1000);
    if (!preventReconnect) {
      remainingTimeout--;
      if (rebootOrUpdateProcess && socketConnected) {
        rebootOrUpdateProcess = false;
        showAwaitingCircle = false;
        reconnectTimeout = 60;
        remainingTimeout = reconnectTimeout;
      }
      percent = scale(remainingTimeout, reconnectTimeout, 0, 0, 100);
      if (remainingTimeout <= 0) {
        if (debug) console.log("[i]", "----timer tick----");
        printAllCreatedWs();
        remainingTimeout = reconnectTimeout;
        deviceList.forEach((device) => {
          if (device.status === false || device.status === undefined) {
            wsConnect(device.ws);
            wsEventAdd(device.ws);
          } else {
            wsSendMsg(device.ws, "/tst|");
            ack(device.ws, false);
          }
        });
      }
    }
  }

  function ack(ws, st) {
    if (!st) {
      startMillis[ws] = Date.now();
      ackTimeoutsArr[ws] = setTimeout(function () {
        markDeviceStatus(ws, false);
      }, waitingAckTimeout);
    } else {
      if (ackTimeoutsArr[ws]) clearTimeout(ackTimeoutsArr[ws]);
      if (startMillis[ws]) {
        ping[ws] = Date.now() - startMillis[ws];
      }
      for (let i = 0; i < deviceList.length; i++) {
        if (deviceList[i].ws === ws) {
          deviceList[i].ping = ping[ws];
        }
      }
      deviceList = deviceList;
    }
  }

  function wsSendMsg(ws, msg) {
    if (socket[ws] && socket[ws].readyState === 1) {
      socket[ws].send(msg);
      if (debug) console.log("[i]", getIP(ws), ws, "msg send success", msg);
    } else {
      if (debug) console.log("[e]", getIP(ws), ws, "msg not send");
    }
  }

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

  function combineArrays(A, B) {
    var ids = new Set(A.map((d) => d.ip));
    let output = [...A, ...B.filter((d) => !ids.has(d.ip))];
    return output;
  }

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
    if (settingsJson.serverip) {
      try {
        let url = settingsJson.serverip + "/iotm/ver.json";
        console.log("url", url);
        let res = await fetch(url, {
          mode: "cors",
          method: "GET",
        });
        if (res.ok) {
          versionsList = await res.json();
          versionsList = versionsList[errorsJson.bn];
          choosingVersion = errorsJson.bver;
          console.log(JSON.stringify(versionsList));
        } else {
          choosingVersion = undefined;
          console.log("error, versions list not received", res.statusText);
        }
      } catch (e) {
        choosingVersion = undefined;
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

  <header class="h-10 w-full bg-gray-100 overflow-auto shadow-md">
    <div class="flex content-center items-center justify-end">
      {#if showDropdown}
        <div class="px-15 py-1">
          <select class="border border-indigo-500 border-1" bind:value={selectedWs} on:change={() => devicesDropdownChange()}>
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
        <CloudIcon color={socketConnected === true ? "text-green-500" : "text-red-500"} />
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
      {#if userdata}
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
            <ConfigPage show={pageReady.config} bind:configJson={configJson} bind:scenarioTxt={scenarioTxt} widgetsJson={widgetsJson} itemsJson={itemsJson} saveConfig={() => saveConfig()} cleanLogs={() => cleanLogs()} rebootEsp={() => rebootEsp()} moduleOrder={(id, key, value) => moduleOrder(id, key, value)} />
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
