import { eventEmitter } from "../eventEmitter";

class WebSocketManager {
  constructor(deviceList, debug = true) {
    this.deviceList = deviceList;
    this.debug = debug;
    this.socket = [];
    this.selectedWs = 0;
    this.currentPageName = undefined;
    this.reconnectTimeout = 60;
    this.remainingTimeout = this.reconnectTimeout;
    this.preventReconnect = false;
    this.waitingAckTimeout = 18000;
    this.rebootOrUpdateProcess = false;
    this.showAwaitingCircle = false;
    this.socketConnected = false;
    this.ackTimeoutsArr = [];
    this.startMillis = [];
    this.ping = [];
    this.layoutJson = [];
    this.paramsJson = {};
    this.itemsJson = {};
    this.widgetsJson = {};
    this.configJson = {};
    this.scenarioTxt = "";
    this.settingsJson = {};
    this.ssidJson = {};
    this.errorsJson = {};
    this.incDeviceList = [];
    this.flashProfileJson = {};
    this.otaJson = {};
    this.firstDevListRequest = true;
    this.parsed = this.initializeParsedFlags();
    this.pageReady = this.initializePageReadyFlags();
    this.pages = [];
  }

  initializeParsedFlags() {
    return {
      itemsJson: false,
      widgetsJson: false,
      configJson: false,
      settingsJson: false,
      ssidJson: false,
      errorsJson: false,
      incDeviceList: false,
      flashProfileJson: false,
      otaJson: false,
    };
  }

  initializePageReadyFlags() {
    return {
      dash: false,
      config: false,
      connection: false,
      list: false,
      system: false,
      dev: false,
    };
  }

  connectToAllDevices() {
    this.deviceList.forEach((device, i) => {
      device.ws = i;
      if (!device.status) {
        this.wsConnect(i);
        this.wsEventAdd(i);
      }
    });
  }

  async initDevList() {
    if (this.firstDevListRequest) {
      this.devListOverride();
    } else {
      this.devListCombine();
    }
    this.firstDevListRequest = false;
    this.parsed.deviceListJson = true;
    this.debug && console.log("[✔]", "deviceList parsed");
    this.onParsed();
    this.selectedDeviceDataRefresh();
    this.connectToAllDevices();
  }

  wsConnect(ws) {
    const ip = this.getIP(ws);
    if (ip === "error") {
      this.debug && console.log("[e]", "device list wrong");
    } else {
      this.socket[ws] = new WebSocket(`ws://${ip}:81`);
      this.socket[ws].binaryType = "blob";
      this.debug && console.log("[i]", ip, ws, "started connecting...");
    }
  }

  getIP(ws) {
    const device = this.deviceList.find((device) => device.ws === ws);
    return device ? device.ip : "error";
  }

  wsEventAdd(ws) {
    if (!this.socket[ws]) {
      this.debug && console.log("[e]", "socket not exist");
      return;
    }

    const ip = this.getIP(ws);
    this.socket[ws].addEventListener("open", () => this.handleOpen(ws, ip));
    this.socket[ws].addEventListener("message", (event) => this.handleMessage(event, ws));
    this.socket[ws].addEventListener("close", () => this.handleClose(ws, ip));
    this.socket[ws].addEventListener("error", () => this.handleError(ws, ip));
  }

  handleOpen(ws, ip) {
    this.markDeviceStatus(ws, true);
    if (this.firstDevListRequest && ws === 0) this.wsSendMsg(ws, "/devlist|");
    if (this.currentPageName === "/|") {
      this.wsSendMsg(ws, this.currentPageName);
    } else if (ws === this.selectedWs) {
      this.sendCurrentPageNameToSelectedWs();
    }
  }

  handleMessage(event, ws) {
    if (typeof event.data === "string" && event.data === "/tstr|") {
      this.ack(ws, true);
    } else if (event.data instanceof Blob) {
      if (ws === this.selectedWs) {
        this.parseBlob(event.data, ws);
      }
      if (this.currentPageName === "/|") {
        this.parseAllBlob(event.data, ws);
      }
    }
  }

  handleClose(ws, ip) {
    this.debug && console.log("[e]", ip, "connection closed");
    this.markDeviceStatus(ws, false);
  }

