/**
 * Cross-platform Secure Credential Manager
 *
 * Provides secure credential storage using platform-native secure storage:
 * - Windows: Windows Credential Manager
 * - macOS: Keychain
 * - Linux: libsecret
 *
 * This ensures sensitive credentials are never stored in plaintext.
 */

import * as os from 'os';
import * as crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Credential types that can be stored
 */
export enum CredentialType {
  UNIFI_API_KEY = 'unifi.apiKey',
  UNIFI_PASSWORD = 'unifi.password',
  DOORDECK_EMAIL = 'doordeck.email',
  DOORDECK_PASSWORD = 'doordeck.password',
  DOORDECK_API_TOKEN = 'doordeck.apiToken',
  DOORDECK_REFRESH_TOKEN = 'doordeck.refreshToken',
  API_AUTH_KEY = 'api.authKey',
}

/**
 * Interface for platform-specific credential storage
 */
interface ICredentialStore {
  set(service: string, account: string, password: string): Promise<void>;
  get(service: string, account: string): Promise<string | null>;
  delete(service: string, account: string): Promise<boolean>;
  list(service: string): Promise<Array<{ account: string }>>;
}

/**
 * Fallback encrypted credential storage for systems without native secure storage
 * WARNING: This is less secure than native storage and should only be used as a fallback
 */
class FallbackCredentialStore implements ICredentialStore {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly STORAGE_FILE = '.credentials.enc';

  private storageFilePath: string;
  private encryptionKey: Buffer;

  constructor() {
    // Use machine-specific key derivation
    const machineId = this.getMachineId();
    this.encryptionKey = crypto.scryptSync(machineId, 'salt', this.KEY_LENGTH);

    // Store in user's home directory with restrictive permissions
    const homeDir = os.homedir();
    this.storageFilePath = `${homeDir}/${this.STORAGE_FILE}`;

    logger.warn('Using fallback credential storage. Native secure storage is recommended.');
  }

  /**
   * Get a machine-specific identifier for key derivation
   */
  private getMachineId(): string {
    // Use hostname + platform + user as machine identifier
    return `${os.hostname()}-${os.platform()}-${os.userInfo().username}`;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv + authTag + encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(ciphertext: string): string {
    const ivHex = ciphertext.slice(0, this.IV_LENGTH * 2);
    const authTagHex = ciphertext.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.AUTH_TAG_LENGTH) * 2);
    const encryptedHex = ciphertext.slice((this.IV_LENGTH + this.AUTH_TAG_LENGTH) * 2);

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Load credentials from encrypted storage file
   */
  private async loadStorage(): Promise<Record<string, Record<string, string>>> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.storageFilePath, 'utf8');
      const decrypted = this.decrypt(data);
      return JSON.parse(decrypted);
    } catch (error) {
      // File doesn't exist or is corrupted - return empty storage
      return {};
    }
  }

  /**
   * Save credentials to encrypted storage file
   */
  private async saveStorage(storage: Record<string, Record<string, string>>): Promise<void> {
    const fs = await import('fs/promises');
    const plaintext = JSON.stringify(storage);
    const encrypted = this.encrypt(plaintext);

    // Write with restrictive permissions (0600)
    await fs.writeFile(this.storageFilePath, encrypted, { mode: 0o600 });
  }

  async set(service: string, account: string, password: string): Promise<void> {
    const storage = await this.loadStorage();

    if (!storage[service]) {
      storage[service] = {};
    }

    storage[service][account] = password;
    await this.saveStorage(storage);
  }

  async get(service: string, account: string): Promise<string | null> {
    const storage = await this.loadStorage();
    return storage[service]?.[account] || null;
  }

  async delete(service: string, account: string): Promise<boolean> {
    const storage = await this.loadStorage();

    if (storage[service]?.[account]) {
      delete storage[service][account];

      // Clean up empty service entries
      if (Object.keys(storage[service]).length === 0) {
        delete storage[service];
      }

      await this.saveStorage(storage);
      return true;
    }

    return false;
  }

  async list(service: string): Promise<Array<{ account: string }>> {
    const storage = await this.loadStorage();
    const accounts = Object.keys(storage[service] || {});
    return accounts.map(account => ({ account }));
  }
}

