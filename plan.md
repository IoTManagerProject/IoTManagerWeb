IoTManagerWeb Refactor Plan (Cursor-friendly, zero behavior change)

0) Жёсткие правила (обязательные)

0.1. Backend = reference only
	•	Backend не меняем.
	•	При сомнениях: ../IoTManager → IoTManager/src/WsServer.cpp и src/modules/virtual/Loging*.

0.2. Протокол/форматы не менять
	•	Команды и разделитель | — без изменений.
	•	Blob протокол: 6-символьный header + размер (4 байта текстом) + payload.
	•	Единственная входящая строка, которую обрабатываем: event.data === "/tstr|". Всё остальное string — игнор.

0.3. Не “улучшать” странности
	•	Не переименовывать apdateWidgetByArray (опечатка намеренно).
	•	Не менять reverse-команды: /tuoyal|, /gifnoc|, /oiranecs|, /sgnittes|, /tsil|, /rorre| и т.д.
	•	Не “чинить” костыли charta (срезы и substring(0, len-1)).

0.4. Комментарии в новом коде — только EN
	•	В существующих файлах можно не трогать.

⸻

1) Инварианты (то, что нельзя сломать)

Сохраняем и проверяем после каждого шага.

1.1. Критичная цепочка: первое устройство → devlist → подключение ко всем

Исходное состояние:
	•	deviceList на старте содержит 1 элемент: { name:"--", id:"--", ip: myip, ws:0, status:false }.
	•	firstDevListRequest = true ставится в onMount перед connectToAllDevices().

Шаг 1: подключаем только ws=0
	•	connectToAllDevices() создаёт сокеты для устройств где status === false || undefined.
	•	Изначально это только индекс 0 → подключение к myip:81.

Шаг 2: в open handler
	•	Только когда firstDevListRequest && ws === 0 → отправляем "/devlist|".
	•	Это должно быть один раз (первый open первого сокета).

Шаг 3: приём devlis
	•	В parseBlob по header === "devlis": incDeviceList = out.json → вызвать initDevList().

Шаг 4: initDevList()
	•	Если firstDevListRequest:
	•	devListOverride() полностью заменяет deviceList = incDeviceList, сортирует,
	•	затем обязательно: deviceList[0].status = true (чтобы не переподключить первый сокет).
	•	Иначе:
	•	devListCombine() (combineArrays по IP + sortList).
	•	Затем: firstDevListRequest = false → снова connectToAllDevices().

Запрещено менять порядок:
onMount → firstDevListRequest=true → connectToAllDevices → open(ws0) → /devlist| → devlis → initDevList → override/combine → connectToAllDevices снова

1.2. Страница List (devices list) — контракт не ломать
	•	Таблица строится по deviceList.
	•	Удалять первую строку нельзя (кнопка удаления только при i > 0).
	•	udps режим:
	•	onModeChange: saveSett() + applicationReboot().
	•	onSaveList:
	•	manual: если showInput → addDevInList() → saveList() → applicationReboot().
	•	manual без showInput → saveList() → applicationReboot().
	•	auto → saveList() + alert о переходе в ручной.
	•	saveList() отправляет /tsil| с JSON deviceList, но статусы сбрасываются в false перед отправкой.

1.3. String vs Blob входящие

В message handler:
	•	typeof event.data === "string":
	•	обрабатывается только точное совпадение "/tstr|" → ack(ws, true).
	•	любые другие строки игнорируем.
	•	Все полезные данные приходят как Blob → только parseBlob/parseAllBlob.

1.4. Отправка данных устройству (WS)
	•	Все команды уходят как строка через wsSendMsg(ws, msg)/sendToAllDevices(msg).
	•	Формат не менять: "/command|payload" где payload JSON/текст.
	•	На backend sendStringToWs(...) отправляет бинарно, но на фронте это всё равно Blob. Исключение — "/tstr|".

1.5. Charts — строгая совместимость

Цепочка:
	•	пришёл layout → sortingLayout(ws) → отправить "/params|".
	•	пришёл params → updateAllStatuses(ws) → отправить "/charts|".
	•	пришли charta/chartb → apdateWidgetByArray(...) по topic.

charta: особый формат
	•	header: bytes 0..6 = "charta"
	•	size: bytes 7..11 (текст)
	•	addJson: bytes 12..size (JSON) через getJsonAsJson(blob, size, out)
	•	payload points: bytes size..end (TEXT) через getPayloadAsTxt(blob, size)
	•	костыль массива: txt = "[" + txt.substring(0, txt.length - 1) + "]" — не менять

