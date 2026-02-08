---
name: WebSocketManager refactor
overview: "Привести IoTManagerWeb к архитектуре по аналогии с Web2: один класс WebSocketManager как основа, EventEmitter для уведомления UI, App.svelte — тонкий слой роутинга и разметки. Без копирования кода из Web2, с опорой на существующие api/ и lib/."
todos: []
isProject: false
---

# Рефакторинг: WebSocketManager как основа (по аналогии с Web2)

## Важно: что не терять

**Web2 — только архитектурный пример (структура).** Код из Web2 не копируем: там есть ошибки и отличия протокола. Пишем новый код, сохраняя всю рабочую логику текущего IoTManagerWeb.

**Обязательно сохранить:**

1. **Получение списка устройств и подключение к ним**
  - Цепочка: один начальный deviceList (первое устройство) → open(ws=0) → при `firstDevListRequest` отправка `/devlist|` → приход blob с заголовком `devlis` → `initDevList` (devListOverride при первом запросе, devListCombine при последующих) → обновление deviceList → `connectToAllDevices()` для всех из списка. Не менять порядок и условия (в т.ч. deviceList[0].status = true в devListOverride).
2. **Все страницы должны работать** — Управление, Конфигуратор, Подключение, Системные, Устройства, Вход (и при авторизации — Модули/Profile). Механизмы по страницам:
  - **Управление (Dashboard)** — рассылка запроса всем устройствам при `/|`, приём layout/params/charta/chartb от всех, combineLayoutsInOne, sortingLayout, updateAllStatuses, отправка `/params|` после layout и `/charts|` после params; wsPush → `/control|key/status`.
  - **Конфигуратор** — запрос по currentPageName `/config|`, парсинг itemsj/widget/config/scenar/settin, pageReady при полном наборе; saveConfig → `/tuoyal|`, `/gifnoc|`, `/oiranecs|`; экспорт/импорт (mark iotm, scenario=>); moduleOrder → `/order|`.
  - **Подключение** — ssidJson, settingsJson, errorsJson; saveSett/saveMqtt → `/sgnittes|`, `/mqtt|`; ssidClick → `/scan|`.
  - **Системные** — errorsJson, settingsJson; getVersionsList (ver.json); cleanLogs → `/clean|`; rebootEsp → `/reboot|`; cancelAlarm → `/rorre|`.
  - **Устройства (List)** — deviceList, saveList → `/tsil|`, addDevInList, devListOverride/devListCombine, udps, sendToAllDevices.
  - **Вход (Login)** — без изменений; портал по api/portal.
  - **Модули (Profile)** — при авторизации; flashProfileJson, getModInfo, getProfile, updateBuild и т.д.
3. **Логика получения данных графиков**
  - После прихода **layout** (parseAllBlob): combineLayoutsInOne → sortingLayout(ws) → отправка `**/params|**`.
  - После прихода **params**: merge в paramsJson, updateAllStatuses(ws) (подстановка в layoutJson по topic), затем отправка `**/charts|**`.
  - Приход **charta** / **chartb** → обновление layoutJson по topic через **apdateWidgetByArray**. Формат charta: два фрагмента (12..size — JSON addJson, size..length — текст массива точек), костыль `"[" + txt.substring(0, txt.length - 1) + "]"` не трогать. chartb — один JSON с topic и status. Всё как в текущем [lib/blobProtocol.js](src/lib/blobProtocol.js) и App.svelte.
