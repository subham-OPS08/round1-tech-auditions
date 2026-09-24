import React, { useState, useEffect } from 'react';

const DEPARTMENTS = ['ALL', 'AIML', 'CSE', 'ECE', 'MECH'];
const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'INSIDE', label: 'Checked In (INSIDE)' },
  { value: 'NOT_ENTERED', label: 'Not Entered' },
];

export default function SearchBar({ onFilterChange }) {
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('');

  // Debounce the text query by ~300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({
        q: q.trim(),
        department: department === 'ALL' ? '' : department,
        status,
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [q, department, status]);

  return (
    <div className="filter-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="text-input"
          style={{ width: '100%' }}
          placeholder="Search student ID (e.g. STU1024) or full/partial name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search students"
        />
      </div>

      <select
        className="filter-select"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        aria-label="Filter by department"
      >
        {DEPARTMENTS.map((dept) => (
          <option key={dept} value={dept}>
            {dept === 'ALL' ? 'All Departments' : dept}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Filter by attendance status"
      >
        {STATUSES.map((st) => (
          <option key={st.value} value={st.value}>
            {st.label}
          </option>
        ))}
      </select>
    </div>
  );
}
