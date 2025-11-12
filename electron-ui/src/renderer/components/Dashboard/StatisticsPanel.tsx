import React from 'react';
import { Statistics } from '../../../shared/types';

interface StatisticsPanelProps {
  statistics: Statistics;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics }) => {
  const successRate =
    statistics.totalUnlocks > 0
      ? ((statistics.successfulUnlocks / statistics.totalUnlocks) * 100).toFixed(1)
      : '0';

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="panel statistics-panel">
      <div className="panel-header">
        <h2>Statistics</h2>
      </div>

      <div className="panel-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#3B82F6' }}>
              🔓
            </div>
            <div className="stat-details">
              <div className="stat-value">{statistics.totalUnlocks}</div>
              <div className="stat-label">Total Unlocks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#10B981' }}>
              ✓
            </div>
            <div className="stat-details">
              <div className="stat-value">{statistics.successfulUnlocks}</div>
              <div className="stat-label">Successful</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#EF4444' }}>
              ✗
            </div>
            <div className="stat-details">
              <div className="stat-value">{statistics.failedUnlocks}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#8B5CF6' }}>
              %
            </div>
            <div className="stat-details">
              <div className="stat-value">{successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#F59E0B' }}>
              ⚠
            </div>
            <div className="stat-details">
              <div className="stat-value">{statistics.errors24h}</div>
              <div className="stat-label">Errors (24h)</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#06B6D4' }}>
              ⏱
            </div>
            <div className="stat-details">
              <div className="stat-value">{statistics.averageResponseTime}ms</div>
              <div className="stat-label">Avg Response</div>
            </div>
          </div>
        </div>

        {statistics.lastUnlockTime && (
          <div className="last-unlock-info">
            <span className="info-label">Last Unlock:</span>
            <span className="info-value">{formatTime(statistics.lastUnlockTime)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel;
