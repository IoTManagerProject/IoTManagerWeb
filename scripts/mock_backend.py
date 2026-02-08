#!/usr/bin/env python3
"""
Mock backend for IoTManager frontend (dev mode).
Emulates devices over one WebSocket server (port 81) and HTTP for /iotm/ver.json.

Frontend flow (App.svelte) — must match exactly:

1) Initial state (L99–108)
   - deviceList = [{ name: "--", id: "--", ip: myip, ws: 0, status: false }]
   - myip = device from which web loaded (e.g. 127.0.0.1 in dev)

2) onMount (L188–200)
   - firstDevListRequest = true
   - connectToAllDevices()  // "сначала подключимся к известному нам ip этого устройства"

3) connectToAllDevices (L226–236)
   - For each deviceList[i]: deviceList[i].ws = i
   - For each with status === false || undefined: wsConnect(i), wsEventAdd(i)
   - So initially only ws=0 connects (one WebSocket to myip:81)

4) wsConnect(ws) (L269–277)
   - getIP(ws) from deviceList (device.ws === ws → device.ip)
   - new WebSocket("ws://" + ip + ":81")

5) On socket open (L293–308)
   - markDeviceStatus(ws, true)
   - If firstDevListRequest && ws === 0: wsSendMsg(ws, "/devlist|")  // только с первого сокета
   - Then send currentPageName (e.g. /| or /list|) to selected or all

6) We respond to /devlist| with blob header "devlis", payload = JSON array of devices.
   - Frontend parseBlob (L347–354): header = blob.slice(0,6).text(), size = blob.slice(7,11).text()
   - getPayloadAsJson(blob, size, out) (L578–589): partBlob = blob.slice(size, blob.length) — size coerced to number (payload start offset 12)
   - So frame = header(6) + "|0012|"(6) + payload; frontend expects payload from byte 12.

7) On "devlis" (L429–436): incDeviceList = out.json, await initDevList()

8) initDevList (L695–710)
   - If firstDevListRequest: devListOverride() else devListCombine()
   - firstDevListRequest = false
   - onParced(), selectedDeviceDataRefresh(), connectToAllDevices()

9) devListOverride (L714–719): deviceList = incDeviceList; sortList(deviceList); deviceList[0].status = true
   - First list entry must be "this device" (same IP). sortList keeps first element first, sorts rest by name.

10) Second connectToAllDevices(): now deviceList has N entries; [0].status already true, so only indices 1..N-1 get wsConnect → we open more sockets (e.g. second device same IP → second connection to mock).

11) saveList (L898–905): devListForSave = copy of deviceList, all .status = false, wsSendMsg(selectedWs, "/tsil|" + JSON.stringify(devListForSave))
    We store; when udps=0, next /devlist| returns saved list.
"""

import argparse
import asyncio
import json
import math
import socket
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional

try:
    import websockets
except ImportError:
    raise SystemExit("Install: pip install websockets")

# Payload starts at byte 12 (header|0012| = 12 bytes)
WS_HEADER_PREFIX = "|0012|"
WS_PREFIX_BYTES = 12


def make_binary_frame(header: str, payload: str) -> bytes:
    """Build binary frame: header(6 chars)|0012| + payload (UTF-8). Backend: sendStringToWs sends same as binary."""
    if len(header) != 6:
        header = (header + "      ")[:6]
    prefix = (header + WS_HEADER_PREFIX).encode("utf-8")
    body = payload.encode("utf-8")
    return prefix + body


