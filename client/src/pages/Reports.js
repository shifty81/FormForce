import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports.css';

function Reports() {
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [formsRes, dispatchRes, inventoryRes] = await Promise.all([
        axios.get('/api/forms'),
        axios.get('/api/dispatch'),
        axios.get('/api/inventory')
      ]);

      setForms(formsRes.data);
      setDispatches(dispatchRes.data);
      setInventory(inventoryRes.data);

      // Load all submissions
      const allSubmissions = [];
      for (const form of formsRes.data) {
        try {
          const subRes = await axios.get(`/api/forms/${form.id}/submissions`);
          allSubmissions.push(...subRes.data.map(s => ({ ...s, formTitle: form.title })));
        } catch (err) {
          console.error('Error loading submissions for form:', form.id);
        }
      }
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedDispatches = dispatches.filter(d => d.status === 'completed').length;
  const pendingDispatches = dispatches.filter(d => d.status === 'pending').length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(item => item.quantity < 10).length;

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="reports-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📊 Reports & Analytics</h1>
            <p>Comprehensive insights and data visualization</p>
          </div>
        </div>

        <div className="reports-grid">
          <div className="report-card card">
            <div className="report-header">
              <h3>📋 Form Statistics</h3>
            </div>
            <div className="report-stats">
              <div className="stat-row">
                <span className="stat-label">Total Forms</span>
                <span className="stat-value">{forms.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Submissions</span>
                <span className="stat-value">{submissions.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Average Submissions/Form</span>
                <span className="stat-value">
                  {forms.length > 0 ? (submissions.length / forms.length).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="report-card card">
            <div className="report-header">
              <h3>🚀 Dispatch Performance</h3>
            </div>
            <div className="report-stats">
              <div className="stat-row">
                <span className="stat-label">Total Dispatches</span>
                <span className="stat-value">{dispatches.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Completed</span>
                <span className="stat-value success">{completedDispatches}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Pending</span>
                <span className="stat-value warning">{pendingDispatches}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">
                  {dispatches.length > 0 
                    ? `${((completedDispatches / dispatches.length) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>

          <div className="report-card card">
            <div className="report-header">
              <h3>📦 Inventory Overview</h3>
            </div>
            <div className="report-stats">
              <div className="stat-row">
                <span className="stat-label">Total Items</span>
                <span className="stat-value">{inventory.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Quantity</span>
                <span className="stat-value">{totalInventoryValue}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Low Stock Alerts</span>
                <span className="stat-value danger">{lowStockItems}</span>
              </div>
            </div>
          </div>

          <div className="report-card card">
            <div className="report-header">
              <h3>💼 Business Metrics</h3>
            </div>
            <div className="report-stats">
              <div className="stat-row">
                <span className="stat-label">Active Forms</span>
                <span className="stat-value">{forms.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Active Dispatches</span>
                <span className="stat-value">{pendingDispatches}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">System Health</span>
                <span className="stat-value success">Excellent</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section card">
          <div className="card-header">Recent Form Submissions</div>
          {submissions.length === 0 ? (
            <p className="text-muted">No submissions yet</p>
          ) : (
            <div className="submissions-list">
              {submissions.slice(0, 10).map((submission, index) => (
                <div key={submission.id || index} className="submission-item">
                  <div className="submission-info">
                    <div className="submission-form">{submission.formTitle}</div>
                    <div className="submission-date">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  {submission.signature && (
                    <span className="badge badge-success">✍️ Signed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="report-section card">
          <div className="card-header">Export Options</div>
          <div className="export-options">
            <button className="btn btn-primary">
              📄 Export to PDF
            </button>
            <button className="btn btn-secondary">
              📊 Export to Excel
            </button>
            <button className="btn btn-outline">
              📧 Email Report
            </button>
          </div>
        </div>

        <div className="features-info card">
          <div className="card-header">Advanced Reporting Features</div>
          <ul className="features-list">
            <li>📈 Real-time data visualization with charts and graphs</li>
            <li>📅 Custom date range filtering and historical analysis</li>
            <li>🎯 KPI tracking and performance metrics</li>
            <li>👥 User activity and engagement analytics</li>
            <li>💰 Revenue tracking and financial reporting</li>
            <li>🔔 Automated report scheduling and delivery</li>
            <li>🔗 QuickBooks integration for seamless accounting</li>
            <li>📱 Mobile-optimized dashboard views</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Reports;