4. **Обновление данных виджетов (особое внимание)**
  Виджеты на Dashboard (input, toggle, range, anydata, chart) получают данные из **layoutJson**: каждый элемент — один виджет с полями topic, status, page, widget и т.д. Данные прилетают по WebSocket в parseAllBlob (только при currentPageName === "/|") и должны сразу отражаться в UI.
  - **Цепочка по типам blob:**
    - **status** → **updateWidget(newStatusJson)** — найти в layoutJson элемент с совпадающим topic, слить данные **jsonConcat(layoutJson[i], newStatusJson)**, выставить **layoutJson[i].sent = false** (снять подсветку «ожидание ответа»). Один виджет обновляется по одному прилетевшему статусу.
    - **params** → после merge в paramsJson вызывается **updateAllStatuses(ws)** — для каждого ключа из paramsJson найти виджет по topic (последний сегмент topic) и записать **layoutJson[i].status = value** (sent в updateAllStatuses не менять — это массовая подстановка из params, не ответ на действие пользователя); затем отправить `/charts|`.
    - **charta** / **chartb** → **apdateWidgetByArray(newStatusJson)** — найти виджет по topic; **jsonConcatEx** (слить всё кроме status); для **status** либо слить массивы (**prevArr = [...prevArr, ...newArr]**), либо записать newArr; **layoutJson[i].sent = false**. Так накапливаются точки графиков по topic.
  - **Вспомогательные функции не терять:** **jsonConcat** (полное слияние объектов), **jsonConcatEx** (слияние без поля status — т.к. status у chart накопительный).
  - **Реактивность UI:** после любого изменения layoutJson (combineLayoutsInOne, sortingLayout, updateWidget, updateAllStatuses, apdateWidgetByArray) UI должен обновиться. В текущем App layoutJson — одна переменная, мутация layoutJson[i] или layoutJson = layoutJson триггерит Svelte. В схеме с WebSocketManager: менеджер держит this.layoutJson и после каждого такого обновления вызывать **eventEmitter.emit("layoutJsonUpdated", { layoutJson: this.layoutJson, pages: this.pages })** (в т.ч. после updateWidget, updateAllStatuses, apdateWidgetByArray), чтобы App подставил layoutJson в локальную переменную и Dashboard перерисовался. Иначе виджеты не покажут прилетевшие данные.
5. **Обратная связь в виджетах (красная подсветка «ожидание ответа»)**
  У каждого виджета в layoutJson есть поле **sent**. Пока **sent === true**, виджет подсвечивается красным (ожидание ответа от устройства); после прихода ответа по этому виджету **sent** сбрасывается в **false** — красный гаснет.
  - **Где ставится sent = true:** в виджетах при действии пользователя, сразу перед отправкой команды на устройство. [Input.svelte](src/widgets/Input.svelte): при on:change делают `widget.sent = true` и вызывают wsPush(ws, topic, status). [Toggle.svelte](src/widgets/Toggle.svelte): в changeValue() перед сменой widget.status выставляют `widget.sent = true`, затем wsPush в on:change. [Range.svelte](src/widgets/Range.svelte): в on:change `(widget.sent = true), wsPush(...)`. Визуально: Input — класс `border-red-500` при widget.sent, иначе `focus:border-indigo-500`; Toggle/Range — класс `bg-red-300` у «точки»/слайдера при widget.sent, иначе серый.
  - **Где ставится sent = false:** только при приходе данных с устройства по этому виджету. В [App.svelte](src/App.svelte): в **updateWidget** (blob с заголовком status) — после нахождения виджета по topic и jsonConcat делают `layoutJson[i].sent = false`. В **apdateWidgetByArray** (charta/chartb) — после обновления виджета по topic делают `layoutJson[i].sent = false`. В **updateAllStatuses** sent не меняется (там массовая подстановка из params перед запросом графиков, не ответ на действие пользователя).
  - **Цепочка:** пользователь меняет значение → виджет ставит widget.sent = true → отправляется /control|key/status → устройство обрабатывает и присылает blob (status или данные графика) → parseAllBlob вызывает updateWidget или apdateWidgetByArray → по topic находят layoutJson[i] → **layoutJson[i].sent = false** → красный гаснет. При переносе логики в WebSocketManager поле **sent** должно по-прежнему жить на элементах this.layoutJson; сброс sent = false — только в updateWidget и apdateWidgetByArray; после них — emit layoutJsonUpdated, чтобы UI обновил подсветку.

**Источник правды по логике и протоколу:** текущий IoTManagerWeb (и существующие api/, lib/), не Web2.

