/**
 * Simple event bus for UI notifications (layoutJsonUpdated, deviceListUpdated).
 * Used by WebSocketManager to notify App.svelte without tight coupling.
 */
class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, listener) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
  }

  off(event, listener) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((l) => l !== listener);
  }

  emit(event, ...args) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach((l) => {
      try {
        l(...args);
      } catch (e) {
        console.error("[eventEmitter]", event, e);
      }
    });
  }
}

export const eventEmitter = new EventEmitter();
