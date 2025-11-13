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
  installService: () => ipcRenderer.invoke(IPCChannel.SERVICE_INSTALL),
  uninstallService: () => ipcRenderer.invoke(IPCChannel.SERVICE_UNINSTALL),
  startService: () => ipcRenderer.invoke(IPCChannel.SERVICE_START),
  stopService: () => ipcRenderer.invoke(IPCChannel.SERVICE_STOP),
  restartService: () => ipcRenderer.invoke(IPCChannel.SERVICE_RESTART),
  getServiceStatus: () => ipcRenderer.invoke(IPCChannel.SERVICE_STATUS),
  getServiceHealth: () => ipcRenderer.invoke(IPCChannel.SERVICE_HEALTH),
  isServiceInstalled: () => ipcRenderer.invoke(IPCChannel.SERVICE_IS_INSTALLED),

  // Doors
  listDoors: () => ipcRenderer.invoke(IPCChannel.DOORS_LIST),
  discoverDoors: () => ipcRenderer.invoke(IPCChannel.DOORS_DISCOVER),
  unlockDoor: (doorId) => ipcRenderer.invoke(IPCChannel.DOOR_UNLOCK, doorId),

  // Door Mappings
  listMappings: () => ipcRenderer.invoke(IPCChannel.MAPPINGS_LIST),
  getMapping: (id) => ipcRenderer.invoke(IPCChannel.MAPPINGS_GET, id),
  createMapping: (data) => ipcRenderer.invoke(IPCChannel.MAPPINGS_CREATE, data),
  updateMapping: (id, updates) => ipcRenderer.invoke(IPCChannel.MAPPINGS_UPDATE, { id, updates }),
  deleteMapping: (id) => ipcRenderer.invoke(IPCChannel.MAPPINGS_DELETE, id),
  listDoordeckLocks: () => ipcRenderer.invoke(IPCChannel.DOORDECK_LOCKS_LIST),

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

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke(IPCChannel.UPDATE_CHECK),
  downloadUpdate: () => ipcRenderer.invoke(IPCChannel.UPDATE_DOWNLOAD),
  installUpdate: () => ipcRenderer.invoke(IPCChannel.UPDATE_INSTALL),
  getUpdateStatus: () => ipcRenderer.invoke(IPCChannel.UPDATE_GET_STATUS),

  // Update event subscriptions
  onUpdateStatus: (callback) => {
    const listener = (_event: any, status: any) => callback(status);
    ipcRenderer.on(IPCChannel.EVENT_UPDATE_STATUS, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_UPDATE_STATUS, listener);
  },

  onUpdateAvailable: (callback) => {
    const listener = (_event: any, info: any) => callback(info);
    ipcRenderer.on(IPCChannel.EVENT_UPDATE_AVAILABLE, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_UPDATE_AVAILABLE, listener);
  },

  onUpdateDownloaded: (callback) => {
    const listener = (_event: any, info: any) => callback(info);
    ipcRenderer.on(IPCChannel.EVENT_UPDATE_DOWNLOADED, listener);
    return () => ipcRenderer.removeListener(IPCChannel.EVENT_UPDATE_DOWNLOADED, listener);
  },
};

/**
 * Expose bridge API to renderer process
 */
contextBridge.exposeInMainWorld('bridge', bridgeAPI);