  handleError(ws, ip) {
    this.debug && console.log("[e]", ip, "connection error");
    this.markDeviceStatus(ws, false);
  }

  markDeviceStatus(ws, status) {
    this.deviceList.forEach((device) => {
      if (device.ws === ws) {
        device.status = status;
        device.ping = 0;
        this.debug && console.log("[i]", device.ip, ws, `status ${status ? "online" : "offline"}`);
        if (!status) {
          this.deleteWidget(ws);
          this.sortingLayout(ws);
        }
      }
    });
    this.selectedDeviceDataRefresh();
  }

  deleteWidget(ws) {
    this.layoutJson = this.layoutJson.filter((item) => item.ws !== ws);
  }

  async parseBlob(blob, ws) {
    const header = await blob.slice(0, 6).text();
    const size = await blob.slice(7, 11).text();

    const handlers = {
      itemsj: this.handleItemsJson,
      widget: this.handleWidgetsJson,
      config: this.handleConfigJson,
      scenar: this.handleScenarioTxt,
      settin: this.handleSettingsJson,
      ssidli: this.handleSsidJson,
      errors: this.handleErrorsJson,
      devlis: this.handleDeviceList,
      prfile: this.handleFlashProfileJson,
      otaupd: this.handleOtaJson,
      corelg: this.handleCoreLog,
    };

    if (handlers[header]) {
      await handlers[header].call(this, blob, size, ws);
    }

    await this.onParsed();
  }

  async handleItemsJson(blob, size) {
    await this.parseJsonPayload(blob, size, "itemsJson");
  }

  async handleWidgetsJson(blob, size) {
    await this.parseJsonPayload(blob, size, "widgetsJson");
  }

  async handleConfigJson(blob, size) {
    await this.parseJsonPayload(blob, size, "configJson");
  }

  async handleScenarioTxt(blob, size) {
    this.scenarioTxt = await this.getPayloadAsTxt(blob, size);
    this.debug && console.log("[i]", "scenarioTxt: ", this.scenarioTxt);
  }

  async handleSettingsJson(blob, size) {
    await this.parseJsonPayload(blob, size, "settingsJson");
  }

  async handleSsidJson(blob, size) {
    await this.parseJsonPayload(blob, size, "ssidJson");
  }

  async handleErrorsJson(blob, size) {
    await this.parseJsonPayload(blob, size, "errorsJson");
  }

  async handleDeviceList(blob, size, ws) {
    await this.parseJsonPayload(blob, size, "incDeviceList");
    await this.initDevList();
  }

  async handleFlashProfileJson(blob, size) {
    await this.parseJsonPayload(blob, size, "flashProfileJson");
  }

  async handleOtaJson(blob, size) {
    await this.parseJsonPayload(blob, size, "otaJson");
  }

  async handleCoreLog(blob, size) {
    const txt = await this.getPayloadAsTxt(blob, size);
    this.addCoreMsg(txt);
  }

  async parseJsonPayload(blob, size, jsonKey) {
    const out = {};
    if (await this.getPayloadAsJson(blob, size, out)) {
      this[jsonKey] = out.json;
      this.parsed[jsonKey] = true;
      this.debug && console.log("[✔]", `${jsonKey}: `, this[jsonKey]);
    } else {
      this.parsed[jsonKey] = false;
      this.debug && console.log("[e]", `${jsonKey} parse error`);
    }
  }

  async parseAllBlob(blob, ws) {
    const header = await blob.slice(0, 6).text();
    const size = await blob.slice(7, 11).text();

    const handlers = {
      status: this.handleStatusJson,
      layout: this.handleLayoutJson,
      params: this.handleParamsJson,
      charta: this.handleChartAJson,
      chartb: this.handleChartBJson,
    };

    if (handlers[header]) {
      await handlers[header].call(this, blob, size, ws);
    }
  }

  async handleStatusJson(blob, size) {
    await this.parseJsonPayload(blob, size, "statusJson");
  }

  async handleLayoutJson(blob, size, ws) {
    const out = {};
    if (await this.getPayloadAsJson(blob, size, out)) {
      this.combineLayoutsInOne(ws, out.json);
      this.debug && console.log("[✔]", "devLayout: ", out.json);
    } else {
      this.debug && console.log("[e]", "devLayout parse error");
    }
  }

