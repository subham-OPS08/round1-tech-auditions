import React from 'react';

export default function AttendanceTable({ records, loading, error, isRosterView = false }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        Loading records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <span>Failed to load records: {error}</span>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        No matching records found.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Status</th>
            <th>Attendance ID</th>
            <th>Check-in Time</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => {
            const isInside = r.status === 'INSIDE';
            const formattedTime = r.checked_in_at
              ? new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '—';

            return (
              <tr key={r.student_id || idx}>
                <td style={{ fontWeight: 600 }}>{r.student_id}</td>
                <td>{r.name || '—'}</td>
                <td>
                  <span className="role-tag" style={{ fontSize: '0.75rem' }}>{r.department || '—'}</span>
                </td>
                <td>
                  <span className={`badge ${isInside ? 'badge-inside' : 'badge-not-entered'}`}>
                    {isInside ? 'INSIDE' : 'NOT ENTERED'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {r.attendance_id || '—'}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {formattedTime}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
