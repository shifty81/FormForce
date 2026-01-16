import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimeTracking.css';

function TimeTracking({ socket }) {
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockOutEntryId, setClockOutEntryId] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    activeEmployees: 0
  });
  const [formData, setFormData] = useState({
    hourly_rate: '25.00',
    notes: '',
    break_duration: 0
  });

  useEffect(() => {
    loadData();
    loadUsers();
    getCurrentUser();
    
    const interval = setInterval(() => {
      setActiveEntries(prev => [...prev]); // Trigger re-render for live timers
    }, 1000);

    if (socket) {
      socket.on('timeentry:created', (entry) => {
        setTimeEntries(prev => [entry, ...prev]);
        if (entry.status === 'active') {
          setActiveEntries(prev => [entry, ...prev]);
        }
      });
      
      socket.on('timeentry:updated', (entry) => {
        setTimeEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
        if (entry.status === 'active') {
          setActiveEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
        } else {
          setActiveEntries(prev => prev.filter(e => e.id !== entry.id));
        }
      });
      
      socket.on('timeentry:deleted', ({ id }) => {
        setTimeEntries(prev => prev.filter(e => e.id !== id));
        setActiveEntries(prev => prev.filter(e => e.id !== id));
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('timeentry:created');
        socket.off('timeentry:updated');
        socket.off('timeentry:deleted');
      }
    };
  }, [socket]);

  useEffect(() => {
    calculateStats(timeEntries);
  }, [timeEntries]);

  const loadData = async () => {
    try {
      const [entriesRes, activeRes] = await Promise.all([
        axios.get('/api/timetracking'),
        axios.get('/api/timetracking/active')
      ]);
      setTimeEntries(entriesRes.data);
      setActiveEntries(activeRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const calculateStats = (entries) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayHours = entries
      .filter(e => new Date(e.clock_in) >= todayStart && e.total_hours)
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);

    const weekHours = entries
      .filter(e => new Date(e.clock_in) >= weekStart && e.total_hours)
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);

    setStats({
      todayHours: todayHours.toFixed(2),
      weekHours: weekHours.toFixed(2),
      activeEmployees: activeEntries.length
    });
  };

  const handleClockIn = async () => {
    if (!currentUser) {
      alert('Please log in to clock in');
      return;
    }

    try {
      await axios.post('/api/timetracking/clock-in', {
        user_id: currentUser.id,
        hourly_rate: parseFloat(formData.hourly_rate),
        notes: formData.notes
      });
      setFormData({ hourly_rate: '25.00', notes: '', break_duration: 0 });
      loadData();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert(error.response?.data?.error || 'Failed to clock in');
    }
  };

  const handleClockOut = async (entryId) => {
    setClockOutEntryId(entryId);
    setShowClockOutModal(true);
  };

  const submitClockOut = async () => {
    try {
      await axios.post(`/api/timetracking/clock-out/${clockOutEntryId}`, {
        break_duration: parseInt(formData.break_duration) || 0
      });
      setShowClockOutModal(false);
      setClockOutEntryId(null);
      setFormData({ ...formData, break_duration: 0 });
      loadData();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert(error.response?.data?.error || 'Failed to clock out');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      clock_in: entry.clock_in ? new Date(entry.clock_in).toISOString().slice(0, 16) : '',
      clock_out: entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : '',
      break_duration: entry.break_duration || 0,
      hourly_rate: entry.hourly_rate || '25.00',
      notes: entry.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await axios.delete(`/api/timetracking/${id}`);
        loadData();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/timetracking/${editingEntry.id}`, {
        clock_in: formData.clock_in,
        clock_out: formData.clock_out,
        break_duration: parseInt(formData.break_duration),
        hourly_rate: parseFloat(formData.hourly_rate),
        notes: formData.notes
      });
      setShowModal(false);
      setEditingEntry(null);
      setFormData({ hourly_rate: '25.00', notes: '', break_duration: 0 });
      loadData();
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update time entry');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateElapsedTime = (clockIn) => {
    const now = new Date();
    const start = new Date(clockIn);
    const elapsed = (now - start) / 1000; // seconds
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = Math.floor(elapsed % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredEntries = timeEntries.filter(entry => {
    if (filterUserId && entry.user_id !== filterUserId) return false;
    if (startDate && new Date(entry.clock_in) < new Date(startDate)) return false;
    if (endDate && new Date(entry.clock_in) > new Date(endDate)) return false;
    return true;
  });

  const isUserClockedIn = currentUser && activeEntries.some(e => e.user_id === currentUser.id);
  const currentUserActiveEntry = activeEntries.find(e => e.user_id === currentUser?.id);

  if (loading) {
    return <div className="loading">Loading time tracking data...</div>;
  }

  return (
    <div className="timetracking-container">
      <div className="timetracking-header">
        <div className="header-content">
          <h1>Time Tracking</h1>
          <p>Track employee hours and manage payroll</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.todayHours}</div>
          <div className="stat-label">Hours Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.weekHours}</div>
          <div className="stat-label">Hours This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeEmployees}</div>
          <div className="stat-label">Active Employees</div>
        </div>
      </div>

      {/* Clock In/Out Section */}
      <div className="clock-section">
        <div className="clock-card">
          <h2>Clock In/Out</h2>
          {!isUserClockedIn ? (
            <div className="clock-in-form">
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  placeholder="Add notes about your shift..."
                />
              </div>
              <button onClick={handleClockIn} className="btn-clock-in">
                Clock In
              </button>
            </div>
          ) : (
            <div className="clocked-in-status">
              <div className="status-indicator">
                <span className="pulse-dot"></span>
                <span className="status-text">Clocked In</span>
              </div>
              <div className="elapsed-time">
                {calculateElapsedTime(currentUserActiveEntry.clock_in)}
              </div>
              <p className="clock-in-time">
                Since {formatTime(currentUserActiveEntry.clock_in)}
              </p>
              <button 
                onClick={() => handleClockOut(currentUserActiveEntry.id)} 
                className="btn-clock-out"
              >
                Clock Out
              </button>
            </div>
          )}
        </div>

        {/* Currently Clocked In Users */}
        {activeEntries.length > 0 && (
          <div className="active-users-card">
            <h3>Currently Clocked In</h3>
            <div className="active-users-list">
              {activeEntries.map(entry => (
                <div key={entry.id} className="active-user-item">
                  <div className="user-info">
                    <span className="pulse-dot-small"></span>
                    <span className="user-name">{entry.username}</span>
                  </div>
                  <div className="user-time">
                    {calculateElapsedTime(entry.clock_in)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Filter by User</label>
            <select 
              value={filterUserId} 
              onChange={(e) => setFilterUserId(e.target.value)}
              className="filter-select"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <button 
              onClick={() => {
                setFilterUserId('');
                setStartDate('');
                setEndDate('');
              }}
              className="btn-clear-filters"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="entries-section">
        <h2>Time Entries</h2>
        <div className="table-container">
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Break (min)</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">No time entries found</td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className={entry.status === 'active' ? 'active-row' : ''}>
                    <td>{formatDate(entry.clock_in)}</td>
                    <td>
                      <div className="employee-cell">
                        {entry.status === 'active' && <span className="pulse-dot-small"></span>}
                        {entry.username}
                      </div>
                    </td>
                    <td>{formatTime(entry.clock_in)}</td>
                    <td>
                      {entry.status === 'active' ? (
                        <span className="live-timer">{calculateElapsedTime(entry.clock_in)}</span>
                      ) : (
                        formatTime(entry.clock_out)
                      )}
                    </td>
                    <td>{entry.break_duration || 0}</td>
                    <td>{entry.total_hours ? entry.total_hours.toFixed(2) : '-'}</td>
                    <td>${entry.hourly_rate ? entry.hourly_rate.toFixed(2) : '0.00'}</td>
                    <td>${entry.total_pay ? entry.total_pay.toFixed(2) : '0.00'}</td>
                    <td>
                      <span className={`status-badge status-${entry.status}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {entry.status === 'active' && entry.user_id === currentUser?.id && (
                          <button
                            onClick={() => handleClockOut(entry.id)}
                            className="btn-action btn-clock-out-small"
                            title="Clock Out"
                          >
                            Clock Out
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(entry)}
                          className="btn-action btn-edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="btn-action btn-delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Time Entry</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Clock In</label>
                <input
                  type="datetime-local"
                  value={formData.clock_in || ''}
                  onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Clock Out</label>
                <input
                  type="datetime-local"
                  value={formData.clock_out || ''}
                  onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Break Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: e.target.value })}
                  className="form-input"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock Out Modal */}
      {showClockOutModal && (
        <div className="modal-overlay" onClick={() => setShowClockOutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Clock Out</h2>
              <button onClick={() => setShowClockOutModal(false)} className="modal-close">×</button>
            </div>
            <div className="form-group">
              <label>Break Duration (minutes)</label>
              <input
                type="number"
                value={formData.break_duration}
                onChange={(e) => setFormData({ ...formData, break_duration: e.target.value })}
                className="form-input"
                min="0"
                placeholder="Enter break time in minutes"
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Break time will be deducted from total hours
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowClockOutModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={submitClockOut} className="btn-save">
                Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeTracking;
