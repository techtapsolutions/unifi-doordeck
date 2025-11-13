/**
 * Install UniFi-Doordeck Bridge as Windows Service
 * This script must be run with administrator privileges
 */

import { Service } from 'node-windows';
import { join } from 'path';

const serviceName = 'UniFi-Doordeck Bridge';
const serviceDescription = 'Bridge service between UniFi Access and Doordeck Cloud';

// Path to the compiled service file
// When running from dist, the path will be relative to dist/service
const scriptPath = join(__dirname, 'bridge-service.js');

console.log('='.repeat(60));
console.log('UniFi-Doordeck Bridge Service Installation');
console.log('='.repeat(60));
console.log(`Service Name: ${serviceName}`);
console.log(`Script Path: ${scriptPath}`);
console.log('');

// Create a new service object
const svc = new Service({
  name: serviceName,
  description: serviceDescription,
  script: scriptPath,
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Listen for the "install" event
svc.on('install', () => {
  console.log('✓ Service installed successfully');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', () => {
  console.log('✓ Service started successfully');
  console.log('');
  console.log('The UniFi-Doordeck Bridge service is now running.');
  console.log('You can manage it through:');
  console.log('  - Windows Services (services.msc)');
  console.log('  - The UniFi-Doordeck Bridge GUI');
  console.log('');
  process.exit(0);
});

// Listen for errors
svc.on('error', (err: Error) => {
  console.error('✗ Service error:', err);
  process.exit(1);
});

// Listen for already installed
svc.on('alreadyinstalled', () => {
  console.log('⚠ Service is already installed');
  console.log('If you want to reinstall, please uninstall it first.');
  process.exit(0);
});

// Check if service exists
if (svc.exists) {
  console.log('⚠ Service already exists');
  console.log('If you want to reinstall, run uninstall-service first.');
  process.exit(0);
}

// Install the service
console.log('Installing service...');
svc.install();