chartb:
	•	обычный JSON payload через getPayloadAsJson(blob, size, out).

1.6. Export/Import config — формат файла не менять

Export:
	•	exportJson = { mark: "iotm", config: configJson }
	•	файл: pretty JSON + "\n\nscenario=>" + scenarioTxt
	•	имя: export.json, MIME application/json

Import:
	•	читать текст
	•	проверки по порядку:
	1.	содержит "scenario=>"
	2.	jsonPart парсится
	3.	json.mark === "iotm"
	•	затем (после confirm):
	•	configJson = json.config
	•	scenarioTxt = txtPart
	•	перед присвоением: configJson = [], scenarioTxt = "" для реактивности

1.7. Backend reference locations (для сверки)
	•	IoTManager/src/WsServer.cpp — текстовые команды и отправка
	•	IoTManager/src/modules/virtual/Loging*/ — charta/chartb
	•	IoTManager/data_svelte/ — test fixtures (items/config/widgets/layout/scenario/settings…)

⸻

2) Якоря для поиска в коде (вместо line numbers)

Cursor должен ориентироваться по строкам/сигнатурам.

2.1. devlist chain anchors
	•	"/devlist|" (только в open handler)
	•	"devlis" (в parseBlob)
	•	firstDevListRequest
	•	deviceList[0].status = true
	•	connectToAllDevices()

2.2. message handler anchors
	•	event.data === "/tstr|" (строгая проверка)
	•	event.data instanceof Blob

2.3. charts anchors
	•	"charta" / "chartb"
	•	getJsonAsJson(blob, size, out)
	•	txt.substring(0, txt.length - 1)
	•	"/params|", "/charts|"

2.4. export/import anchors
	•	"scenario=>"
	•	mark: "iotm"
	•	export.json

⸻

3) Backups (Step 1 — MUST DO)

3.1. Create _backup_refactor/ and copy files

Create folder _backup_refactor/ in project root (or src/_backup_refactor/).

Copy:
	•	src/App.svelte
	•	src/main.js
	•	src/pages/{Config,Connection,Dashboard,List,Login,Profile,System}.svelte
	•	src/widgets/{Chart,Input,Range,Toggle,Anydata}.svelte
	•	src/components/{Alarm,Card,Modal,ModalPass,Progress}.svelte

Optional: add _backup_refactor/ to .gitignore.

DoD
	•	Backup folder exists and contains exact copies.

Quick check
	•	diff -ru src/App.svelte _backup_refactor/App.svelte shows identical before any edits.

⸻

4) Refactor Steps (small, safe, incremental)

Важное правило для Cursor: каждый шаг — отдельный минимальный дифф, после него smoke-check.

Step A — HTTP transport wrapper (priority 1, low risk)

Goal: вынести fetch-логику из App/pages в src/api/.

A1. Create src/api/http.js
	•	helper requestJson({ url, method, headers, body, mode })
	•	returns { ok, status, data } or throws with structured error (но не ломаем поведение: лучше возвращать ok=false).

DoD
	•	New module exists, used by ровно одной функцией (например getUser) без изменения результата.

A2. Create src/api/portal.js
	•	Move portal calls:
	•	getUser (/api/user/email, Bearer token token_iotm2)
	•	getModInfo, getProfile (portal/compiler) — как сейчас
	•	getConfigs, makePost (Config page) — как сейчас

DoD
	•	В App/pages только импорт и вызов, UI поведение не меняется.

A3. Create src/api/firmware.js
	•	Move getVersionsList (ver.json from settingsJson.serverip)

DoD
	•	Версии как раньше отображаются/подгружаются.

Checks
	•	Логин/профиль/конфиг-портал/версия работают как до.

⸻

Step B — WebSocket transport wrapper deviceSocket.js (priority 2, medium risk)

Goal: вынести только создание сокета + send/isOpen. Никакого протокола, никакого parse, никакого reconnect.

B1. Create src/api/deviceSocket.js
Exports:
	•	createConnection(wsIndex, ip, callbacks)
	•	const socket = new WebSocket("ws://" + ip + ":81")
	•	socket.binaryType = "blob" (fix bug: on instance)
	•	socket.addEventListener("open"...) etc
	•	store sockets by wsIndex in private map/array
	•	send(wsIndex, msg) (only if open)
	•	isOpen(wsIndex)
	•	optional getSocket(wsIndex) (only if needed for debug parity)