def get_layout(device_slot: int) -> list:
    """Layout: 4 pages by meaning (Sensors, Charts, Relays/Light, Params). All 5 widget types."""
    prefix = f"/mock/d{device_slot}"
    return [
        # --- 1. Сенсоры: read-only anydata ---
        {"ws": device_slot, "topic": f"{prefix}/temp", "page": "Сенсоры", "widget": "anydata", "descr": "Temperature", "status": "22.5", "after": "°C"},
        {"ws": device_slot, "topic": f"{prefix}/hum", "page": "Сенсоры", "widget": "anydata", "descr": "Humidity", "status": "45", "after": "%"},
        {"ws": device_slot, "topic": f"{prefix}/pressure", "page": "Сенсоры", "widget": "anydata", "descr": "Pressure", "status": "1013", "after": " hPa"},
        {"ws": device_slot, "topic": f"{prefix}/voltage", "page": "Сенсоры", "widget": "anydata", "descr": "Voltage", "status": "3.28", "after": " V"},
        {"ws": device_slot, "topic": f"{prefix}/power", "page": "Сенсоры", "widget": "anydata", "descr": "Power", "status": "120", "after": " W", "color": [{"level": 0, "value": ""}, {"level": 200, "value": "#009933"}, {"level": 2000, "value": "#FF9900"}]},
        {"ws": device_slot, "topic": f"{prefix}/rssi", "page": "Сенсоры", "widget": "anydata", "descr": "WiFi RSSI", "status": "-65", "after": " dBm"},
        # --- 2. Графики 1 и 2 (two cards) ---
        {"ws": device_slot, "topic": f"{prefix}/log", "page": "Графики 1", "widget": "chart", "descr": "Temperature log", "status": [], "maxCount": 100},
        {"ws": device_slot, "topic": f"{prefix}/log2", "page": "Графики 1", "widget": "chart", "descr": "Humidity log", "status": [], "maxCount": 100},
        {"ws": device_slot, "topic": f"{prefix}/log3", "page": "Графики 2", "widget": "chart", "descr": "Power log", "status": [], "maxCount": 100},
        {"ws": device_slot, "topic": f"{prefix}/logBar", "page": "Графики 2", "widget": "chart", "type": "bar", "descr": "Bar chart", "status": [], "maxCount": 100},
        # --- 3. Реле и свет: toggles + dimmer ---
        {"ws": device_slot, "topic": f"{prefix}/relay1", "page": "Реле и свет", "widget": "toggle", "descr": "Relay 1", "status": "0", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/relay2", "page": "Реле и свет", "widget": "toggle", "descr": "Relay 2", "status": "1", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/relay3", "page": "Реле и свет", "widget": "toggle", "descr": "Light", "status": "0", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/fan", "page": "Реле и свет", "widget": "toggle", "descr": "Fan", "status": "0", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/dimmer", "page": "Реле и свет", "widget": "range", "descr": "Dimmer", "status": "50", "min": 0, "max": 100, "after": "%", "sent": False},
        # --- 4. Параметры: range + inputs ---
        {"ws": device_slot, "topic": f"{prefix}/volume", "page": "Параметры", "widget": "range", "descr": "Volume", "status": "70", "min": 0, "max": 100, "after": "%", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/setpoint", "page": "Параметры", "widget": "range", "descr": "Setpoint", "status": "21", "min": 15, "max": 30, "after": "°C", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/settemp", "page": "Параметры", "widget": "input", "descr": "Set temp", "status": "20.5", "type": "number", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/label", "page": "Параметры", "widget": "input", "descr": "Label", "status": "Room 1", "type": "text", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/alarmtime", "page": "Параметры", "widget": "input", "descr": "Alarm time", "status": "08:30", "type": "time", "sent": False},
        {"ws": device_slot, "topic": f"{prefix}/eventdate", "page": "Параметры", "widget": "input", "descr": "Event date", "status": "2025-02-06", "type": "date", "sent": False},
    ]


# Per-slot state for controls; keys = last segment of topic (id). Merged into get_params.
_params_state: dict = {}  # slot -> { topic_id: value }

def _topic_id(topic: str) -> str:
    """Last segment of topic (e.g. /mock/d0/relay1 -> relay1)."""
    if not topic or "/" not in topic:
        return topic or ""
    return topic.rstrip("/").split("/")[-1]


def _ensure_params_for_layout(slot: int, layout: list) -> None:
    """Add missing topic ids from layout to _params_state[slot] so added widgets get data."""
    state = _get_params_state(slot)
    for w in layout:
        topic = w.get("topic") or ""
        wid = _topic_id(topic)
        if not wid or wid in state:
            continue
        widget_type = (w.get("widget") or "").lower()
        if "chart" in widget_type:
            state[wid] = ""
        elif "toggle" in widget_type:
            state[wid] = "0"
        elif "range" in widget_type:
            state[wid] = str(w.get("min", 0) if isinstance(w.get("min"), (int, float)) else 50)
        elif "input" in widget_type:
            itype = w.get("type") or "number"
            if itype == "number":
                state[wid] = "20"
            elif itype == "text":
                state[wid] = "Room"
            elif itype == "time":
                state[wid] = "08:00"
            elif itype == "date":
                state[wid] = "2025-01-01"
            else:
                state[wid] = "0"
        else:
            state[wid] = "0"


