/**
 * WebSocket pool for devices: create by wsIndex, events via callbacks.
 * No parsing or reconnect logic — App provides callbacks.
 */

const sockets = new Map();

/**
 * Create WebSocket for device at wsIndex, bind events to callbacks.
 * @param {number} wsIndex - device index (same as device.ws)
 * @param {string} ip - device IP
 * @param {object} callbacks - { onOpen(ws), onMessage(ws, data), onClose(ws), onError(ws) }
 */
export function createConnection(wsIndex, ip, callbacks) {
  const url = "ws://" + ip + ":81";
  const socket = new WebSocket(url);
  socket.binaryType = "blob";
  sockets.set(wsIndex, socket);

  socket.addEventListener("open", () => {
    if (callbacks.onOpen) callbacks.onOpen(wsIndex);
  });

  socket.addEventListener("message", (event) => {
    if (callbacks.onMessage) callbacks.onMessage(wsIndex, event.data);
  });

  socket.addEventListener("close", (ev) => {
    if (socket.readyState !== 1) {
      console.warn("[WS] closed before open", "url:", url, "wsIndex:", wsIndex, "code:", ev.code, "reason:", ev.reason || "");
    }
    if (callbacks.onClose) callbacks.onClose(wsIndex);
  });

  socket.addEventListener("error", () => {
    console.warn("[WS] error connecting to", url, "wsIndex:", wsIndex, "- is mock_backend.py running on port 81?");
    if (callbacks.onError) callbacks.onError(wsIndex);
  });
}

/**
 * Send message if socket exists and is open.
 * @param {number} wsIndex
 * @param {string} msg
 */
export function send(wsIndex, msg) {
  const socket = sockets.get(wsIndex);
  if (socket && socket.readyState === 1) {
    socket.send(msg);
    return true;
  }
  return false;
}

/**
 * @param {number} wsIndex
 * @returns {boolean}
 */
export function isOpen(wsIndex) {
  const socket = sockets.get(wsIndex);
  return !!(socket && socket.readyState === 1);
}

/**
 * Get socket instance (for compatibility / debug). Prefer send/isOpen.
 * @param {number} wsIndex
 * @returns {WebSocket|undefined}
 */
export function getSocket(wsIndex) {
  return sockets.get(wsIndex);
}

/**
 * Remove socket from pool (e.g. on close if needed). Does not close the socket.
 * @param {number} wsIndex
 */
export function removeSocket(wsIndex) {
  sockets.delete(wsIndex);
}
