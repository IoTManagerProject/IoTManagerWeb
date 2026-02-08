/**
 * Reconnect ticker and ack timeouts (heartbeat). No deviceConnection import; getIP/connectDevice passed in.
 */

/**
 * Scale number from one range to another.
 */
function scale(number, inMin, inMax, outMin, outMax) {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

const ackTimeoutsStore = {};
const startMillisStore = {};
const pingStore = {};

/**
 * Create ack(ws, st). On st false: set timeout to call markDeviceStatus(ws, false). On st true: clear timeout, set ping on deviceList.
 * @param {object} deps - markDeviceStatus(ws, bool), getDeviceList(), setDeviceList(list), waitingAckTimeout
 * @returns {function(ws: number, st: boolean)} ack
 */
export function createAck(deps) {
  const { markDeviceStatus, getDeviceList, setDeviceList, waitingAckTimeout } = deps;
  return function ack(ws, st) {
    if (!st) {
      startMillisStore[ws] = Date.now();
      ackTimeoutsStore[ws] = setTimeout(() => {
        markDeviceStatus(ws, false);
      }, waitingAckTimeout);
    } else {
      if (ackTimeoutsStore[ws]) clearTimeout(ackTimeoutsStore[ws]);
      if (startMillisStore[ws]) pingStore[ws] = Date.now() - startMillisStore[ws];
      const deviceList = getDeviceList();
      for (let i = 0; i < deviceList.length; i++) {
        if (deviceList[i].ws === ws) deviceList[i].ping = pingStore[ws];
      }
      setDeviceList(deviceList);
    }
  };
}

/**
 * Create the 1s ticker: decrement remainingTimeout, update percent; at 0 reconnect or send /tst| and ack.
 * @param {object} deps - getDeviceList, send(ws, msg), markDeviceStatus, connectDevice(ws), ack(ws, st), getRemainingTimeout, setRemainingTimeout, reconnectTimeout, getPreventReconnect, setPercent, getRebootOrUpdateProcess, getSocketConnected, setShowAwaitingCircle, setReconnectTimeout, printAllCreatedWs (optional)
 * @returns {function()} wsTestMsgTask - call once to start; it reschedules itself via setTimeout(wsTestMsgTask, 1000)
 */
export function createWsTestMsgTask(deps) {
  const {
    getDeviceList,
    send,
    markDeviceStatus,
    connectDevice,
    ack,
    getRemainingTimeout,
    setRemainingTimeout,
    reconnectTimeout,
    getPreventReconnect,
    setPercent,
    getRebootOrUpdateProcess,
    setRebootOrUpdateProcess,
    getSocketConnected,
    setShowAwaitingCircle,
    setReconnectTimeout,
    printAllCreatedWs,
  } = deps;

  function wsTestMsgTask() {
    const schedule = () => setTimeout(wsTestMsgTask, 1000);
    schedule(); // reschedule first (same as original)
    if (getPreventReconnect()) return;
    let remaining = getRemainingTimeout() - 1;
    if (getRebootOrUpdateProcess() && getSocketConnected()) {
      if (setRebootOrUpdateProcess) setRebootOrUpdateProcess(false);
      if (setReconnectTimeout) setReconnectTimeout(60);
      remaining = 60;
      if (setShowAwaitingCircle) setShowAwaitingCircle(false);
    }
    setRemainingTimeout(remaining);
    setPercent(scale(remaining, reconnectTimeout, 0, 0, 100));
    if (remaining <= 0) {
      if (setReconnectTimeout) setReconnectTimeout(reconnectTimeout);
      setRemainingTimeout(reconnectTimeout);
      if (printAllCreatedWs) printAllCreatedWs();
      const deviceList = getDeviceList();
      deviceList.forEach((device) => {
        if (device.status === false || device.status === undefined) {
          connectDevice(device.ws);
        } else {
          send(device.ws, "/tst|");
          ack(device.ws, false);
        }
      });
    }
  }
  return wsTestMsgTask;
}