def _get_params_state(slot: int) -> dict:
    if slot not in _params_state:
        prefix = f"/mock/d{slot}"
        _params_state[slot] = {
            "temp": "22.5", "hum": "45", "pressure": "1013", "voltage": "3.28", "power": "120", "rssi": "-65",
            "relay1": "0", "relay2": "1", "relay3": "0", "fan": "0",
            "dimmer": "50", "volume": "70", "setpoint": "21",
            "settemp": "20.5", "label": "Room 1", "alarmtime": "08:30", "eventdate": "2025-02-06",
            "log": "", "log2": "", "log3": "", "logBar": "",
        }
    return _params_state[slot]


def get_params(device_slot: int, layout: Optional[list] = None) -> dict:
    """Params JSON: topic id -> value (for layout widgets). If layout given, ensure all its topic ids have state."""
    state = _get_params_state(device_slot)
    if layout:
        _ensure_params_for_layout(device_slot, layout)
    return dict(state)


def get_chart_data(topic: str, points: int = 20, base_val: float = 20.0, amplitude: float = 5.0) -> dict:
    """Generate chart points: status array of {x: unix_sec, y1: number}."""
    import time
    now = int(time.time())
    step = 3600  # 1 hour
    status = []
    for i in range(points, 0, -1):
        t = now - i * step
        val = base_val + amplitude * math.sin(i * 0.5) + (points - i) * 0.1
        status.append({"x": t, "y1": round(val, 2)})
    return {"topic": topic, "maxCount": 100, "status": status}


# Stored settings per slot (for save/load on System and Connection pages)
_settings_store: dict = {}  # slot -> dict


def get_settings(http_host: str, http_port: int, slot: int = 0) -> dict:
    """Settings JSON; serverip must point to mock HTTP for ver.json. System page needs timezone, wg, log, mqttin, i2c, pinSCL, pinSDA, i2cFreq."""
    base = {
        "name": f"MockDevice-{slot}",
        "apssid": "IoTmanager",
        "appass": "",
        "routerssid": "",
        "routerpass": "",
        "timezone": 2,
        "ntp": "pool.ntp.org",
        "weblogin": "admin",
        "webpass": "admin",
        "mqttServer": "",
        "mqttPort": 1883,
        "mqttPrefix": "/mock",
        "mqttUser": "",
        "mqttPass": "",
        "serverip": f"http://{http_host}:{http_port}",
        "serverlocal": f"http://{http_host}:{http_port}",
        "log": False,
        "udps": 1,
        "settings_": "",
        "wg": "group1",
        "mqttin": False,
        "i2c": False,
        "pinSCL": 0,
        "pinSDA": 0,
        "i2cFreq": 100000,
    }
    if slot in _settings_store:
        base.update(_settings_store[slot])
    return base


def get_errors(slot: int = 0) -> dict:
    """Errors JSON for System page (per device): bn, bt, bver, wver, timenow, upt, uptm, uptw, rssi, heap, freeBytes, fl, rst."""
    import time
    ts = int(time.time())
    # Different system info per device slot so UI shows which device is selected
    return {
        "bn": f"esp32-d{slot}",
        "bt": f"2024-0{1 + slot}-0{1 + slot} 12:00",
        "bver": f"1.0.{slot}",
        "wver": f"4.2.{slot}",
        "timenow": str(ts),
        "upt": f"{1 + slot}d 0{2 + slot}:{30 + slot * 5}",
        "uptm": f"{1 + slot}d 0{2 + slot}:{30 + slot * 5}",
        "uptw": f"{1 + slot}d 0{2 + slot}:{30 + slot * 5}",
        "rssi": -65 + slot * 10,
        "heap": str(120000 - slot * 10000),
        "freeBytes": f"{2 - slot * 0.2:.1f}M",
        "fl": str(1024 + slot * 512),
        "rst": "Software reset" if slot == 0 else "Power-on reset",
    }


def get_ssid_list() -> dict:
    """SSID list for connection page."""
    return {"0": "MockNetwork", "1": "OtherNetwork"}


