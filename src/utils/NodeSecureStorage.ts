import { com, kotlin } from '@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk';

/**
 * Node.js implementation of SecureStorage for Doordeck SDK
 *
 * The Doordeck Headless SDK expects browser localStorage, which doesn't
 * exist in Node.js. This class provides an in-memory implementation of
 * the SecureStorage interface required by the SDK.
 */
export class NodeSecureStorage {
  private storage = new Map<string, unknown>();

  // API Environment
  setApiEnvironment(apiEnvironment: com.doordeck.multiplatform.sdk.model.data.ApiEnvironment): void {
    this.storage.set('apiEnvironment', apiEnvironment);
  }

  getApiEnvironment(): com.doordeck.multiplatform.sdk.model.data.ApiEnvironment | null | undefined {
    return this.storage.get('apiEnvironment') as com.doordeck.multiplatform.sdk.model.data.ApiEnvironment | null | undefined;
  }

  // Cloud Authentication Token
  addCloudAuthToken(token: string): void {
    this.storage.set('cloudAuthToken', token);
  }

  getCloudAuthToken(): string | null | undefined {
    return this.storage.get('cloudAuthToken') as string | null | undefined;
  }

  // Cloud Refresh Token
  addCloudRefreshToken(token: string): void {
    this.storage.set('cloudRefreshToken', token);
  }

  getCloudRefreshToken(): string | null | undefined {
    return this.storage.get('cloudRefreshToken') as string | null | undefined;
  }

  // Fusion Host
  setFusionHost(host: string): void {
    this.storage.set('fusionHost', host);
  }

  getFusionHost(): string | null | undefined {
    return this.storage.get('fusionHost') as string | null | undefined;
  }

  // Fusion Authentication Token
  addFusionAuthToken(token: string): void {
    this.storage.set('fusionAuthToken', token);
  }

  getFusionAuthToken(): string | null | undefined {
    return this.storage.get('fusionAuthToken') as string | null | undefined;
  }

  // Public Key
  addPublicKey(publicKey: Int8Array): void {
    this.storage.set('publicKey', publicKey);
  }

  getPublicKey(): Int8Array | null | undefined {
    return this.storage.get('publicKey') as Int8Array | null | undefined;
  }

  // Private Key
  addPrivateKey(privateKey: Int8Array): void {
    this.storage.set('privateKey', privateKey);
  }

  getPrivateKey(): Int8Array | null | undefined {
    return this.storage.get('privateKey') as Int8Array | null | undefined;
  }

  // Key Pair Verified
  setKeyPairVerified(publicKey: Int8Array | null | undefined): void {
    this.storage.set('keyPairVerified', publicKey);
  }

  getKeyPairVerified(): Int8Array | null | undefined {
    return this.storage.get('keyPairVerified') as Int8Array | null | undefined;
  }

  // User ID
  addUserId(userId: string): void {
    this.storage.set('userId', userId);
  }

  getUserId(): string | null | undefined {
    return this.storage.get('userId') as string | null | undefined;
  }

  // User Email
  addUserEmail(email: string): void {
    this.storage.set('userEmail', email);
  }

  getUserEmail(): string | null | undefined {
    return this.storage.get('userEmail') as string | null | undefined;
  }

  // Certificate Chain
  addCertificateChain(certificateChain: kotlin.collections.KtList<string>): void {
    this.storage.set('certificateChain', certificateChain);
  }

  getCertificateChain(): kotlin.collections.KtList<string> | null | undefined {
    return this.storage.get('certificateChain') as kotlin.collections.KtList<string> | null | undefined;
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get all stored keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}
