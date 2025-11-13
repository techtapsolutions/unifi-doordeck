/**
 * Update Notification Component
 * Shows update availability, download progress, and install prompts
 */

import React, { useState, useEffect } from 'react';
import type { UpdateStatus, UpdateAvailableInfo, UpdateDownloadedInfo } from '../../shared/types';

interface UpdateNotificationProps {
  onClose?: () => void;
}

export default function UpdateNotification({ onClose }: UpdateNotificationProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateAvailableInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to update events
    const unsubscribeStatus = window.bridge.onUpdateStatus((status: UpdateStatus) => {
      setUpdateStatus(status);
      if (status.error) {
        setError(status.error);
      }
    });

    const unsubscribeAvailable = window.bridge.onUpdateAvailable((info: UpdateAvailableInfo) => {
      setUpdateInfo(info);
      setError(null);
    });

    const unsubscribeDownloaded = window.bridge.onUpdateDownloaded((info: UpdateDownloadedInfo) => {
      setDownloading(false);
      setShowInstallPrompt(true);
    });

    // Get initial status
    loadUpdateStatus();

    return () => {
      unsubscribeStatus();
      unsubscribeAvailable();
      unsubscribeDownloaded();
    };
  }, []);

  async function loadUpdateStatus() {
    try {
      const response = await window.bridge.getUpdateStatus();
      if (response.success && response.data) {
        setUpdateStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to load update status:', err);
    }
  }

  async function handleCheckForUpdates() {
    setError(null);
    try {
      const response = await window.bridge.checkForUpdates();
      if (!response.success) {
        setError(response.error || 'Failed to check for updates');
      }
    } catch (err) {
      setError('Failed to check for updates');
    }
  }

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const response = await window.bridge.downloadUpdate();
      if (!response.success) {
        setError(response.error || 'Failed to download update');
        setDownloading(false);
      }
    } catch (err) {
      setError('Failed to download update');
      setDownloading(false);
    }
  }

  async function handleInstallNow() {
    try {
      await window.bridge.installUpdate();
      // App will quit and restart
    } catch (err) {
      setError('Failed to install update');
    }
  }

  function handleInstallLater() {
    setShowInstallPrompt(false);
    if (onClose) {
      onClose();
    }
  }

  // Don't show notification if nothing to show
  if (!updateStatus?.available && !updateStatus?.checking && !updateInfo && !showInstallPrompt && !error) {
    return null;
  }

  // Install prompt (highest priority)
  if (showInstallPrompt) {
    return (
      <div className="modal-overlay">
        <div className="modal update-modal">
          <header className="modal-header">
            <h2>Update Ready to Install</h2>
            <button className="close-button" onClick={handleInstallLater}>
              ×
            </button>
          </header>

          <div className="modal-body">
            <div className="update-ready-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>

            <p className="update-message">
              Version <strong>{updateStatus?.version || 'latest'}</strong> has been downloaded and is ready to install.
            </p>

            <p className="update-note">
              The application will restart to complete the installation.
            </p>
          </div>

          <footer className="modal-footer">
            <button className="btn btn-secondary" onClick={handleInstallLater}>
              Install on Next Restart
            </button>
            <button className="btn btn-primary" onClick={handleInstallNow}>
              Restart and Install Now
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // Downloading update
  if (downloading || updateStatus?.downloading) {
    const progress = updateStatus?.progress?.percent || 0;
    const transferred = formatBytes(updateStatus?.progress?.transferred || 0);
    const total = formatBytes(updateStatus?.progress?.total || 0);
    const speed = formatBytes(updateStatus?.progress?.bytesPerSecond || 0);

    return (
      <div className="modal-overlay">
        <div className="modal update-modal">
          <header className="modal-header">
            <h2>Downloading Update</h2>
          </header>

          <div className="modal-body">
            <div className="download-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">
                <span className="progress-percent">{progress.toFixed(1)}%</span>
                <span className="progress-size">
                  {transferred} / {total}
                </span>
              </div>
              {speed > 0 && (
                <div className="progress-speed">
                  Download speed: {speed}/s
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Update available
  if (updateInfo || updateStatus?.available) {
    return (
      <div className="modal-overlay">
        <div className="modal update-modal">
          <header className="modal-header">
            <h2>Update Available</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </header>

          <div className="modal-body">
            <div className="update-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16V8m0 8l-4-4m4 4l4-4"/>
              </svg>
            </div>

            <p className="update-version">
              Version <strong>{updateInfo?.version || updateStatus?.version}</strong> is available
            </p>

            {updateInfo?.releaseNotes && (
              <div className="release-notes">
                <h3>What's New:</h3>
                <div className="release-notes-content">
                  {updateInfo.releaseNotes}
                </div>
              </div>
            )}

            {updateInfo?.releaseDate && (
              <p className="release-date">
                Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
              </p>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Remind Me Later
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              Download Update
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // Checking for updates
  if (updateStatus?.checking) {
    return (
      <div className="update-checking-banner">
        <div className="spinner small"></div>
        <span>Checking for updates...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="update-error-banner">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
        <div className="update-error-actions">
          <button className="btn btn-small btn-secondary" onClick={handleCheckForUpdates}>
            Retry
          </button>
          <button
            className="btn btn-small btn-secondary"
            onClick={() => {
              setError(null);
              if (onClose) {
                onClose();
              }
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