# Backend getThisDevice() fields: wg, ip, id, name, status (bool), fv. Frontend table: ws+1, name, ip, id, fv, status, ping (ws assigned by frontend).
def _normalize_device_entry(entry: dict, default_ip: str = "127.0.0.1") -> dict:
    """Ensure device entry has all fields required by List table and backend contract."""
    if not isinstance(entry, dict):
        return {"name": "--", "id": "--", "ip": default_ip, "status": False, "fv": "-", "wg": ""}
    return {
        "name": entry.get("name") if entry.get("name") is not None else "--",
        "id": entry.get("id") if entry.get("id") is not None else "--",
        "ip": entry.get("ip") if entry.get("ip") is not None else default_ip,
        "status": bool(entry.get("status")) if entry.get("status") is not None else False,
        "fv": str(entry["fv"]) if entry.get("fv") is not None else "-",
        "wg": entry.get("wg", ""),
    }


def _normalize_devlist(arr: list, default_ip: str = "127.0.0.1") -> list:
    """Return array of normalized device entries; frontend assigns ws by index."""
    if not isinstance(arr, list) or len(arr) == 0:
        return []
    return [_normalize_device_entry(e, default_ip) for e in arr]


def get_devlist(host: str) -> list:
    """Default device list from 'heap' (udps!=0). First entry = this device (IP we're connected to); frontend sets deviceList[0].status=true. Rest = other devices; frontend connects to each."""
    return _normalize_devlist([
        {"name": "Mock Device 1", "ip": host, "id": "mock-dev-1", "status": False, "fv": "1.0.0", "wg": "group1"},
        {"name": "Mock Device 2", "ip": host, "id": "mock-dev-2", "status": False, "fv": "1.0.0", "wg": "group1"},
    ], host)


# Saved device list from /tsil| (reversed "list"). When udps=0 backend returns from "file", else from "heap" (default).
_saved_devlist: Optional[list] = None
# Configurator: saved layout/config/scenario per slot (from /tuoyal|, /gifnoc|, /oiranecs|)
_saved_layout: dict = {}  # slot -> list (layout JSON array)
_saved_config: dict = {}  # slot -> list (config JSON array)
_saved_scenario: dict = {}  # slot -> str (scenario text)


