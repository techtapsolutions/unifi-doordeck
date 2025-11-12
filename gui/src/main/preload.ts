/**
 * Electron Preload Script
 * Safely exposes IPC APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { BridgeAPI } from '../shared/ipc';
import { IPCChannel } from '../shared/types';

/**
 * Bridge API implementation
 * This is the only API exposed to the renderer process
 */
const bridgeAPI: BridgeAPI = {
  // Configuration
  getConfig: () => ipcRenderer.invoke(IPCChannel.GET_CONFIG),
  setConfig: (config) => ipcRenderer.invoke(IPCChannel.SET_CONFIG, config),
  validateConfig: (config) => ipcRenderer.invoke(IPCChannel.VALIDATE_CONFIG, config),

  // Service control
  startService: () => ipcRenderer.invoke(IPCChannel.SERVICE_START),
  stopService: () => ipcRenderer.invoke(IPCChannel.SERVICE_STOP),
  restartService: () => ipcRenderer.invoke(IPCChannel.SERVICE_RESTART),
  getServiceStatus: () => ipcRenderer.invoke(IPCChannel.SERVICE_STATUS),
  getServiceHealth: () => ipcRenderer.invoke(IPCChannel.SERVICE_HEALTH),

  // Doors
  listDoors: () => ipcRenderer.invoke(IPCChannel.DOORS_LIST),
  discoverDoors: () => ipcRenderer.invoke(IPCChannel.DOORS_DISCOVER),
  unlockDoor: (doorId) => ipcRenderer.invoke(IPCChannel.DOOR_UNLOCK, doorId),
  mapDoor: (mapping) => ipcRenderer.invoke(IPCChannel.DOOR_MAP, mapping),
  unmapDoor: (unifiDoorId) => ipcRenderer.invoke(IPCChannel.DOOR_UNMAP, unifiDoorId),

  // Logs
  getLogs: (limit) => ipcRenderer.invoke(IPCChannel.LOGS_GET, limit),
  clearLogs: () => ipcRenderer.invoke(IPCChannel.LOGS_CLEAR),

  // Event subscriptions
  onServiceStatus: (callback) => {
    const listener = (_event: any, status: string) => callback(status);
    ipcRenderer.on(IPCChannel.EVENT_SERVICE_STATUS, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_SERVICE_STATUS, listener);
  },

  onDoorEvent: (callback) => {
    const listener = (_event: any, event: any) => callback(event);
    ipcRenderer.on(IPCChannel.EVENT_DOOR_EVENT, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_DOOR_EVENT, listener);
  },

  onLog: (callback) => {
    const listener = (_event: any, log: any) => callback(log);
    ipcRenderer.on(IPCChannel.EVENT_LOG, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_LOG, listener);
  },

  onError: (callback) => {
    const listener = (_event: any, error: string) => callback(error);
    ipcRenderer.on(IPCChannel.EVENT_ERROR, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_ERROR, listener);
  },

  // Setup wizard
  testUniFiConnection: (config) => ipcRenderer.invoke(IPCChannel.SETUP_TEST_UNIFI, config),
  testDoordeckConnection: (config) => ipcRenderer.invoke(IPCChannel.SETUP_TEST_DOORDECK, config),
  discoverDoorsWithConfig: (config) => ipcRenderer.invoke(IPCChannel.SETUP_DISCOVER_DOORS, config),
  completeSetup: (config) => ipcRenderer.invoke(IPCChannel.SETUP_COMPLETE, config),
};

/**
 * Expose bridge API to renderer process
 */
contextBridge.exposeInMainWorld('bridge', bridgeAPI);
