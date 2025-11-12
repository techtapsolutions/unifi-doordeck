# Deployment Checklist - Windows Service Architecture

## Pre-Deployment

- [ ] Node.js 20+ installed on target machine
- [ ] Administrator access available for installation
- [ ] UniFi Access controller IP/hostname available
- [ ] UniFi admin credentials available
- [ ] Doordeck API key available
- [ ] Doordeck secret key available
- [ ] Doordeck customer ID available

## Build & Setup

- [ ] Clone/copy project files to build machine
- [ ] Install dependencies: `npm install`
- [ ] Run full build: `npm run build:all`
- [ ] Verify dist/ created: `ls dist/`
- [ ] Verify dist-service/ created: `ls dist-service/`
- [ ] Build service only: `npm run build:service`
- [ ] Verify service files: `ls dist-service/service-main.js`

## Installation

- [ ] Copy dist-service/ to target machine
- [ ] Copy scripts/install-service.js to target machine
- [ ] Copy package.json and package-lock.json
- [ ] Run as Administrator: `npm run service:install`
- [ ] Verify service registered: `sc query UniFiDoordeckBridge`

## Configuration

- [ ] Edit C:\ProgramData\UniFi-Doordeck-Bridge\config.json
- [ ] Set UniFi host: "hostname or IP"
- [ ] Set UniFi username
- [ ] Set UniFi password
- [ ] Set Doordeck API key
- [ ] Set Doordeck secret key
- [ ] Set Doordeck customer ID
- [ ] Add device mappings
- [ ] Validate JSON syntax
- [ ] Save and close file

## Service Startup

- [ ] Start service: `npm run service:start`
- [ ] Check status: `npm run service:status`
- [ ] Verify status shows "RUNNING"
- [ ] Wait 5 seconds for bridge to initialize
- [ ] Check logs: `dir C:\ProgramData\UniFi-Doordeck-Bridge\logs\`

## Verification

- [ ] Test REST API health: `curl http://127.0.0.1:9090/api/health`
- [ ] Test status endpoint: `curl http://127.0.0.1:9090/api/status`
- [ ] Verify bridge connected: Check stats endpoint
- [ ] View recent logs: `curl http://127.0.0.1:9090/api/service/logs`
- [ ] Confirm no errors in logs

## Electron UI Setup

- [ ] Copy electron-ui/ folder to UI machine
- [ ] Install dependencies: `cd electron-ui && npm install`
- [ ] Start UI: `npm start`
- [ ] Verify UI can see service status
- [ ] Verify stats displaying correctly
- [ ] Check service shows "running"

## Testing

- [ ] Test device unlock from UI
- [ ] Verify unlock appears in logs
- [ ] Confirm UniFi logs show access
- [ ] Verify Doordeck API call succeeded
- [ ] Test with multiple devices
- [ ] Test config reload (edit config.json and verify service reloads)

## Service Control

- [ ] Test stop: `npm run service:stop`
- [ ] Verify stops cleanly: `npm run service:status`
- [ ] Wait 5 seconds
- [ ] Test restart: `npm run service:start`
- [ ] Verify starts cleanly

## Windows Integration

- [ ] Verify service in Services.msc
- [ ] Check service startup type is "Automatic"
- [ ] Verify service user (LocalSystem or configured user)
- [ ] Check recovery settings are enabled
- [ ] Verify Start Menu shortcuts created
- [ ] Test shortcuts work

## Monitoring

- [ ] Check logs are being created
- [ ] Verify log rotation working
- [ ] Monitor memory usage (should be stable)
- [ ] Monitor CPU usage (should be low at idle)
- [ ] Check for any error patterns
- [ ] Verify timestamps in logs are correct

## Edge Cases

- [ ] Stop service, restart machine, verify auto-start
- [ ] Manually edit config.json, verify auto-reload
- [ ] Restart service from UI, verify works
- [ ] Disconnect from UniFi, verify error handling
- [ ] Invalid config, verify graceful error
- [ ] Remove config file, verify service creates default
- [ ] Test API endpoints individually

## Documentation

- [ ] Backup original configuration
- [ ] Document admin username/password (securely)
- [ ] Document service name: UniFiDoordeckBridge
- [ ] Document service port: 9090
- [ ] Document config location
- [ ] Document logs location
- [ ] Document API endpoints
- [ ] Create admin guide for operations team

## Post-Deployment

- [ ] Set service to auto-start: `sc config UniFiDoordeckBridge start= auto`
- [ ] Enable service recovery: Already configured
- [ ] Set up log monitoring
- [ ] Set up alerting for service failures
- [ ] Configure Windows Task Scheduler backup (optional)
- [ ] Document rollback procedure
- [ ] Train operations team

## Rollback Plan (if needed)

1. Stop service: `npm run service:stop`
2. Uninstall service: `npm run service:uninstall`
3. Delete dist-service/
4. Revert to previous version
5. Reinstall previous service
6. Start service

## Success Criteria

- [ ] Service installed and running
- [ ] REST API responding on port 9090
- [ ] Config changes apply without restart
- [ ] Electron UI connects and displays status
- [ ] Device unlocks work end-to-end
- [ ] Service starts on machine reboot
- [ ] No errors in logs
- [ ] Performance metrics acceptable

## Performance Baseline

Record these values for comparison:
- Service startup time: _____ seconds
- Memory usage (idle): _____ MB
- Memory usage (active): _____ MB
- CPU usage (idle): ______ %
- API response time: ______ ms
- Config reload time: ______ seconds

## Contact & Support

- Documentation: See SERVICE-INTEGRATION-GUIDE.md
- Troubleshooting: See QUICK-SETUP.md
- Architecture: See SERVICE-ARCHITECTURE.md
- Logs location: C:\ProgramData\UniFi-Doordeck-Bridge\logs\

---

**Deployment Date:** ____________
**Deployed By:** ________________
**Notes:** _____________________