def get_items_json() -> list:
    """Items list covering all widget types (anydata, chart, toggle, range, input)."""
    return [
        {"name": "Выберите элемент", "num": 0},
        {"header": "virtual_elments"},
        # anydata
        {"global": 0, "name": "Text", "type": "Reading", "subtype": "Variable", "id": "text", "widget": "anydataDef", "page": "Сенсоры", "descr": "Text", "num": 1},
        {"global": 0, "name": "Temperature", "type": "Reading", "subtype": "AnalogAdc", "id": "temp", "widget": "anydataTmp", "page": "Сенсоры", "descr": "Temperature", "num": 2},
        {"global": 0, "name": "Humidity", "type": "Reading", "subtype": "Variable", "id": "hum", "widget": "anydataDef", "page": "Сенсоры", "descr": "Humidity", "num": 3},
        {"global": 0, "name": "Pressure", "type": "Reading", "subtype": "Variable", "id": "pressure", "widget": "anydataDef", "page": "Сенсоры", "descr": "Pressure", "num": 4},
        {"global": 0, "name": "Voltage", "type": "Reading", "subtype": "Variable", "id": "voltage", "widget": "anydataDef", "page": "Сенсоры", "descr": "Voltage", "num": 5},
        {"global": 0, "name": "Power", "type": "Reading", "subtype": "Variable", "id": "power", "widget": "anydataDef", "page": "Сенсоры", "descr": "Power", "num": 6},
        {"global": 0, "name": "RSSI", "type": "Reading", "subtype": "Variable", "id": "rssi", "widget": "anydataDef", "page": "Сенсоры", "descr": "WiFi RSSI", "num": 7},
        # chart
        {"global": 0, "name": "Chart line", "type": "Writing", "subtype": "Loging", "id": "log", "widget": "chart2", "page": "Графики 1", "descr": "Chart", "num": 10, "points": 100},
        {"global": 0, "name": "Chart bar", "type": "Writing", "subtype": "Loging", "id": "logBar", "widget": "chartBar", "page": "Графики 2", "descr": "Bar chart", "num": 11, "points": 100},
        # toggle
        {"global": 0, "name": "Toggle", "type": "Writing", "subtype": "ButtonOut", "id": "relay", "widget": "toggleDef", "page": "Реле и свет", "descr": "Relay", "num": 20},
        {"global": 0, "name": "Light", "type": "Writing", "subtype": "ButtonOut", "id": "light", "widget": "toggleDef", "page": "Реле и свет", "descr": "Light", "num": 21},
        {"global": 0, "name": "Fan", "type": "Writing", "subtype": "ButtonOut", "id": "fan", "widget": "toggleDef", "page": "Реле и свет", "descr": "Fan", "num": 22},
        # range
        {"global": 0, "name": "Dimmer", "type": "Writing", "subtype": "Variable", "id": "dimmer", "widget": "rangeDef", "page": "Параметры", "descr": "Dimmer", "num": 30},
        {"global": 0, "name": "Volume", "type": "Writing", "subtype": "Variable", "id": "volume", "widget": "rangeDef", "page": "Параметры", "descr": "Volume", "num": 31},
        {"global": 0, "name": "Setpoint", "type": "Writing", "subtype": "Variable", "id": "setpoint", "widget": "rangeDef", "page": "Параметры", "descr": "Setpoint", "num": 32},
        # input
        {"global": 0, "name": "Input number", "type": "Reading", "subtype": "Variable", "id": "settemp", "widget": "inputNumber", "page": "Параметры", "descr": "Number", "num": 40},
        {"global": 0, "name": "Input text", "type": "Reading", "subtype": "Variable", "id": "label", "widget": "inputText", "page": "Параметры", "descr": "Label", "num": 41},
        {"global": 0, "name": "Input time", "type": "Reading", "subtype": "Variable", "id": "alarmtime", "widget": "inputTime", "page": "Параметры", "descr": "Time", "num": 42},
        {"global": 0, "name": "Input date", "type": "Reading", "subtype": "Variable", "id": "eventdate", "widget": "inputDate", "page": "Параметры", "descr": "Date", "num": 43},
    ]


def get_widgets_json() -> list:
    """All frontend widget types: anydata, chart (line + bar), toggle, range, input (number, text, time, date)."""
    return [
        {"name": "anydataDef", "label": "Text", "widget": "anydata", "icon": ""},
        {"name": "anydataTmp", "label": "Temperature", "widget": "anydata", "after": "°C", "icon": "speedometer"},
        {"name": "chart2", "label": "Chart", "widget": "chart", "icon": ""},
        {"name": "chartBar", "label": "Chart bar", "widget": "chart", "type": "bar", "icon": ""},
        {"name": "toggleDef", "label": "Toggle", "widget": "toggle", "icon": ""},
        {"name": "rangeDef", "label": "Range", "widget": "range", "min": 0, "max": 100, "icon": ""},
        {"name": "inputNumber", "label": "Number", "widget": "input", "type": "number", "icon": ""},
        {"name": "inputText", "label": "Text", "widget": "input", "type": "text", "icon": ""},
        {"name": "inputTime", "label": "Time", "widget": "input", "type": "time", "icon": ""},
        {"name": "inputDate", "label": "Date", "widget": "input", "type": "date", "icon": ""},
    ]


def get_config_json() -> list:
    """Config (array of module configs)."""
    return []


def get_ota_json() -> dict:
    """OTA versions placeholder."""
    return {}


def get_profile_json() -> dict:
    """Flash profile placeholder."""
    return {"board": "esp32", "version": "1.0.0"}


# Global: HTTP host/port for settings.serverip (set at startup)
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 8080
# Slot counter for WebSocket connections
_next_slot = 0
_slot_lock = threading.Lock()

# Connected clients (ws, slot) for periodic broadcast. Backend: publishStatusWs, periodicWsSend, params on change.
_connections: list = []  # list of (websocket, slot)


def assign_slot() -> int:
    global _next_slot
    with _slot_lock:
        s = _next_slot % 2
        _next_slot += 1
        return s