  async handleParamsJson(blob, size, ws) {
    const out = {};
    if (await this.getPayloadAsJson(blob, size, out)) {
      this.paramsJson = { ...this.paramsJson, ...out.json };
      this.updateAllStatuses(ws);
      this.onParsed();
      this.debug && console.log("[✔]", "devParams: ", out.json);
    } else {
      this.debug && console.log("[e]", "devParams parse error");
    }
  }

  async handleChartAJson(blob, size) {
    const txt = await this.getPayloadAsTxt(blob, size);
    const chartJson = JSON.parse(`[${txt.substring(0, txt.length - 1)}]`);
    const out = {};
    if (await this.getJsonAsJson(blob, size, out)) {
      const finalDataJson = { status: chartJson, ...out.json };
      this.updateWidgetByArray(finalDataJson);
      this.debug && console.log("[✔]", "chartJson: ", finalDataJson);
    } else {
      this.debug && console.log("[e]", "chart json add-ns parse error");
    }
  }

  async handleChartBJson(blob, size) {
    await this.parseJsonPayload(blob, size, "chartStatus");
  }

  sendCurrentPageNameToSelectedWs() {
    if (this.selectedWs !== undefined) {
      this.wsSendMsg(this.selectedWs, this.currentPageName);
    }
  }

  wsSendMsg(ws, msg) {
    if (this.socket[ws]?.readyState === 1) {
      this.socket[ws].send(msg);
      this.debug && console.log("[i]", this.getIP(ws), ws, "msg send success", msg);
    } else {
      this.debug && console.log("[e]", this.getIP(ws), ws, "msg not send");
    }
  }

  ack(ws, st) {
    if (!st) {
      this.startMillis[ws] = Date.now();
      this.ackTimeoutsArr[ws] = setTimeout(() => {
        this.markDeviceStatus(ws, false);
      }, this.waitingAckTimeout);
    } else {
      clearTimeout(this.ackTimeoutsArr[ws]);
      this.ping[ws] = Date.now() - this.startMillis[ws];
      this.deviceList.forEach((device) => {
        if (device.ws === ws) {
          device.ping = this.ping[ws];
        }
      });
    }
  }

  selectedDeviceDataRefresh() {
    const selectedDevice = this.deviceList.find((device) => device.ws === this.selectedWs);
    this.socketConnected = selectedDevice?.status || false;
  }

  sortingLayout(ws) {
    this.layoutJson.sort((a, b) => a.descr.localeCompare(b.descr));
    this.pages = Array.from(new Set(this.layoutJson.map(({ page }) => page)))
      .map((page) => ({ page }))
      .sort((a, b) => a.page.localeCompare(b.page));

    eventEmitter.emit("layoutJsonUpdated", this.layoutJson);

    console.log("[3]", ws, "layout sort, requested params...");
    this.wsSendMsg(ws, "/params|");
  }

  wsTestMsgTask() {
    setTimeout(() => this.wsTestMsgTask(), 1000);
    if (!this.preventReconnect) {
      this.remainingTimeout--;
      if (this.rebootOrUpdateProcess && this.socketConnected) {
        this.rebootOrUpdateProcess = false;
        this.showAwaitingCircle = false;
        this.reconnectTimeout = 60;
        this.remainingTimeout = this.reconnectTimeout;
      }
      if (this.remainingTimeout <= 0) {
        this.debug && console.log("[i]", "----timer tick----");
        this.remainingTimeout = this.reconnectTimeout;
        this.deviceList.forEach((device) => {
          if (!device.status) {
            this.wsConnect(device.ws);
            this.wsEventAdd(device.ws);
          } else {
            this.wsSendMsg(device.ws, "/tst|");
            this.ack(device.ws, false);
          }
        });
      }
    }
  }

  async getPayloadAsJson(blob, size, out) {
    const partBlob = blob.slice(size, blob.length);
    const txt = await partBlob.text();
    try {
      out.json = JSON.parse(txt);
      out.parse = true;
    } catch (e) {
      this.debug && console.log("[e]", "json parse error: ", txt);
      out.parse = false;
    }
    return out.parse;
  }

