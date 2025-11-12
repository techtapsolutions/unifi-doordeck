import { useCallback } from 'react';
import {
  AppConfig,
  ServiceStatus,
  Statistics,
  ConnectionStatus,
  TestConnectionResult,
  UniFiDoor,
  DoordeckDoor,
  LogEntry,
  IPCResponse,
} from '../../shared/types';

export const useElectronAPI = () => {
  const { invoke, channels } = window.electronAPI;

  return {
    // Config operations
    getConfig: useCallback(
      () => invoke<AppConfig>(channels.GET_CONFIG),
      [invoke, channels]
    ),

    setConfig: useCallback(
      (config: Partial<AppConfig>) => invoke(channels.SET_CONFIG, config),
      [invoke, channels]
    ),

    resetConfig: useCallback(
      () => invoke(channels.RESET_CONFIG),
      [invoke, channels]
    ),

    // Service operations
    startService: useCallback(
      () => invoke(channels.SERVICE_START),
      [invoke, channels]
    ),

    stopService: useCallback(
      () => invoke(channels.SERVICE_STOP),
      [invoke, channels]
    ),

    restartService: useCallback(
      () => invoke(channels.SERVICE_RESTART),
      [invoke, channels]
    ),

    installService: useCallback(
      (bridgePath: string) => invoke(channels.SERVICE_INSTALL, bridgePath),
      [invoke, channels]
    ),

    uninstallService: useCallback(
      () => invoke(channels.SERVICE_UNINSTALL),
      [invoke, channels]
    ),

    getServiceStatus: useCallback(
      () => invoke<ServiceStatus>(channels.SERVICE_STATUS),
      [invoke, channels]
    ),

    // Connection testing
    testUniFiConnection: useCallback(
      (host: string, username: string, password: string) =>
        invoke<TestConnectionResult>(channels.TEST_UNIFI_CONNECTION, host, username, password),
      [invoke, channels]
    ),

    testDoordeckConnection: useCallback(
      (apiUrl: string, authToken?: string) =>
        invoke<TestConnectionResult>(channels.TEST_DOORDECK_CONNECTION, apiUrl, authToken),
      [invoke, channels]
    ),

    // Door operations
    discoverUniFiDoors: useCallback(
      () => invoke<UniFiDoor[]>(channels.DISCOVER_UNIFI_DOORS),
      [invoke, channels]
    ),

    discoverDoordeckDoors: useCallback(
      () => invoke<DoordeckDoor[]>(channels.DISCOVER_DOORDECK_DOORS),
      [invoke, channels]
    ),

    syncDoorMappings: useCallback(
      () => invoke(channels.SYNC_DOOR_MAPPINGS),
      [invoke, channels]
    ),

    // Statistics and monitoring
    getStatistics: useCallback(
      () => invoke<Statistics>(channels.GET_STATISTICS),
      [invoke, channels]
    ),

    getConnectionStatus: useCallback(
      () => invoke<ConnectionStatus>(channels.GET_CONNECTION_STATUS),
      [invoke, channels]
    ),

    // Logging
    getLogs: useCallback(
      (limit?: number) => invoke<LogEntry[]>(channels.GET_LOGS, limit),
      [invoke, channels]
    ),

    clearLogs: useCallback(
      () => invoke(channels.CLEAR_LOGS),
      [invoke, channels]
    ),

    subscribeLogs: useCallback(
      () => invoke(channels.SUBSCRIBE_LOGS),
      [invoke, channels]
    ),

    unsubscribeLogs: useCallback(
      () => invoke(channels.UNSUBSCRIBE_LOGS),
      [invoke, channels]
    ),

    // Window operations
    minimizeToTray: useCallback(
      () => invoke(channels.MINIMIZE_TO_TRAY),
      [invoke, channels]
    ),

    // Setup wizard
    completeSetup: useCallback(
      () => invoke(channels.COMPLETE_SETUP),
      [invoke, channels]
    ),
  };
};

export default useElectronAPI;