async def handle_ws_message(ws, message: str, slot: int) -> None:
    """Handle text command from frontend and send responses."""
    global _saved_devlist, _saved_layout, _saved_config, _saved_scenario
    if "|" not in message:
        return
    cmd = message.split("|")[0] + "|"

    # Heartbeat/ping: same as original IoTManager WsServer.cpp — reply immediately so frontend can measure RTT (device.ping)
    if cmd == "/tst|":
        await ws.send("/tstr|")
        return
    if cmd == "/pi|":
        await ws.send("/po|")
        return

    # Binary responses
    def send_bin(header: str, payload: str) -> asyncio.Future:
        return ws.send(make_binary_frame(header, payload))

    if cmd == "/|":
        layout = _saved_layout.get(slot) if slot in _saved_layout else get_layout(slot)
        await send_bin("layout", json.dumps(layout))
        # Send params immediately so front has data (incl. for saved-layout widgets)
        await send_bin("params", json.dumps(get_params(slot, layout)))
        return

    if cmd == "/params|":
        layout = _saved_layout.get(slot) if slot in _saved_layout else get_layout(slot)
        params = get_params(slot, layout)
        await send_bin("params", json.dumps(params))
        return

    if cmd == "/charts|":
        layout = _saved_layout.get(slot) if slot in _saved_layout else get_layout(slot)
        for w in layout:
            if w.get("widget") != "chart" or not w.get("topic"):
                continue
            t = w["topic"]
            if "log2" in t:
                base_val, amp = 45.0, 15.0
            elif "log3" in t:
                base_val, amp = 100.0, 50.0
            else:
                base_val, amp = 20.0, 5.0
            chart = get_chart_data(w["topic"], base_val=base_val, amplitude=amp)
            await send_bin("chartb", json.dumps(chart))
        return

    if cmd == "/config|":
        await send_bin("itemsj", json.dumps(get_items_json()))
        await send_bin("widget", json.dumps(get_widgets_json()))
        config_data = _saved_config[slot] if slot in _saved_config else get_config_json()
        await send_bin("config", json.dumps(config_data))
        scenario_txt = _saved_scenario.get(slot, "// mock scenario\n")
        await send_bin("scenar", scenario_txt if isinstance(scenario_txt, str) else "// mock scenario\n")
        await send_bin("settin", json.dumps(get_settings(HTTP_HOST, HTTP_PORT, slot)))
        return

    if cmd == "/connection|":
        await send_bin("widget", json.dumps(get_widgets_json()))
        await send_bin("config", json.dumps(get_config_json()))
        await send_bin("settin", json.dumps(get_settings(HTTP_HOST, HTTP_PORT, slot)))
        await send_bin("ssidli", json.dumps(get_ssid_list()))
        await send_bin("errors", json.dumps(get_errors(slot)))
        return

    if cmd == "/list|":
        await send_bin("settin", json.dumps(get_settings(HTTP_HOST, HTTP_PORT, slot)))
        return

    if cmd == "/devlist|":
        host = HTTP_HOST
        settings = get_settings(HTTP_HOST, HTTP_PORT, slot)
        udps = settings.get("udps", 1)
        # Backend: udps!=0 -> list from heap (UDP auto); udps=0 -> list from file (saved). Always normalize for table.
        if udps == 0 and _saved_devlist and len(_saved_devlist) > 0:
            list_to_send = _normalize_devlist(_saved_devlist, host)
        else:
            list_to_send = get_devlist(host)
        await send_bin("devlis", json.dumps(list_to_send))
        return

    if cmd == "/system|":
        await send_bin("errors", json.dumps(get_errors(slot)))
        await send_bin("settin", json.dumps(get_settings(HTTP_HOST, HTTP_PORT, slot)))
        return

    if cmd == "/dev|":
        await send_bin("errors", json.dumps(get_errors(slot)))
        await send_bin("settin", json.dumps(get_settings(HTTP_HOST, HTTP_PORT, slot)))
        await send_bin("config", json.dumps(get_config_json()))
        await send_bin("itemsj", json.dumps(get_items_json()))
        return

    if cmd == "/profile|":
        await send_bin("otaupd", json.dumps(get_ota_json()))
        await send_bin("prfile", json.dumps(get_profile_json()))
        return

    # /control|key/value - frontend sends id (e.g. relay1) and value; update state and echo status
    if cmd == "/control|":
        payload = message[len(cmd):].strip()
        if "/" in payload:
            key, value = payload.split("/", 1)
            state = _get_params_state(slot)
            state[key] = value
            topic = f"/mock/d{slot}/{key}"
            await send_bin("status", json.dumps({"topic": topic, "status": value}))
        return

    # /sgnittes| + JSON - save system settings
    if cmd == "/sgnittes|":
        payload = message[len(cmd):].strip()
        if payload:
            try:
                data = json.loads(payload)
                _settings_store[slot] = data
                await send_bin("errors", json.dumps(get_errors(slot)))
            except json.JSONDecodeError:
                pass
        return

    # /tsil| + JSON array — save device list (reversed "list"). Backend writes to devlist.json; next /devlist| when udps=0 returns this.
    if cmd == "/tsil|":
        payload = message[len(cmd) :].strip()
        if payload:
            try:
                data = json.loads(payload)
                if isinstance(data, list) and len(data) > 0:
                    _saved_devlist = _normalize_devlist(data, HTTP_HOST)
                    print(f"[mock] devlist saved, {len(_saved_devlist)} device(s)")
            except (json.JSONDecodeError, TypeError):
                pass
        return

    if cmd == "/clean|":
        # Clear logs (no-op; could clear chart data in real device)
        return

    if cmd == "/reboot|":
        # Reboot (no-op in mock)
        return

    # Save configurator data (layout, config, scenario) per slot
    if cmd == "/tuoyal|":
        payload = message[len(cmd) :].strip()
        if payload:
            try:
                data = json.loads(payload)
                if isinstance(data, list):
                    _saved_layout[slot] = data
                    _ensure_params_for_layout(slot, data)
                    print(f"[mock] layout saved for slot {slot}, {len(data)} widget(s)")
            except json.JSONDecodeError:
                pass
        return
    if cmd == "/gifnoc|":
        payload = message[len(cmd) :].strip()
        if payload:
            try:
                data = json.loads(payload)
                if isinstance(data, list):
                    _saved_config[slot] = data
                    print(f"[mock] config saved for slot {slot}, {len(data)} item(s)")
            except json.JSONDecodeError:
                pass
        return
    if cmd == "/oiranecs|":
        payload = message[len(cmd) :].strip()
        _saved_scenario[slot] = payload if payload is not None else ""
        print(f"[mock] scenario saved for slot {slot}")
        return


