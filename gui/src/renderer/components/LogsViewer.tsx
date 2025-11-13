/**
 * Logs Viewer Component
 * Real-time log viewer with filtering, search, and export capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import type { LogEntry } from '../../shared/types';

interface LogsViewerProps {
  onClose: () => void;
}

type LogLevel = 'all' | 'error' | 'warn' | 'info' | 'debug';

export default function LogsViewer({ onClose }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Load initial logs
  useEffect(() => {
    loadLogs();

    // Subscribe to new log events
    const unsubscribe = window.bridge.onLog((log: LogEntry) => {
      setLogs((prevLogs) => [...prevLogs, log].slice(-200)); // Keep last 200 logs
    });

    // Refresh logs every 5 seconds
    const interval = setInterval(loadLogs, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Apply filters when logs or filters change
  useEffect(() => {
    applyFilters();
  }, [logs, levelFilter, searchQuery]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [filteredLogs, autoScroll]);

  async function loadLogs() {
    try {
      const response = await window.bridge.getLogs(200);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...logs];

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query))
      );
    }

    setFilteredLogs(filtered);
  }

  function scrollToBottom() {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleClearLogs() {
    if (!confirm('Are you sure you want to clear all logs?')) {
      return;
    }

    try {
      const response = await window.bridge.clearLogs();
      if (response.success) {
        setLogs([]);
        setFilteredLogs([]);
      } else {
        setError('Failed to clear logs');
      }
    } catch (err) {
      setError('Failed to clear logs');
    }
  }

  function handleExportLogs() {
    const logsText = filteredLogs
      .map((log) => {
        const metadata = log.metadata ? ` ${JSON.stringify(log.metadata)}` : '';
        return `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}${metadata}`;
      })
      .join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bridge-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getLogLevelClass(level: string): string {
    switch (level) {
      case 'error':
        return 'log-level-error';
      case 'warn':
        return 'log-level-warn';
      case 'info':
        return 'log-level-info';
      case 'debug':
        return 'log-level-debug';
      default:
        return '';
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal logs-modal">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal logs-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>Service Logs</h2>
            <p className="subtitle">
              Showing {filteredLogs.length} of {logs.length} log entries
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="logs-controls">
          {/* Level Filter */}
          <div className="control-group">
            <label>Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
              className="form-control form-control-small"
            >
              <option value="all">All</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Search */}
          <div className="control-group control-group-grow">
            <label>Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="form-control form-control-small"
            />
          </div>

          {/* Auto-scroll Toggle */}
          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span>Auto-scroll</span>
            </label>
          </div>

          {/* Actions */}
          <div className="control-group">
            <button
              className="btn btn-small btn-secondary"
              onClick={handleExportLogs}
              disabled={filteredLogs.length === 0}
            >
              Export
            </button>
            <button
              className="btn btn-small btn-danger"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="logs-content" ref={logsContainerRef}>
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <p>No logs to display</p>
              {searchQuery && <p className="help-text">Try adjusting your search query</p>}
              {levelFilter !== 'all' && !searchQuery && (
                <p className="help-text">No {levelFilter} logs found</p>
              )}
            </div>
          ) : (
            <div className="logs-list">
              {filteredLogs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className={`log-entry ${getLogLevelClass(log.level)}`}>
                  <div className="log-header">
                    <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                    <span className={`log-level log-level-badge-${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="log-message">{log.message}</div>
                  {log.metadata && (
                    <div className="log-metadata">
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
