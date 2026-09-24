import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';
import StatCards from './StatCards.jsx';
import CheckInForm from './CheckInForm.jsx';
import SearchBar from './SearchBar.jsx';
import AttendanceTable from './AttendanceTable.jsx';

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [records, setRecords] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);

  const [filters, setFilters] = useState({ q: '', department: '', status: '' });

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch filtered merged view
  const fetchRecords = useCallback(async (currentFilters) => {
    setTableLoading(true);
    setTableError(null);
    try {
      const res = await api.searchAttendance(currentFilters);
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (err) {
      if (err.code === 'RATE_LIMITED') {
        setTableError('Search rate limit reached. Please wait a moment.');
      } else {
        setTableError(err.message || 'Error fetching records.');
      }
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRecords(filters);
  }, [filters, fetchRecords]);

  const handleCheckInSuccess = () => {
    fetchStats();
    fetchRecords(filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const roleClass = (user?.role || '').toLowerCase();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="brand">
          <span>Event Attendance</span>
          <span className="brand-badge">Tracker</span>
        </div>

        <div className="nav-user">
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.username}</span>
          <span className={`role-tag ${roleClass}`}>{user?.role}</span>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* Stat Cards */}
        <StatCards stats={stats} loading={statsLoading} />

        {/* Check-In Form (hidden or disabled for VIEWER) */}
        <CheckInForm
          userRole={user?.role}
          onSuccess={handleCheckInSuccess}
          onRefreshNeeded={fetchStats}
        />

        {/* Attendance Records & Search */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Attendees & Roster</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
                Search by student ID, name, or filter by department and entry status
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8125rem' }}
              onClick={() => {
                fetchStats();
                fetchRecords(filters);
              }}
            >
              Refresh
            </button>
          </div>

          <SearchBar onFilterChange={handleFilterChange} />

          <AttendanceTable
            records={records}
            loading={tableLoading}
            error={tableError}
          />
        </div>
      </main>
    </div>
  );
}