  async getPayloadAsTxt(blob, size) {
    const partBlob = blob.slice(size, blob.length);
    return await partBlob.text();
  }

  async getJsonAsJson(blob, size, out) {
    const partBlob = blob.slice(size, blob.length);
    const txt = await partBlob.text();
    try {
      out.json = JSON.parse(txt);
      out.parse = true;
    } catch (e) {
      this.debug && console.log("[e]", "json parse error: ", txt);
      out.parse = false;
    }
    return out.parse;
  }

  async devListOverride() {
    this.deviceList = this.incDeviceList;
    this.sortList(this.deviceList);
    this.deviceList[0].status = true;
    this.debug && console.log("[i]", "[devlist]", "devlist overridden");
  }

  async onParsed() {
    const pageHandlers = {
      "/|": () => (this.pageReady.dash = true),
      "/config|": () => this.handleConfigPage(),
      "/connection|": () => this.handleConnectionPage(),
      "/list|": () => this.handleListPage(),
      "/system|": () => this.handleSystemPage(),
      "/profile|": () => this.handleProfilePage(),
    };

    if (pageHandlers[this.currentPageName]) {
      await pageHandlers[this.currentPageName].call(this);
    }
  }

  handleConfigPage() {
    if (this.parsed.itemsJson && this.parsed.widgetsJson && this.parsed.configJson && this.parsed.settingsJson) {
      this.clearParsedFlags();
      this.pageReady.config = true;
      this.debug && console.log("✔✔", "config page parsed");
    }
  }

  handleConnectionPage() {
    if (this.parsed.ssidJson && this.parsed.settingsJson && this.parsed.errorsJson) {
      this.clearParsedFlags();
      this.pageReady.connection = true;
      this.debug && console.log("✔✔", "connection page parsed");
    }
  }

  handleListPage() {
    if (this.parsed.settingsJson) {
      this.clearParsedFlags();
      this.pageReady.list = true;
      this.debug && console.log("✔✔", "list page parsed");
    }
  }

  handleSystemPage() {
    if (this.parsed.errorsJson && this.parsed.settingsJson) {
      this.clearParsedFlags();
      this.getVersionsList();
      this.pageReady.system = true;
      this.debug && console.log("✔✔", "system page parsed");
    }
  }

  async handleProfilePage() {
    if (this.parsed.flashProfileJson) {
      this.clearParsedFlags();
      this.pageReady.profile = true;
      this.debug && console.log("✔✔", "profile page parsed");
      await this.getModInfo();
      await this.getProfile();
    }
  }

  async devListCombine() {
    this.deviceList = this.combineArrays(this.deviceList, this.incDeviceList);
    this.sortList(this.deviceList);
    this.debug && console.log("[i]", "[devlist]", "devlist combined");
  }

  combineArrays(A, B) {
    const ids = new Set(A.map((d) => d.ip));
    return [...A, ...B.filter((d) => !ids.has(d.ip))];
  }

  getSelectedDeviceData(ws) {
    this.selectedDeviceData = this.deviceList.find((device) => device.ws === ws);
  }

  sortList(list) {
    const firstDev = list.shift();
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.unshift(firstDev);
  }

  sendToAllDevices(msg) {
    this.deviceList.forEach((device) => {
      if (device.status === true) {
        this.wsSendMsg(device.ws, msg);
      }
    });
  }

  async combineLayoutsInOne(ws, devLayout) {
    devLayout.forEach((item) => (item.ws = ws));
    this.layoutJson = this.layoutJson.concat(devLayout);
    console.log("[2]", ws, "devLayout pushed to layout");
    this.sortingLayout(ws);
  }

  updateAllStatuses(ws) {
    for (const [key, value] of Object.entries(this.paramsJson)) {
      this.layoutJson.forEach((item) => {
        let topic = item.topic;
        if (topic) {
          topic = topic.substring(topic.lastIndexOf("/") + 1);
          if (key === topic) {
            console.log("[i]", "updated =>" + topic, value);
            item.status = value;
          }
        }
      });
    }
    this.wsSendMsg(ws, "/charts|");
  }
}

export default WebSocketManager;
