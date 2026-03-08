# Mock backend for IoTManagerWeb (dev)

Emulates the IoTManager ESP backend: WebSocket on port 81, HTTP for `/iotm/ver.json`. Two devices over one WS server (two connections = slot 0 and 1).

## Run

**Option A — from `scripts/` (venv already in scripts):**
```bash
cd IoTManagerWeb/scripts
.venv/bin/python mock_backend.py
```

**Option B — from project root:**
```bash
python3 -m venv .venv-mock
.venv-mock/bin/pip install -r scripts/requirements-mock.txt
.venv-mock/bin/python scripts/mock_backend.py --host 0.0.0.0 --ws-port 81 --http-port 8081
```

Default HTTP port is 8081 (sirv dev server often uses 8080).

## Frontend

Set `VITE_DEV_WS_HOST=127.0.0.1` in `.env.development` (already set). Then:

```bash
npm run dev
```

Open the app URL (e.g. http://localhost:8080). The app will connect to `ws://127.0.0.1:81` and receive a device list of two mock devices; dashboard and charts will show mock data.