/**
 * Credential Manager with automatic platform detection
 */
export class CredentialManager {
  private static instance: CredentialManager;
  private store: ICredentialStore;
  private readonly SERVICE_NAME = 'UniFi-Doordeck-Bridge';

  private constructor() {
    this.store = this.initializeStore();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Initialize platform-specific credential store
   */
  private initializeStore(): ICredentialStore {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        // Try to use Windows Credential Manager
        return this.initializeWindowsStore();
      } else if (platform === 'darwin' || platform === 'linux') {
        // Try to use keytar for macOS/Linux
        return this.initializeKeytarStore();
      }
    } catch (error) {
      logger.warn(`Failed to initialize native credential store: ${error}`);
    }

    // Fallback to encrypted file storage
    logger.warn('Using fallback encrypted credential storage');
    return new FallbackCredentialStore();
  }

  /**
   * Initialize Windows Credential Manager
   */
  private initializeWindowsStore(): ICredentialStore {
    // Dynamic import to avoid errors on non-Windows platforms
    const credentialVault = require('credential-vault');

    return {
      async set(service: string, account: string, password: string): Promise<void> {
        await credentialVault.set(`${service}:${account}`, password);
      },

      async get(service: string, account: string): Promise<string | null> {
        try {
          return await credentialVault.get(`${service}:${account}`);
        } catch {
          return null;
        }
      },

      async delete(service: string, account: string): Promise<boolean> {
        try {
          await credentialVault.delete(`${service}:${account}`);
          return true;
        } catch {
          return false;
        }
      },

      async list(service: string): Promise<Array<{ account: string }>> {
        // credential-vault doesn't support listing - return empty array
        return [];
      },
    };
  }

  /**
   * Initialize keytar for macOS/Linux
   */
  private initializeKeytarStore(): ICredentialStore {
    // Dynamic import to avoid errors on Windows
    const keytar = require('keytar');

    return {
      async set(service: string, account: string, password: string): Promise<void> {
        await keytar.setPassword(service, account, password);
      },

      async get(service: string, account: string): Promise<string | null> {
        return await keytar.getPassword(service, account);
      },

      async delete(service: string, account: string): Promise<boolean> {
        return await keytar.deletePassword(service, account);
      },

      async list(service: string): Promise<Array<{ account: string }>> {
        const credentials = await keytar.findCredentials(service);
        return credentials.map((cred: any) => ({ account: cred.account }));
      },
    };
  }

  /**
   * Store a credential securely
   */
  async setCredential(type: CredentialType, value: string): Promise<void> {
    try {
      await this.store.set(this.SERVICE_NAME, type, value);
      logger.debug(`Stored credential: ${type}`);
    } catch (error) {
      logger.error(`Failed to store credential ${type}:`, error);
      throw new Error(`Failed to store credential: ${error}`);
    }
  }

  /**
   * Retrieve a credential securely
   */
  async getCredential(type: CredentialType): Promise<string | null> {
    try {
      const value = await this.store.get(this.SERVICE_NAME, type);

      if (value) {
        logger.debug(`Retrieved credential: ${type}`);
      }

      return value;
    } catch (error) {
      logger.error(`Failed to retrieve credential ${type}:`, error);
      return null;
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(type: CredentialType): Promise<boolean> {
    try {
      const result = await this.store.delete(this.SERVICE_NAME, type);

      if (result) {
        logger.debug(`Deleted credential: ${type}`);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to delete credential ${type}:`, error);
      return false;
    }
  }

  /**
   * List all stored credential types
   */
  async listCredentials(): Promise<string[]> {
    try {
      const credentials = await this.store.list(this.SERVICE_NAME);
      return credentials.map(c => c.account);
    } catch (error) {
      logger.error('Failed to list credentials:', error);
      return [];
    }
  }

  /**
   * Clear all credentials
   */
  async clearAllCredentials(): Promise<void> {
    const types = Object.values(CredentialType);

    for (const type of types) {
      await this.deleteCredential(type);
    }

    logger.info('All credentials cleared');
  }

  /**
   * Generate a secure random API key
   */
  static generateApiKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
}
