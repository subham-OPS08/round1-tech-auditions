import React, { useState, useRef } from 'react';
import { api } from '../api.js';

export default function CheckInForm({ userRole, onSuccess, onRefreshNeeded }) {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'warning', message: '', details: null }

  // Store the request_id in a ref so it is generated ONCE per submit intent,
  // and preserved if there is a network error for safe retries!
  const pendingRequestId = useRef(null);

  const isViewer = userRole === 'VIEWER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewer) return;

    const trimmed = studentId.trim().toUpperCase();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Please enter a Student ID.' });
      return;
    }

    // Generate request_id ONCE per submit intent if not already set (e.g. from retry)
    if (!pendingRequestId.current) {
      pendingRequestId.current = 'req_' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now());
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.checkIn(trimmed, pendingRequestId.current);

      if (res.idempotent_replay) {
        setFeedback({
          type: 'warning',
          message: `Idempotent Replay: ${res.data.name} (${res.data.department}) was already registered with this request.`,
          details: res.data,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Successfully checked in: ${res.data.name} [${res.data.department}] (ID: ${res.data.student_id})`,
          details: res.data,
        });
        setStudentId('');
        if (onSuccess) onSuccess();
      }

      // Reset the request_id on completed response
      pendingRequestId.current = null;
    } catch (err) {
      if (err.code === 'DUPLICATE_ATTENDANCE') {
        const attId = err.extra?.attendance_id || '';
        const time = err.extra?.checked_in_at ? new Date(err.extra.checked_in_at).toLocaleTimeString() : '';
        setFeedback({
          type: 'error',
          message: `Student has already checked in.${attId ? ` (Record: ${attId} at ${time})` : ''}`,
        });
        // Clear request_id on business duplicate rejection
        pendingRequestId.current = null;
      } else if (err.code === 'CAPACITY_REACHED') {
        setFeedback({
          type: 'error',
          message: 'Check-in failed: Event has reached full capacity!',
        });
        pendingRequestId.current = null;
      } else if (err.code === 'STUDENT_NOT_FOUND') {
        setFeedback({
          type: 'error',
          message: `Student ID "${trimmed}" not found in pre-approved roster.`,
        });
        pendingRequestId.current = null;
      } else if (err.code === 'RATE_LIMITED') {
        const sec = err.extra?.retry_after || 60;
        setFeedback({
          type: 'error',
          message: `Check-in rate limit exceeded. Please wait ${sec} seconds.`,
        });
        // Preserve pendingRequestId.current so retry is idempotent
      } else {
        setFeedback({
          type: 'error',
          message: err.message || 'Check-in failed. Please try again.',
        });
        // Keep pendingRequestId.current on network failure so retry re-uses it
      }
    } finally {
      setLoading(false);
      if (onRefreshNeeded) onRefreshNeeded();
    }
  };

  if (isViewer) {
    return (
      <div className="panel" style={{ opacity: 0.85 }}>
        <h2 className="panel-title" style={{ marginBottom: '0.5rem' }}>Check-in Gate</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Your account has <strong>VIEWER</strong> permissions. Registration is disabled for this role.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Check-in Gate</h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Entry-only registration</span>
      </div>

      <form onSubmit={handleSubmit} className="checkin-form">
        <div className="input-group">
          <label className="input-label" htmlFor="student-id-input">
            Student ID
          </label>
          <input
            id="student-id-input"
            type="text"
            className="text-input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.toUpperCase())}
            placeholder="e.g. STU1001"
            disabled={loading}
            maxLength={20}
            required
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !studentId.trim()}
          style={{ minWidth: '140px' }}
        >
          {loading ? 'Processing...' : 'Register Entry'}
        </button>
      </form>

      {feedback && (
        <div
          className={`alert ${
            feedback.type === 'success'
              ? 'alert-success'
              : feedback.type === 'warning'
              ? 'alert-warning'
              : 'alert-danger'
          }`}
          role="status"
          aria-live="polite"
        >
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