async def _send_bin(ws, header: str, payload: str) -> None:
    """Send binary frame to one client (same format as backend sendStringToWs). Must send bytes for client to get Blob."""
    frame = make_binary_frame(header, payload)
    assert isinstance(frame, bytes), "frame must be bytes so browser receives Blob"
    await ws.send(frame)


def _tick_sensor_values() -> None:
    """Update read-only sensor values in _params_state (like backend sensors in loop)."""
    t = time.time()
    for slot in list(_params_state.keys()):
        s = _params_state[slot]
        # Small variation around base values
        s["temp"] = f"{22 + 3 * math.sin(t * 0.5):.1f}"
        s["hum"] = str(int(45 + 10 * math.sin(t * 0.3)))
        s["pressure"] = str(1012 + int(5 * math.sin(t * 0.2)))
        s["voltage"] = f"{3.2 + 0.1 * math.sin(t):.2f}"
        s["power"] = str(int(120 + 30 * math.sin(t * 0.4)))
        s["rssi"] = str(int(-65 + 5 * math.sin(t * 0.5)))


# Interval (seconds): backend sends status on sensor change (publishStatusWs); we emulate same.
PARAMS_INTERVAL = 3

# Param keys that are widget values (not chart). Front updateWidget(topic, status) matches layout by full topic.
_PARAM_IDS = [
    "temp", "hum", "pressure", "voltage", "power", "rssi",
    "relay1", "relay2", "relay3", "fan", "dimmer", "volume", "setpoint",
    "settemp", "label", "alarmtime", "eventdate",
]


