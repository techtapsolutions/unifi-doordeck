/**
 * UniFi Access Controller adapter for Doordeck Fusion API
 *
 * This creates a controller object that conforms to the Doordeck LockController
 * interface pattern, similar to other controllers in the SDK like:
 * - GallagherController
 * - AssaAbloyController
 * - PaxtonNet2Controller
 *
 * Since UniFi Access is not a built-in controller type in the Doordeck SDK,
 * we create our own controller object that follows the same pattern.
 */

/**
 * UniFi Access controller configuration
 */
export interface UniFiControllerConfig {
  /** UniFi controller base URL (e.g., "https://192.168.1.10") */
  baseUrl: string;

  /** UniFi Access username */
  username: string;

  /** UniFi Access password */
  password: string;

  /** UniFi door unique ID */
  doorId: string;

  /** Optional controller port (default: 443) */
  port?: number;

  /** Optional SSL verification (default: true) */
  verifySsl?: boolean;
}

/**
 * Create a UniFi Access controller object for Doordeck Fusion API
 *
 * This creates a controller object that matches the LockController interface
 * pattern expected by the Doordeck Fusion API's enableDoor() method.
 *
 * @param config - UniFi controller configuration
 * @returns Controller object conforming to LockController interface
 */
export function createUniFiController(config: UniFiControllerConfig): any {
  // Create a controller object that matches the pattern of other controllers
  // in the Doordeck SDK (e.g., GallagherController, AssaAbloyController)
  const controller = {
    // Standard controller properties
    baseUrl: config.baseUrl,
    username: config.username,
    password: config.password,
    doorId: config.doorId,
    port: config.port || 443,
    verifySsl: config.verifySsl !== undefined ? config.verifySsl : true,

    // Controller type identifier
    controllerType: 'UniFiAccess',

    // Additional UniFi-specific metadata
    metadata: {
      vendor: 'Ubiquiti',
      system: 'UniFi Access',
      version: '1.0',
    },

    // Copy method (following SDK pattern)
    copy(
      baseUrl?: string,
      username?: string,
      password?: string,
      doorId?: string,
      port?: number,
      verifySsl?: boolean
    ): any {
      return createUniFiController({
        baseUrl: baseUrl || this.baseUrl,
        username: username || this.username,
        password: password || this.password,
        doorId: doorId || this.doorId,
        port: port || this.port,
        verifySsl: verifySsl !== undefined ? verifySsl : this.verifySsl,
      });
    },

    // toString method (following SDK pattern)
    toString(): string {
      return `UniFiController(baseUrl=${this.baseUrl}, doorId=${this.doorId}, username=${this.username})`;
    },

    // hashCode method (following SDK pattern)
    hashCode(): number {
      let hash = 0;
      const str = this.toString();
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },

    // equals method (following SDK pattern)
    equals(other: any): boolean {
      if (!other) return false;
      return (
        this.baseUrl === other.baseUrl &&
        this.doorId === other.doorId &&
        this.username === other.username &&
        this.controllerType === other.controllerType
      );
    },

    // LockController interface marker (required by SDK)
    __doNotUseOrImplementIt: {
      'com.doordeck.multiplatform.sdk.model.data.FusionOperations.LockController': Symbol(
        'UniFiController'
      ),
    },
  };

  return controller;
}

/**
 * Validate UniFi controller configuration
 */
export function validateUniFiControllerConfig(config: UniFiControllerConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.baseUrl || config.baseUrl.trim() === '') {
    errors.push('baseUrl is required');
  } else if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
    errors.push('baseUrl must start with http:// or https://');
  }

  if (!config.username || config.username.trim() === '') {
    errors.push('username is required');
  }

  if (!config.password || config.password.trim() === '') {
    errors.push('password is required');
  }

  if (!config.doorId || config.doorId.trim() === '') {
    errors.push('doorId is required');
  }

  if (config.port !== undefined) {
    if (config.port < 1 || config.port > 65535) {
      errors.push('port must be between 1 and 65535');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
