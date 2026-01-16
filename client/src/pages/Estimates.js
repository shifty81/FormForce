import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Estimates.css';

function Estimates({ socket }) {
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    status: 'draft',
    tax_rate: 8.5,
    valid_until: '',
    notes: ''
  });
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    loadEstimates();
    loadCustomers();

    if (socket) {
      socket.on('estimate:created', (estimate) => {
        setEstimates(prev => [estimate, ...prev]);
      });
      socket.on('estimate:updated', (estimate) => {
        setEstimates(prev => prev.map(e => e.id === estimate.id ? estimate : e));
      });
      socket.on('estimate:deleted', (id) => {
        setEstimates(prev => prev.filter(e => e.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('estimate:created');
        socket.off('estimate:updated');
        socket.off('estimate:deleted');
      }
    };
  }, [socket]);

  const loadEstimates = async () => {
    try {
      const response = await axios.get('/api/estimates');
      setEstimates(response.data);
    } catch (error) {
      console.error('Error loading estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const taxAmount = subtotal * (parseFloat(formData.tax_rate) || 0) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        line_items: JSON.stringify(lineItems)
      };

      if (editingEstimate) {
        await axios.put(`/api/estimates/${editingEstimate.id}`, data);
      } else {
        await axios.post('/api/estimates', data);
      }
      setShowModal(false);
      resetForm();
      loadEstimates();
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Failed to save estimate');
    }
  };

  const handleEdit = (estimate) => {
    setEditingEstimate(estimate);
    setFormData({
      customer_id: estimate.customer_id,
      title: estimate.title,
      description: estimate.description || '',
      status: estimate.status,
      tax_rate: estimate.tax_rate,
      valid_until: estimate.valid_until || '',
      notes: estimate.notes || ''
    });
    setLineItems(JSON.parse(estimate.line_items || '[{"description":"","quantity":1,"unit_price":0}]'));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      try {
        await axios.delete(`/api/estimates/${id}`);
        loadEstimates();
      } catch (error) {
        console.error('Error deleting estimate:', error);
      }
    }
  };

  const handleConvertToInvoice = async (estimateId) => {
    if (window.confirm('Convert this estimate to an invoice?')) {
      try {
        const response = await axios.post(`/api/estimates/${estimateId}/convert-to-invoice`);
        alert(`Invoice ${response.data.invoice_number} created successfully!`);
        loadEstimates();
      } catch (error) {
        console.error('Error converting estimate:', error);
        alert('Failed to convert estimate to invoice');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      title: '',
      description: '',
      status: 'draft',
      tax_rate: 8.5,
      valid_until: '',
      notes: ''
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setEditingEstimate(null);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = estimate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (estimate.contact_name && estimate.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || estimate.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: estimates.length,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent').length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
    totalValue: estimates.reduce((sum, e) => sum + (e.total || 0), 0)
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return <div className="loading">Loading estimates...</div>;
  }

  return (
    <div className="estimates-container">
      <div className="estimates-header">
        <div className="header-content">
          <h1>📝 Estimates</h1>
          <p>Create and manage customer estimates</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Estimate
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Estimates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.draft}</div>
          <div className="stat-label">Draft</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.sent}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${stats.totalValue.toFixed(2)}</div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <div className="filter-section">
        <input
          type="text"
          placeholder="🔍 Search estimates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <div className="estimates-list">
        {filteredEstimates.length === 0 ? (
          <div className="no-estimates">
            <p>No estimates found. Create your first estimate!</p>
          </div>
        ) : (
          filteredEstimates.map(estimate => (
            <div key={estimate.id} className="estimate-card">
              <div className="estimate-header">
                <div>
                  <h3>{estimate.estimate_number}</h3>
                  <div className="estimate-title">{estimate.title}</div>
                  <div className="customer-info">
                    👤 {estimate.contact_name}
                    {estimate.company_name && ` - ${estimate.company_name}`}
                  </div>
                </div>
                <div className="estimate-amount">
                  <div className="amount">${estimate.total?.toFixed(2)}</div>
                  <span className={`status-badge status-${estimate.status}`}>
                    {estimate.status}
                  </span>
                </div>
              </div>
              
              <div className="estimate-footer">
                <div className="estimate-meta">
                  <span>Created: {new Date(estimate.created_at).toLocaleDateString()}</span>
                  {estimate.valid_until && (
                    <span>Valid Until: {new Date(estimate.valid_until).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="estimate-actions">
                  {estimate.status === 'sent' && (
                    <button 
                      onClick={() => handleConvertToInvoice(estimate.id)} 
                      className="btn-convert"
                      title="Convert to Invoice"
                    >
                      💰 Convert
                    </button>
                  )}
                  <button onClick={() => handleEdit(estimate)} className="btn-edit">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(estimate.id)} className="btn-delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEstimate ? 'Edit Estimate' : 'New Estimate'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="estimate-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.contact_name} {customer.company_name && `(${customer.company_name})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="HVAC System Installation"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  placeholder="Project details..."
                />
              </div>

              <div className="line-items-section">
                <div className="section-header">
                  <h3>Line Items</h3>
                  <button type="button" onClick={addLineItem} className="btn-secondary btn-sm">
                    + Add Item
                  </button>
                </div>
                {lineItems.map((item, index) => (
                  <div key={index} className="line-item">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="item-description"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      className="item-quantity"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      className="item-price"
                      min="0"
                      step="0.01"
                    />
                    <div className="item-total">
                      ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                    </div>
                    {lineItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeLineItem(index)} 
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="totals-section">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax ({formData.tax_rate}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Terms and conditions..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEstimate ? 'Update Estimate' : 'Create Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estimates;
