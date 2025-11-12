#!/usr/bin/env ts-node
/**
 * Credential Migration Script
 *
 * Migrates plaintext credentials from config.json to secure credential storage.
 * This script should be run once during upgrade to the secure version.
 *
 * Usage:
 *   npm run migrate-credentials [config-path]
 *   ts-node scripts/migrate-credentials.ts [config-path]
 */

import * as fs from 'fs';
import * as path from 'path';
import { CredentialManager, CredentialType } from '../src/security/CredentialManager';

interface LegacyConfig {
  unifi?: {
    apiKey?: string;
    password?: string;
    [key: string]: any;
  };
  doordeck?: {
    email?: string;
    password?: string;
    apiToken?: string;
    refreshToken?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Migration statistics
 */
interface MigrationStats {
  credentialsMigrated: number;
  credentialsFailed: number;
  backupCreated: boolean;
  configUpdated: boolean;
}

/**
 * Load configuration from file
 */
function loadConfig(configPath: string): LegacyConfig {
  try {
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.cwd(), configPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Configuration file not found: ${absolutePath}`);
    }

    const fileContents = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(
      `Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create backup of configuration file
 */
function backupConfig(configPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${configPath}.backup-${timestamp}`;

  fs.copyFileSync(configPath, backupPath);
  console.log(`Created backup: ${backupPath}`);

  return backupPath;
}

/**
 * Update configuration file to remove plaintext credentials
 */
function updateConfig(configPath: string, config: LegacyConfig): void {
  // Remove sensitive fields
  if (config.unifi) {
    delete config.unifi.apiKey;
    delete config.unifi.password;

    // Add marker to indicate credentials are in secure storage
    config.unifi._credentialsInSecureStorage = true;
  }

  if (config.doordeck) {
    delete config.doordeck.email;
    delete config.doordeck.password;
    delete config.doordeck.apiToken;
    delete config.doordeck.refreshToken;

    // Add marker to indicate credentials are in secure storage
    config.doordeck._credentialsInSecureStorage = true;
  }

  // Write updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Updated configuration file (removed plaintext credentials)`);
}

/**
 * Migrate credentials from config to secure storage
 */
async function migrateCredentials(configPath: string, dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    credentialsMigrated: 0,
    credentialsFailed: 0,
    backupCreated: false,
    configUpdated: false,
  };

  console.log(`\nMigrating credentials from: ${configPath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}\n`);

  // Load configuration
  const config = loadConfig(configPath);

  // Initialize credential manager
  const credentialManager = CredentialManager.getInstance();

  // Collect credentials to migrate
  const credentialsToMigrate: Array<{ type: CredentialType; value: string; label: string }> = [];

  if (config.unifi?.apiKey) {
    credentialsToMigrate.push({
      type: CredentialType.UNIFI_API_KEY,
      value: config.unifi.apiKey,
      label: 'UniFi API Key',
    });
  }

  if (config.unifi?.password) {
    credentialsToMigrate.push({
      type: CredentialType.UNIFI_PASSWORD,
      value: config.unifi.password,
      label: 'UniFi Password',
    });
  }

  if (config.doordeck?.email) {
    credentialsToMigrate.push({
      type: CredentialType.DOORDECK_EMAIL,
      value: config.doordeck.email,
      label: 'Doordeck Email',
    });
  }

  if (config.doordeck?.password) {
    credentialsToMigrate.push({
      type: CredentialType.DOORDECK_PASSWORD,
      value: config.doordeck.password,
      label: 'Doordeck Password',
    });
  }

  if (config.doordeck?.apiToken) {
    credentialsToMigrate.push({
      type: CredentialType.DOORDECK_API_TOKEN,
      value: config.doordeck.apiToken,
      label: 'Doordeck API Token',
    });
  }

  if (config.doordeck?.refreshToken) {
    credentialsToMigrate.push({
      type: CredentialType.DOORDECK_REFRESH_TOKEN,
      value: config.doordeck.refreshToken,
      label: 'Doordeck Refresh Token',
    });
  }

  // Check if there are any credentials to migrate
  if (credentialsToMigrate.length === 0) {
    console.log('No plaintext credentials found in configuration.');
    console.log('Configuration may already be using secure storage.');
    return stats;
  }

  console.log(`Found ${credentialsToMigrate.length} credential(s) to migrate:\n`);

  // Migrate each credential
  for (const { type, value, label } of credentialsToMigrate) {
    try {
      console.log(`  - ${label}... `, { newline: false } as any);

      if (!dryRun) {
        await credentialManager.setCredential(type, value);
        stats.credentialsMigrated++;
        console.log('✓ Migrated');
      } else {
        console.log('✓ Would migrate');
        stats.credentialsMigrated++;
      }
    } catch (error) {
      stats.credentialsFailed++;
      console.log(`✗ Failed: ${error}`);
    }
  }

  console.log('');

  // Create backup of original config
  if (!dryRun && stats.credentialsMigrated > 0) {
    try {
      backupConfig(configPath);
      stats.backupCreated = true;
    } catch (error) {
      console.error(`Warning: Failed to create backup: ${error}`);
    }

    // Update config to remove plaintext credentials
    try {
      updateConfig(configPath, config);
      stats.configUpdated = true;
    } catch (error) {
      console.error(`Error: Failed to update configuration: ${error}`);
    }
  }

  return stats;
}

/**
 * Print migration summary
 */
function printSummary(stats: MigrationStats, dryRun: boolean): void {
  console.log('\n=== Migration Summary ===\n');

  if (dryRun) {
    console.log('DRY RUN - No changes were made\n');
  }

  console.log(`Credentials migrated: ${stats.credentialsMigrated}`);
  console.log(`Credentials failed:   ${stats.credentialsFailed}`);
  console.log(`Backup created:       ${stats.backupCreated ? 'Yes' : 'No'}`);
  console.log(`Config updated:       ${stats.configUpdated ? 'Yes' : 'No'}`);

  if (!dryRun && stats.credentialsMigrated > 0) {
    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the application starts correctly');
    console.log('2. Test authentication to UniFi and Doordeck');
    console.log('3. Remove the backup file after verification');
  }

  console.log('');
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let configPath = 'config.json';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run' || arg === '-n') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Credential Migration Script

Usage:
  npm run migrate-credentials [options] [config-path]
  ts-node scripts/migrate-credentials.ts [options] [config-path]

Options:
  --dry-run, -n    Perform a dry run without making changes
  --help, -h       Show this help message

Arguments:
  config-path      Path to configuration file (default: config.json)

Examples:
  # Migrate credentials from default config
  npm run migrate-credentials

  # Dry run to see what would be migrated
  npm run migrate-credentials --dry-run

  # Migrate from custom config path
  npm run migrate-credentials /path/to/config.json
      `);
      process.exit(0);
    } else if (!arg.startsWith('--') && !arg.startsWith('-')) {
      configPath = arg;
    }
  }

  try {
    console.log('='.repeat(60));
    console.log('UniFi-Doordeck Bridge - Credential Migration Tool');
    console.log('='.repeat(60));

    const stats = await migrateCredentials(configPath, dryRun);
    printSummary(stats, dryRun);

    process.exit(stats.credentialsFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nFatal Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { migrateCredentials, MigrationStats };
