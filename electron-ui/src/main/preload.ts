import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPCResponse, IPCChannel } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Generic invoke method for request-response pattern
  invoke: async <T = unknown>(channel: IPCChannel, ...args: unknown[]): Promise<IPCResponse<T>> => {
    return await ipcRenderer.invoke(channel, ...args);
  },

  // Subscribe to events from main process
  on: (channel: IPCChannel, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },

  // Remove event listeners
  removeListener: (channel: IPCChannel, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel: IPCChannel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Expose IPC_CHANNELS constants
  channels: IPC_CHANNELS,
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = unknown>(channel: IPCChannel, ...args: unknown[]) => Promise<IPCResponse<T>>;
      on: (channel: IPCChannel, callback: (...args: unknown[]) => void) => void;
      removeListener: (channel: IPCChannel, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (channel: IPCChannel) => void;
      channels: typeof IPC_CHANNELS;
    };
  }
}
