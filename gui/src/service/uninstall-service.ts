/**
 * Uninstall UniFi-Doordeck Bridge Windows Service
 * This script must be run with administrator privileges
 */

import { Service } from 'node-windows';
import { join } from 'path';

const serviceName = 'UniFi-Doordeck Bridge';

// Path to the compiled service file
const scriptPath = join(__dirname, 'bridge-service.js');

console.log('='.repeat(60));
console.log('UniFi-Doordeck Bridge Service Uninstallation');
console.log('='.repeat(60));
console.log(`Service Name: ${serviceName}`);
console.log('');

// Create a new service object
const svc = new Service({
  name: serviceName,
  script: scriptPath,
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  console.log('✓ Service uninstalled successfully');
  console.log('');
  console.log('The UniFi-Doordeck Bridge service has been removed.');
  process.exit(0);
});

// Listen for errors
svc.on('error', (err: Error) => {
  console.error('✗ Service error:', err);
  process.exit(1);
});

// Listen for not installed
svc.on('invalidinstallation', () => {
  console.log('⚠ Service is not installed');
  process.exit(0);
});

// Check if service exists
if (!svc.exists) {
  console.log('⚠ Service is not installed');
  process.exit(0);
}

// Stop the service first if it's running
console.log('Stopping service...');
svc.stop();

svc.on('stop', () => {
  console.log('✓ Service stopped');
  console.log('Uninstalling service...');
  svc.uninstall();
});