Callbacks object:

{
  onOpen(wsIndex, event),
  onMessage(wsIndex, data, event),
  onClose(wsIndex, event),
  onError(wsIndex, event),
}

DoD
	•	App still controls:
	•	when to send /devlist|
	•	whether to parseBlob/parseAllBlob
	•	ack/reconnect
	•	Only transport moved.

B2. Replace wsConnect/wsSendMsg usage minimally
	•	Keep App’s logic structure intact.
	•	wsConnect(ws) becomes something like:
	•	compute ip via existing getIP(ws)
	•	call deviceSocket.createConnection(ws, ip, { callbacks calling existing handlers })

Hard constraints
	•	open handler must still contain:
	•	if (firstDevListRequest && ws === 0) wsSendMsg(ws, "/devlist|");
	•	(или эквивалент через deviceSocket.send)
	•	message handler must still contain strict /tstr| check and Blob-only parsing.

DoD
	•	First device → devlist chain works unchanged.
	•	binaryType is correct on each socket instance.

Checks (manual)
	•	On first open of ws=0 exactly one /devlist| goes out.
	•	devlis arrives and triggers initDevList.
	•	After that, new sockets created for other devices.

⸻

Step C — UI layout components (priority 3, low risk)

Goal: split header/nav/footer into components without changing props/logic.

Create:
	•	src/components/layout/AppHeader.svelte
	•	src/components/layout/AppNav.svelte
	•	src/components/layout/AppFooter.svelte (optional)

DoD
	•	App.svelte becomes smaller but routes/props unchanged.
	•	No logic moved besides markup.

⸻

Step D — Extract logic into lib/ (priority 3–4, highest risk; do in micro-steps)

Golden rule: move one “узкий контракт” at a time.

D1. src/lib/deviceListManager.js
Exports:
	•	sortList(list)
	•	combineArrays(a, b) (merge by IP, preserve ws/index rules)
	•	devListOverride(deviceList, incDeviceList):
	•	returns new list or mutates (choose one, but keep App reactive updates)
	•	MUST set deviceList[0].status = true
	•	devListCombine(deviceList, incDeviceList)
	•	initDevList({ deviceList, incDeviceList, firstDevListRequest }):
	•	chooses override vs combine
	•	returns { deviceList: newList, firstDevListRequest: false }

DoD
	•	App still calls initDevList() from devlis branch, and then calls connectToAllDevices() exactly like before.

Checks
	•	first device is not reconnected (status true for index 0 after override).

D2. src/lib/deviceConnection.js
Exports:
	•	getIP(wsIndex, deviceList) (single source of truth)
	•	connectToAllDevices({ deviceList, createConnection })
	•	createConnection is from api/deviceSocket
	•	connect only devices with status false/undefined
	•	createOpenHandler({ firstDevListRequestRef, currentPageNameRef, selectedWsRef, markDeviceStatus, send, sendCurrentPageNameToSelectedWs })
	•	returns onOpen(wsIndex)
	•	MUST keep logic:
	•	markDeviceStatus(ws, true)
	•	if firstDevListRequest && ws===0 → send(”/devlist|”)
	•	page request logic as before
	•	handleDevListReceived({ incDeviceList, getState, setState, initDevList, connectToAllDevices })
	•	calls deviceListManager.initDevList
	•	then calls connectToAllDevices again

DoD
	•	The entire chain “first device → devlis → connect all” remains identical, only moved.

Checks
	•	same order of events, same number of connects/sends.

D3. src/lib/blobProtocol.js
Goal: move Blob parsing mechanics (not “what to do after parsing”).
Exports:
	•	getPayloadAsJson, getPayloadAsTxt, getJsonAsJson
	•	parseBlob(blob, ws, handlers)
	•	parseAllBlob(blob, ws, handlers)

handlers is a map from header to callback:
	•	itemsj, widget, config, scenar, settin, ssidli, errors, devlis, prfile, otaupd, corelg
	•	for devlis, handler must call handleDevListReceived(...) (passed from App)

Charts handling inside parseAllBlob must preserve:
	•	layout flow triggers /params|
	•	params flow triggers /charts|
	•	charta slicing + substring hack
	•	chartb normal JSON