**При трудностях:** всегда можно смотреть код бэкенда — [IoTManager](file:///Users/dmitry/Documents/Database/IoTManagerProject/personal/IoTManager) (протокол WS, команды, форматы blob, модули логирования/графиков: `src/WsServer.cpp`, `src/modules/virtual/Loging*` и т.д.).

---

## Цель

- **Один менеджер** — класс `WebSocketManager` владеет состоянием устройств/WS/blob и оркестрирует **существующие** `api/` и `lib/` (без переписывания их логики).
- **EventEmitter** — уведомление App об изменении данных (layoutJson, deviceList) без жёсткой связи с Svelte.
- **Тонкий App** — роутинг, вызовы `wsManager.*`, подписка на события, разметка; минимум локального state.

## Текущее состояние

- [App.svelte](src/App.svelte): ~1226 строк, десятки `let` (deviceList, layoutJson, parsed, pageReady, selectedWs, ...), вызовы deviceConnection, blobProtocol, deviceSocket, wsReconnect.
- [api/deviceSocket.js](src/api/deviceSocket.js): createConnection(wsIndex, ip, callbacks), send(wsIndex, msg).
- [lib/deviceConnection.js](src/lib/deviceConnection.js): getIP, connectToAllDevices, createOpenHandler, handleDevListReceived.
- [lib/deviceListManager.js](src/lib/deviceListManager.js): initDevList, devListOverride, devListCombine, sortList, combineArrays.
- [lib/blobProtocol.js](src/lib/blobProtocol.js): parseBlob(blob, ws, handlers), parseAllBlob(blob, ws, handlers).
- [lib/wsReconnect.js](src/lib/wsReconnect.js): wsTestMsgTask, ack (heartbeat, таймауты).

## API страниц (контракт App → страницы)

При рефакторинге передавать страницам те же props; источник данных — wsManager или реактивные переменные (layoutJson, pages, deviceList), синхронизированные с менеджером через события.


| Страница                                                        | Данные (props)                                                                | Колбэки (props)                                                                                                    | Связки (bind)           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **Dashboard** [Dashboard.svelte](src/pages/Dashboard.svelte)    | show, layoutJson, pages                                                       | wsPush(ws, topic, status)                                                                                          | —                       |
| **Config** [Config.svelte](src/pages/Config.svelte)             | show, widgetsJson, itemsJson, userdata                                        | saveConfig(), cleanLogs(), rebootEsp(), moduleOrder(id, key, value)                                                | configJson, scenarioTxt |
| **Connection** [Connection.svelte](src/pages/Connection.svelte) | show, settingsJson, errorsJson, ssidJson                                      | rebootEsp(), ssidClick(), saveSett(), saveMqtt()                                                                   | —                       |
| **List** [List.svelte](src/pages/List.svelte)                   | show, deviceList, settingsJson, showInput, newDevice, percent                 | saveSett(), rebootEsp(), addDevInList(), sendToAllDevices(msg), saveList(), devListOverride(), applicationReboot() | —                       |
| **System** [System.svelte](src/pages/System.svelte)             | show, errorsJson, settingsJson, coreMessages, versionsList                    | saveSett(), rebootEsp(), cleanLogs(), cancelAlarm(alarmKey)                                                        | choosingVersion         |
| **Profile** [Profile.svelte](src/pages/Profile.svelte)          | show, flashProfileJson, userdata, allmodeinfo, profile, serverOnline, otaJson | updateBuild(path)                                                                                                  | —                       |
| **Login** [Login.svelte](src/pages/Login.svelte)                | show, serverOnline                                                            | —                                                                                                                  | —                       |


**Детали по страницам:**

- **Dashboard:** layoutJson и pages — из реактивных переменных (обновляются по event layoutJsonUpdated). wsPush вызывает отправку /control|key/status для выбранного ws.
- **Config:** configJson и scenarioTxt — bind, значит App/менеджер отдаёт объект, страница может мутировать; saveConfig отправляет layout, config, scenario; moduleOrder — /order|.
- **Connection:** только данные и колбэки; без bind.
- **List:** deviceList — из реактивной переменной (deviceListUpdated); newDevice — объект для формы добавления устройства; devListOverride передаётся (резерв).
- **System:** versionsList и choosingVersion (bind) приходят из App; cancelAlarm вызывается при закрытии аларма по ключу.
- **Profile:** все данные только на чтение; updateBuild(path) — отправка /update|path.
- **Login:** только show и serverOnline; логика входа и сохранение JWT внутри страницы (fetch через api/portal).

При переносе на WebSocketManager: show брать из wsManager.pageReady.*; данные — из wsManager.* или из локальных layoutJson/pages/deviceList, синхронизированных по событиям; колбэки — обёртки в App, вызывающие wsManager.wsSendMsg / wsManager.saveConfig и т.д.

## Проверки после серьёзных изменений

После каждого из отмеченных ниже шагов **останавливать выполнение плана** и просить вас:

- открыть приложение в браузере;
- проверить, что страница открывается и данные прилетают (какие именно — указано в шаге).

Продолжать следующий шаг только после вашего подтверждения, что проверка пройдена.

---

## Шаги

### 1. EventEmitter

- Добавить `**src/eventEmitter.js**` (или в корень, по аналогии с Web2): класс с методами `on(event, listener)`, `off(event, listener)`, `emit(event, ...args)`. Экспорт синглтона `eventEmitter`.
- События для начала: `**layoutJsonUpdated**` (payload: `{ layoutJson, pages }`), `**deviceListUpdated**` (чтобы App подписался и обновил локальные переменные для реактивности Svelte).

### 2. Класс WebSocketManager (каркас + делегирование)

- Добавить `**src/WebSocketManager.js**` (или `src/lib/WebSocketManager.js`).

**Состояние (поля класса):**  
deviceList, layoutJson, paramsJson, pages, parsed, pageReady, firstDevListRequest, currentPageName, selectedWs, selectedDeviceData, socketConnected, originalWs; itemsJson, widgetsJson, configJson, scenarioTxt, settingsJson, ssidJson, errorsJson, incDeviceList, flashProfileJson, otaJson; newDevice, coreMessages; reconnectTimeout, remainingTimeout, percent, preventReconnect, rebootOrUpdateProcess, showAwaitingCircle; ack state (ackTimeoutsArr, startMillis, ping). Опционально: userdata, serverOnline, allmodeinfo, profile, versionsList, choosingVersion — либо в менеджере, либо оставить только в App и передавать в страницы из App (решение: в менеджере хранить, чтобы страницы получали всё через один объект).

**Инициализация:**  
Constructor(initialDeviceList, options). Копировать initialDeviceList в this.deviceList, инициализировать parsed/pageReady объектами (как сейчас в App), firstDevListRequest = true, selectedWs = 0, currentPageName и т.д. Опции: debug.

**Делегирование в существующие модули:**

- **getIP(ws)** → `deviceConnection.getIP(ws, this.deviceList)`.
- **connectToAllDevices()** → вызвать `deviceConnection.connectToAllDevices(this.deviceList, () => this.getSelectedDeviceData(this.selectedWs), this.selectedWs, (wsIndex, ip) => this._createConnection(wsIndex, ip))`. Внутри менеджера реализовать **_createConnection(wsIndex, ip)**:
  - Вызов `deviceSocket.createConnection(wsIndex, ip, { onOpen, onMessage, onClose, onError })`.
  - onOpen: при срабатывании события open вызывать createOpenHandler **в этот момент** (чтобы в замыкание попали актуальные this.firstDevListRequest, this.currentPageName, this.selectedWs), затем вызвать полученную функцию с (ws). То есть внутри колбэка onOpen: `const fn = deviceConnection.createOpenHandler({ markDeviceStatus: ..., sendMsg: ..., firstDevListRequest: this.firstDevListRequest, currentPageName: this.currentPageName, selectedWs: this.selectedWs, sendCurrentPageNameToSelectedWs: () => this.sendCurrentPageNameToSelectedWs() }); fn(ws);`
  - onMessage(ws, data): если data === "/tstr|" — this.ack(ws, true); если Blob — this.parseBlob(data, ws) при ws === selectedWs, и при currentPageName === "/|" this.parseAllBlob(data, ws).
  - onClose/onError: this.markDeviceStatus(ws, false).
- **parseBlob / parseAllBlob** — передать в `blobProtocol.parseBlob` / `parseAllBlob` объекты handlers, где каждый setter обновляет `this.*` (this.itemsJson = v, this.parsed.itemsJson = v, ...). Для devlis: вызывать `deviceConnection.handleDevListReceived(incDeviceList, this.deviceList, this.firstDevListRequest, { setDeviceList: (list) => { this.deviceList = list; eventEmitter.emit("deviceListUpdated"); }, setFirstDevListRequest: (v) => ..., onParced: () => this.onParced(), selectedDeviceDataRefresh: () => this.selectedDeviceDataRefresh(), connectToAllDevices: () => this.connectToAllDevices() })`. В конце parseBlob вызывать this.onParced(). Для allBlobHandlers: updateWidget, combineLayoutsInOne, mergeParams, updateAllStatuses, apdateWidgetByArray — методы менеджера, которые обновляют this.layoutJson/paramsJson и в нужных местах вызывают **eventEmitter.emit("layoutJsonUpdated", { layoutJson: this.layoutJson, pages: this.pages })**.
- **markDeviceStatus(ws, status)** — обновить deviceList, при status === false вызвать deleteWidget(ws), sortingLayout(ws), selectedDeviceDataRefresh(); затем **eventEmitter.emit("deviceListUpdated")** (и при изменении layout — уже внутри sortingLayout emit layoutJsonUpdated).
- **updateWidget**, **updateAllStatuses**, **apdateWidgetByArray** — логика как в текущем App (поиск по topic, jsonConcat/jsonConcatEx, слияние массивов status для графиков). **sent = false** — только в updateWidget и apdateWidgetByArray; в updateAllStatuses не трогать. **После каждого из этих вызовов** вызывать **eventEmitter.emit("layoutJsonUpdated", { layoutJson: this.layoutJson, pages: this.pages })** — иначе данные виджетов прилетят в менеджер, но UI не обновится.
- **wsSendMsg(ws, msg)** → `deviceSocket.send(ws, msg)`.
- **ack**, **wsTestMsgTask** — либо перенести логику из wsReconnect в менеджер (как в Web2), либо оставить вызов `wsReconnect.start(this.deviceList, (ws, msg) => deviceSocket.send(ws, msg), (ws, st) => this.markDeviceStatus(ws, st), ...)` в onMount и не дублировать код. Предпочтительно: вызывать wsReconnect из менеджера (manager.startReconnectTask()), чтобы вся инициализация была в одном месте.

**Методы менеджера, которые сейчас в App и переезжают в класс:**  
deleteWidget, combineLayoutsInOne, sortingLayout, updateAllStatuses, updateWidget, apdateWidgetByArray, **jsonConcat**, **jsonConcatEx** (оба нужны для обновления виджетов), clearData, clearParcedFlags, sendToAllDevices, sendCurrentPageNameToSelectedWs, getSelectedDeviceData, selectedDeviceDataRefresh, onParced (полностью с логикой по currentPageName и parsed).  
Сохранить протокол и форматы (charta/chartb, /params|, /charts|, /control| и т.д.) как в текущем App — без изменений. Сохранить семантику обратной связи: **layoutJson[i].sent = false** выставлять только в **updateWidget** и **apdateWidgetByArray** (при приходе ответа по topic); виджеты сами выставляют sent = true при отправке команды — не трогать.

**Эмиты:**  

- После изменений layoutJson/pages: `eventEmitter.emit("layoutJsonUpdated", { layoutJson: this.layoutJson, pages: this.pages })`.  
- После изменений deviceList: `eventEmitter.emit("deviceListUpdated")`.

**⏸ Проверка 1.** Остановиться. Попросить вас: открыть приложение в браузере; убедиться, что страница загружается (нет белого экрана и ошибок в консоли); при наличии устройства — что подключение к первому устройству происходит и запрос списка устройств уходит (в консоли/сети). После вашего подтверждения — продолжать.

### 3. Рефакторинг App.svelte

- **Создание менеджера:** один раз (вне onMount, на верхнем уровне скрипта) создать `const wsManager = new WebSocketManager(initialDeviceList, { debug })`. initialDeviceList — массив с одним элементом `{ name: "--", id: "--", ip: myip, ws: 0, status: false }` (myip из document.location.hostname / devMode).
- **Локальный state только для реактивности:** оставить `let layoutJson = []; let pages = []; let deviceList = [];` (или один объект), подписаться в onMount на eventEmitter: `eventEmitter.on("layoutJsonUpdated", (data) => { layoutJson = data.layoutJson; pages = data.pages; })`, `eventEmitter.on("deviceListUpdated", () => { deviceList = wsManager.deviceList; })`. Так Svelte будет реагировать на обновления.
- **Роутинг:** handleNavigation() устанавливает `wsManager.currentPageName = $router.path + "|"`, вызывает `wsManager.clearData()`, затем при "/|" — `wsManager.sendToAllDevices(wsManager.currentPageName)`, иначе — `wsManager.sendCurrentPageNameToSelectedWs()`. showDropdown выводить из currentPageName (например `$: showDropdown = currentPageName !== "/list|"`), currentPageName читать из wsManager.
- **onMount:** await getUser() (api portal), записать результат в wsManager.userdata и wsManager.serverOnline; onCheck(); wsManager.firstDevListRequest = true; wsManager.selectedDeviceDataRefresh(); wsManager.connectToAllDevices(); wsManager.wsTestMsgTask() (или wsManager.startReconnectTask() если вынесли в менеджер); подписка на eventEmitter; вызов handleNavigation(). Не создавать больше локальные копии deviceList/layoutJson кроме тех, что обновляются по событиям.
- **Шаблон:** везде, где сейчас передаются deviceList, layoutJson, pageReady, configJson, settingsJson и т.д., передавать либо из реактивных переменных (layoutJson, pages, deviceList), либо напрямую wsManager.* (pageReady, configJson, settingsJson, selectedWs, selectedDeviceData, и т.д.). Dropdown: bind:value={wsManager.selectedWs}, on:change={devicesDropdownChange}. devicesDropdownChange вызывает wsManager.selectedDeviceDataRefresh(), wsManager.clearData(), handleNavigation().
- **Сохранение/команды:** логику формирования команды и отправки (saveConfig → /tuoyal|, /gifnoc|, /oiranecs|; saveSett, saveList, cleanLogs, wsPush → /control| и т.д.) перенести в методы менеджера (wsManager.saveConfig(), wsManager.saveSett(), …). В App остаются только тонкие обёртки, которые вызывают эти методы и при необходимости выставляют showAwaitingCircle / socketConnected (например rebootEsp, updateBuild). Так контракт страниц не меняется (они по-прежнему вызывают saveConfig(), rebootEsp() и т.д.), а реализация живёт в менеджере.
- **getVersionsList, getModInfo, getProfile:** onParced переезжает в менеджер и там выставляет pageReady. Вызов HTTP (getVersionsList, getModInfo, getProfile) не переносить в менеджер. Вариант: при создании менеджера передать опции вида `{ onSystemParsed: async () => { const r = await getVersionsList(); ... wsManager.versionsList = r; }, onProfileParsed: async () => { await getModInfo(); await getProfile(); ... } }`. В onParced в менеджере для страницы system вызывать this.options.onSystemParsed?.(), для profile — this.options.onProfileParsed?.(). App в onMount задаёт эти колбэки (внутри них вызов api/portal и api/firmware и запись результата в wsManager).

**⏸ Проверка 2.** Остановиться. Попросить вас: открыть приложение и проверить, что **все страницы работают** — открываются и при необходимости подгружают данные: **Управление** (dashboard, данные с устройств), **Конфигуратор**, **Подключение**, **Системные**, **Устройства**, **Вход**; при авторизации — **Модули (Profile)**. Ни одна страница не должна зависать на «Загрузка...» или показывать пустой/сломанный контент. После вашего подтверждения — продолжать.

### 4. Совместимость и проверки

- Не менять протокол (команды /gifnoc|, /tsil|, /control|, /params|, /charts|, форматы blob charta/chartb, цепочка firstDevListRequest → /devlist| → devlis → initDevList → connectToAllDevices).
- **Чек-лист сохранности логики перед завершением (все страницы должны работать):**
  - Список устройств: при первой загрузке отправляется `/devlist|` только с ws=0 при firstDevListRequest; по приходу devlis вызывается initDevList → devListOverride или devListCombine → снова connectToAllDevices.
  - Управление (Dashboard): при `/|` рассылка всем; parseAllBlob при layout → combineLayoutsInOne → sortingLayout → `/params|`; при params → updateAllStatuses → `/charts|`; charta/chartb → apdateWidgetByArray по topic. **Обновление виджетов:** при приходе status/params/charta/chartb значения в виджетах (input, toggle, range, chart и т.д.) должны обновляться; после каждого такого обновления в менеджере — emit layoutJsonUpdated.
  - Конфигуратор, Подключение, Системные, Устройства, Вход, Модули (Profile): те же команды и условия pageReady/parsed, что в текущем App.svelte; каждая страница открывается и получает свои данные.
- **⏸ Проверка 3 (финальная).** Остановиться. Попросить вас: убедиться, что **все страницы работают** — Управление (в т.ч. графики), Конфигуратор, Подключение, Системные, Устройства, Вход, Модули (Profile при авторизации); загрузка приложения, смена маршрутов, dropdown, данные с устройств везде прилетают. По чек-листу из [SMOKE_TEST.md](SMOKE_TEST.md). После вашего подтверждения — считать рефакторинг завершённым.

### 5. Итоговая структура

- **eventEmitter.js** — глобальный шинный слой для уведомлений UI.
- **WebSocketManager.js** — класс: состояние + делегирование в api/deviceSocket, lib/deviceConnection, lib/deviceListManager, lib/blobProtocol, lib/wsReconnect; эмиты при изменении layoutJson и deviceList.
- **App.svelte** — создание wsManager, подписка на eventEmitter, синхронизация в локальные переменные для реактивности, handleNavigation, onMount (getUser, connectToAllDevices, wsTestMsgTask, подписки), тонкие обёртки (rebootEsp, saveConfig, ...), разметка и передача props в страницы.
- **api/** и **lib/** — без изменений контрактов; вызываются только из WebSocketManager (и из App только getUser, getVersionsList и т.п.).

Ожидаемый результат: App.svelte сократится до порядка 600–750 строк; одна точка входа для логики устройств (WebSocketManager); связь с UI через события.