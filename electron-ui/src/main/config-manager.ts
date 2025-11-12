import Store from 'electron-store';
import { AppConfig, DoorMapping } from '../shared/types';
import * as path from 'path';
import { app } from 'electron';

const DEFAULT_CONFIG: AppConfig = {
  unifi: {
    host: '',
    username: '',
    password: '',
    verifySSL: false,
  },
  doordeck: {
    apiUrl: 'https://api.doordeck.com',
    authToken: undefined,
    clientId: undefined,
    clientSecret: undefined,
  },
  doorMappings: [],
  logging: {
    level: 'info',
    enableFileLogging: true,
    logPath: path.join(app.getPath('userData'), 'logs'),
  },
  firstRun: true,
  minimizeToTray: true,
  startWithWindows: false,
};

export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: DEFAULT_CONFIG,
      encryptionKey: 'doordeck-bridge-encryption-key-2024',
      clearInvalidConfig: true,
    });
  }

  public getConfig(): AppConfig {
    return this.store.store;
  }

  public setConfig(config: Partial<AppConfig>): void {
    this.store.store = {
      ...this.store.store,
      ...config,
    };
  }

  public updateUniFiConfig(unifiConfig: Partial<AppConfig['unifi']>): void {
    this.store.set('unifi', {
      ...this.store.get('unifi'),
      ...unifiConfig,
    });
  }

  public updateDoordeckConfig(doordeckConfig: Partial<AppConfig['doordeck']>): void {
    this.store.set('doordeck', {
      ...this.store.get('doordeck'),
      ...doordeckConfig,
    });
  }

  public updateDoorMappings(mappings: DoorMapping[]): void {
    this.store.set('doorMappings', mappings);
  }

  public addDoorMapping(mapping: DoorMapping): void {
    const mappings = this.store.get('doorMappings');
    const existingIndex = mappings.findIndex(
      (m) => m.unifiDoorId === mapping.unifiDoorId
    );

    if (existingIndex >= 0) {
      mappings[existingIndex] = mapping;
    } else {
      mappings.push(mapping);
    }

    this.store.set('doorMappings', mappings);
  }

  public removeDoorMapping(unifiDoorId: string): void {
    const mappings = this.store.get('doorMappings');
    this.store.set(
      'doorMappings',
      mappings.filter((m) => m.unifiDoorId !== unifiDoorId)
    );
  }

  public updateLoggingConfig(loggingConfig: Partial<AppConfig['logging']>): void {
    this.store.set('logging', {
      ...this.store.get('logging'),
      ...loggingConfig,
    });
  }

  public completeSetup(): void {
    this.store.set('firstRun', false);
  }

  public resetConfig(): void {
    this.store.clear();
    this.store.store = DEFAULT_CONFIG;
  }

  public exportConfig(): string {
    return JSON.stringify(this.store.store, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson) as AppConfig;
      this.store.store = {
        ...DEFAULT_CONFIG,
        ...config,
      };
    } catch (error) {
      throw new Error(`Failed to import config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getConfigPath(): string {
    return this.store.path;
  }
}
