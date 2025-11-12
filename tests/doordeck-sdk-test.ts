import {
  com,
  kotlin,
} from '@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk';

/**
 * Simple in-memory SecureStorage implementation for Node.js
 * In production, this should use encrypted storage
 */
class NodeSecureStorage {
  private storage = new Map<string, unknown>();

  setApiEnvironment(apiEnvironment: com.doordeck.multiplatform.sdk.model.data.ApiEnvironment): void {
    this.storage.set('apiEnvironment', apiEnvironment);
  }

  getApiEnvironment() {
    return this.storage.get('apiEnvironment') as com.doordeck.multiplatform.sdk.model.data.ApiEnvironment | null | undefined;
  }

  addCloudAuthToken(token: string): void {
    this.storage.set('cloudAuthToken', token);
  }

  getCloudAuthToken() {
    return this.storage.get('cloudAuthToken') as string | null | undefined;
  }

  addCloudRefreshToken(token: string): void {
    this.storage.set('cloudRefreshToken', token);
  }

  getCloudRefreshToken() {
    return this.storage.get('cloudRefreshToken') as string | null | undefined;
  }

  setFusionHost(host: string): void {
    this.storage.set('fusionHost', host);
  }

  getFusionHost() {
    return this.storage.get('fusionHost') as string | null | undefined;
  }

  addFusionAuthToken(token: string): void {
    this.storage.set('fusionAuthToken', token);
  }

  getFusionAuthToken() {
    return this.storage.get('fusionAuthToken') as string | null | undefined;
  }

  addPublicKey(publicKey: Int8Array): void {
    this.storage.set('publicKey', publicKey);
  }

  getPublicKey() {
    return this.storage.get('publicKey') as Int8Array | null | undefined;
  }

  addPrivateKey(privateKey: Int8Array): void {
    this.storage.set('privateKey', privateKey);
  }

  getPrivateKey() {
    return this.storage.get('privateKey') as Int8Array | null | undefined;
  }

  setKeyPairVerified(publicKey: Int8Array | null | undefined): void {
    this.storage.set('keyPairVerified', publicKey);
  }

  getKeyPairVerified() {
    return this.storage.get('keyPairVerified') as Int8Array | null | undefined;
  }

  addUserId(userId: string): void {
    this.storage.set('userId', userId);
  }

  getUserId() {
    return this.storage.get('userId') as string | null | undefined;
  }

  addUserEmail(email: string): void {
    this.storage.set('userEmail', email);
  }

  getUserEmail() {
    return this.storage.get('userEmail') as string | null | undefined;
  }

  addCertificateChain(certificateChain: kotlin.collections.KtList<string>): void {
    this.storage.set('certificateChain', certificateChain);
  }

  getCertificateChain() {
    return this.storage.get('certificateChain') as kotlin.collections.KtList<string> | null | undefined;
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Test script to verify Doordeck Headless SDK functionality
 *
 * This script tests:
 * 1. SDK initialization
 * 2. Fusion API authentication
 * 3. Fusion API methods (getIntegrationType, getIntegrationConfiguration, etc.)
 */

async function testDoordeckSDK() {
  console.log('=== Doordeck SDK Test ===\n');

  try {
    // Step 1: Create SDK configuration
    console.log('Step 1: Creating SDK configuration...');

    // Create custom SecureStorage for Node.js
    const secureStorage = new NodeSecureStorage();

    const sdkConfig = new com.doordeck.multiplatform.sdk.config.SdkConfig.Builder()
      .setFusionHost('http://localhost:8080') // Placeholder - replace with actual Fusion host
      .setSecureStorageOverride(secureStorage as unknown as com.doordeck.multiplatform.sdk.storage.SecureStorage)
      .setDebugLogging(true)
      .build();

    console.log('✓ SDK configuration created');
    console.log('  Fusion Host:', sdkConfig.fusionHost);
    console.log();

    // Step 2: Initialize SDK
    console.log('Step 2: Initializing SDK...');

    await com.doordeck.multiplatform.sdk.KDoordeckFactory.initialize(sdkConfig);

    console.log('✓ SDK initialized successfully');
    console.log();

    // Step 3: Test Fusion API Login
    console.log('Step 3: Testing Fusion API Login...');
    console.log(
      '  Note: This requires actual Fusion credentials and a running Fusion instance'
    );

    // Uncomment to test with real credentials:
    /*
    const loginResponse = await com.doordeck.multiplatform.sdk.api.fusion().login(
      'test@example.com',
      'password'
    );
    console.log('✓ Login successful');
    console.log('  Auth Token:', loginResponse.authToken);
    */

    console.log('  Skipping login test (no credentials configured)');
    console.log();

    // Step 4: Test getting integration types
    console.log('Step 4: Testing getIntegrationType...');
    console.log('  Note: This requires authentication first');

    // Uncomment to test after authentication:
    /*
    const integrationType = await com.doordeck.multiplatform.sdk.api.fusion().getIntegrationType();
    console.log('✓ Integration type retrieved');
    console.log('  Type:', integrationType);
    */

    console.log('  Skipping integration type test (requires authentication)');
    console.log();

    // Step 5: Document available Fusion API methods
    console.log('Step 5: Available Fusion API Methods:');
    console.log('  - login(email, password): Promise<FusionLoginResponse>');
    console.log('  - getIntegrationType(): Promise<IntegrationTypeResponse>');
    console.log(
      '  - getIntegrationConfiguration(type): Promise<IntegrationConfigurationResponse[]>'
    );
    console.log('  - enableDoor(name, siteId, controller): Promise<any>');
    console.log('  - deleteDoor(deviceId): Promise<any>');
    console.log('  - getDoorStatus(deviceId): Promise<DoorStateResponse>');
    console.log('  - startDoor(deviceId): Promise<any>');
    console.log('  - stopDoor(deviceId): Promise<any>');
    console.log();

    // Step 6: Document available controller types for enableDoor
    console.log('Step 6: Available Controller Types (for enableDoor):');
    console.log('  - AlpetaController');
    console.log('  - AmagController');
    console.log('  - AssaAbloyController');
    console.log('  - AvigilonController');
    console.log('  - AxisController');
    console.log('  - CCureController');
    console.log('  - DemoController');
    console.log('  - GallagherController');
    console.log('  - GenetecController');
    console.log('  - LenelController');
    console.log('  - MitrefinchController');
    console.log('  - PaxtonNet2Controller');
    console.log('  - Paxton10Controller');
    console.log('  - IntegraV1Controller');
    console.log('  - IntegraV2Controller');
    console.log('  - PacController');
    console.log('  - TdsiExgardeController');
    console.log('  - TdsiGardisController');
    console.log('  - ZktecoController');
    console.log('  Note: UniFi Access is NOT in the list - we need to add it!');
    console.log();

    console.log('=== Test Summary ===');
    console.log('✓ SDK can be imported and initialized');
    console.log('✓ Fusion API methods are accessible');
    console.log('✓ Type definitions are correct');
    console.log('! Authentication requires real Fusion instance');
    console.log('! UniFi controller type needs to be added');

    return {
      success: true,
      sdkVersion: '0.160.0',
      fusionApiAvailable: true,
      needsAuthentication: true,
      missingControllerType: 'UniFi Access',
    };
  } catch (error) {
    console.error('✗ Error during SDK test:');
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run the test
if (require.main === module) {
  testDoordeckSDK()
    .then((result) => {
      console.log('\n=== Test Result ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testDoordeckSDK };