DoD
	•	App owns: state vars, onParced, pageReady, and when to clear/reset.
	•	blobProtocol only parses and calls callbacks.

D4. src/lib/wsReconnect.js
Exports:
	•	ack(ws, st) with per-ws timeouts and ping calc
	•	wsTestMsgTask() style function (or start/stop wrapper)

Hard constraints
	•	ack timeout logic stays identical:
	•	on false → start waiting timeout (18s) → mark offline
	•	on true → clear timeout and compute ping
	•	send heartbeat /tst| for online sockets, reconnect offline sockets.

DoD
	•	Heartbeat and reconnect behavior unchanged in UI (percent/timers etc).

⸻

5) App.svelte end state (what remains)

App should keep:
	•	All state variables (deviceList/layoutJson/paramsJson/parsed/pageReady/settingsJson/configJson/scenarioTxt/etc).
	•	Routing (tinro), handleNavigation, UI gating (Alarm vs Routes).
	•	onParced logic and calls to HTTP functions (getVersionsList/getModInfo/getProfile).
	•	Wiring: builds handler maps and passes them into deviceSocket, blobProtocol, deviceConnection, wsReconnect.

App should NOT own:
	•	low-level WS creation (deviceSocket)
	•	list merge/sort logic (deviceListManager)
	•	blob slicing/parsing mechanics (blobProtocol)
	•	reconnect/ack timer internals (wsReconnect)
	•	connection lifecycle logic (deviceConnection)

⸻

6) Smoke Test (manual, but strict)

Run after each step.

6.1. Boot + devlist chain
	•	Open app with one known IP (myip).
	•	Confirm:
	1.	connects only ws=0 initially
	2.	on open(ws=0) sends /devlist|
	3.	receives devlis (Blob)
	4.	initDevList runs, override sets deviceList[0].status = true
	5.	connects to other devices (ws=1..n)

6.2. Dashboard chain
	•	On /:
	•	after layout → sends /params|
	•	after params → sends /charts|
	•	receives charta/chartb updates widgets by topic

6.3. List page
	•	Cannot delete first row.
	•	Add device in manual mode works.
	•	Save list sends /tsil| with statuses reset false.
	•	udps toggle triggers saveSett + reboot.

6.4. Config page
	•	Export produces JSON + scenario=>.
	•	Import validates scenario=>, JSON, mark=“iotm”.
	•	After import config/scenario apply correctly.
	•	moduleOrder buttons (btn*) still send /order|....

6.5. Heartbeat
	•	/tst| goes out periodically, /tstr| comes back as string and triggers ack only.
	•	Any other string message is ignored.

⸻

7) “Ripgrep checklist” (after each step)

Cursor должен прогонять поиск и убедиться, что паттерны на месте.
	•	rg -n 'firstDevListRequest' src/App.svelte src/lib -S
	•	rg -n '"/devlist\|"' src -S
	•	rg -n 'event\.data === "/tstr\|"' src -S
	•	rg -n 'instanceof Blob' src -S
	•	rg -n 'charta|chartb' src -S
	•	rg -n 'substring\(0, txt\.length - 1\)' src -S
	•	rg -n 'scenario=>' src -S
	•	rg -n 'mark:\s*"iotm"' src -S
	•	rg -n 'apdateWidgetByArray' src -S

⸻

8) Backend reference notes (quick)
	•	Text commands parsing: IoTManager/src/WsServer.cpp (headerStr до |)
	•	sendFileToWsByFrames: binary frames with 6-char headers (itemsj/widget/config/scenar/settin/layout/params/devlis/prfile/otaupd/charta…)
	•	sendStringToWs: header|0012|payload but sent as binary (front receives Blob)
	•	Exception: /tstr| sent as WStype_TEXT and arrives as string
	•	Logging modules: IoTManager/src/modules/virtual/Loging*/ produce charta/chartb
	•	Test fixtures: IoTManager/data_svelte/

⸻

9) Target folder tree (after completion)

src/
  api/
    http.js
    portal.js
    firmware.js
    deviceSocket.js
  lib/
    blobProtocol.js
    deviceListManager.js
    deviceConnection.js
    wsReconnect.js
    dashboardLayout.js   # optional
  components/layout/
    AppHeader.svelte
    AppNav.svelte
    AppFooter.svelte
  App.svelte
  pages/
  widgets/
  ...
_backup_refactor/


