import React from 'react';

export default function StatCards({ stats, loading }) {
  const {
    total_students = 0,
    checked_in = 0,
    capacity = 0,
    remaining = 0,
    occupancy_percent = 0,
  } = stats || {};

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-title">Total Roster</div>
        <div className="stat-value">{loading ? '...' : total_students}</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Checked In</div>
        <div className="stat-value" style={{ color: 'var(--accent)' }}>
          {loading ? '...' : checked_in}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Capacity</div>
        <div className="stat-value">{loading ? '...' : capacity}</div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Remaining Slots</div>
        <div className="stat-value" style={{ color: remaining === 0 ? 'var(--danger-text)' : 'inherit' }}>
          {loading ? '...' : remaining}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-title">Occupancy</div>
        <div className="stat-value">{loading ? '...' : `${occupancy_percent}%`}</div>
        <div className="progress-track" aria-label="Occupancy progress">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, occupancy_percent)}%`,
              backgroundColor: occupancy_percent >= 100 ? 'var(--danger-text)' : 'var(--accent)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