async def _periodic_broadcast() -> None:
    """Backend: widget updates via publishStatusWs(topic, data) -> sendStringToWs('status', json). Front expects
    binary blob header 'status', payload JSON { topic, status }; updateWidget() does layoutJson[i] = jsonConcat(...).
    We send one 'status' blob per param so UI reacts. Then chartb for charts."""
    await asyncio.sleep(1)  # first tick soon after connect
    while True:
        await asyncio.sleep(PARAMS_INTERVAL)
        _tick_sensor_values()
        n_conn = len(_connections)
        if n_conn > 0:
            print(f"[WS] broadcast: {n_conn} client(s), status+chartb", flush=True)
        for (ws, slot) in list(_connections):
            try:
                # websockets 12+ has .state (State.OPEN), not .open; skip check, send() raises if closed
                prefix = f"/mock/d{slot}"
                state = _get_params_state(slot)
                # Send one "status" blob per param (like backend publishStatusWs) so front updateWidget() runs and triggers reactivity
                for key in _PARAM_IDS:
                    if key not in state:
                        continue
                    topic = f"{prefix}/{key}"
                    payload = json.dumps({"topic": topic, "status": state[key]})
                    await _send_bin(ws, "status", payload)
            except Exception:
                pass
        # Chart points: backend Loging::publishValue sends chartb with one point; front apdateWidgetByArray merges into layout
        now = int(time.time())
        for (ws, slot) in list(_connections):
            try:
                prefix = f"/mock/d{slot}"
                for topic_suf, base, amp in [("log", 20.0, 5.0), ("log2", 45.0, 15.0), ("log3", 100.0, 50.0), ("logBar", 30.0, 10.0)]:
                    topic = f"{prefix}/{topic_suf}"
                    val = base + amp * math.sin(now * 0.1)
                    point = {"topic": topic, "maxCount": 100, "status": [{"x": now, "y1": round(val, 2)}]}
                    await _send_bin(ws, "chartb", json.dumps(point))
            except Exception:
                pass


async def ws_handler(websocket):
    slot = assign_slot()
    peer = websocket.remote_address
    _connections.append((websocket, slot))
    print(f"[WS] Client connected {peer} -> slot {slot}")
    try:
        async for message in websocket:
            if isinstance(message, str):
                await handle_ws_message(websocket, message, slot)
            # Binary from client not expected for these commands
    except Exception as e:
        print(f"[WS] Error slot {slot}: {e}")
    finally:
        _connections[:] = [(w, s) for w, s in _connections if w != websocket]
        print(f"[WS] Client disconnected slot {slot}")


def run_http_server(host: str, port: int) -> None:
    """Run HTTP server in thread for /iotm/ver.json with CORS."""

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/iotm/ver.json" or self.path == "/iotm/ver.json/":
                body = json.dumps({
                    "esp32": {"versions": ["1.0.0", "1.0.1"]},
                    "esp8266": {"versions": ["1.0.0"]},
                }).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            print(f"[HTTP] {args[0]}")

    server = HTTPServer((host, port), Handler)
    print(f"[HTTP] Serving on http://{host}:{port}")
    server.serve_forever()


def get_local_ip() -> str:
    """Prefer 127.0.0.1 for local dev."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


async def main_async(ws_host: str, ws_port: int, http_host: str, http_port: int):
    global HTTP_HOST, HTTP_PORT
    # For settings.serverip and devlist use 127.0.0.1 when binding 0.0.0.0 (browser on same machine)
    HTTP_HOST = "127.0.0.1" if http_host == "0.0.0.0" else http_host
    HTTP_PORT = http_port

    # Start HTTP server in daemon thread
    t = threading.Thread(target=run_http_server, args=(http_host, http_port), daemon=True)
    t.start()

    local_ip = get_local_ip()
    print("")
    print("Mock backend: WS ws://{}:{}, HTTP http://{}:{}".format(ws_host, ws_port, http_host, http_port))
    print("Add devices with IP {} (or 127.0.0.1 for local).".format(local_ip))
    print("")

    async with websockets.serve(ws_handler, ws_host, ws_port, ping_interval=20, ping_timeout=20):
        asyncio.create_task(_periodic_broadcast())
        await asyncio.Future()


def main():
    parser = argparse.ArgumentParser(description="IoTManager mock backend (WS + HTTP)")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host for WS and HTTP")
    parser.add_argument("--ws-port", type=int, default=81, help="WebSocket port")
    parser.add_argument("--http-port", type=int, default=8081, help="HTTP port for /iotm/ver.json (avoid 8080 if frontend sirv uses it)")
    args = parser.parse_args()
    asyncio.run(main_async(args.host, args.ws_port, args.host, args.http_port))


if __name__ == "__main__":
    main()
