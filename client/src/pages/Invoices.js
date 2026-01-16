import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Invoices.css';

function Invoices({ socket }) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    status: 'draft',
    tax_rate: 8.5,
    due_date: '',
    notes: ''
  });
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    loadInvoices();
    loadCustomers();

    if (socket) {
      socket.on('invoice:created', (invoice) => {
        setInvoices(prev => [invoice, ...prev]);
      });
      socket.on('invoice:updated', (invoice) => {
        setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
      });
      socket.on('invoice:deleted', (id) => {
        setInvoices(prev => prev.filter(i => i.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('invoice:created');
        socket.off('invoice:updated');
        socket.off('invoice:deleted');
      }
    };
  }, [socket]);

  const loadInvoices = async () => {
    try {
      const response = await axios.get('/api/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
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

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || !invoice.due_date) return false;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return today > dueDate;
  };

  const getInvoiceStatus = (invoice) => {
    if (isOverdue(invoice)) return 'overdue';
    return invoice.status;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        line_items: JSON.stringify(lineItems)
      };

      if (editingInvoice) {
        await axios.put(`/api/invoices/${editingInvoice.id}`, data);
      } else {
        await axios.post('/api/invoices', data);
      }
      setShowModal(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customer_id: invoice.customer_id,
      title: invoice.title,
      description: invoice.description || '',
      status: invoice.status,
      tax_rate: invoice.tax_rate,
      due_date: invoice.due_date || '',
      notes: invoice.notes || ''
    });
    setLineItems(JSON.parse(invoice.line_items || '[{"description":"","quantity":1,"unit_price":0}]'));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`/api/invoices/${id}`);
        loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleRecordPayment = (invoice) => {
    setPaymentInvoice(invoice);
    const remainingAmount = invoice.total - (invoice.amount_paid || 0);
    setPaymentAmount(remainingAmount.toFixed(2));
    setShowPaymentModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      await axios.post(`/api/invoices/${paymentInvoice.id}/payment`, {
        amount: amount
      });

      setShowPaymentModal(false);
      setPaymentInvoice(null);
      setPaymentAmount('');
      loadInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      title: '',
      description: '',
      status: 'draft',
      tax_rate: 8.5,
      due_date: '',
      notes: ''
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setEditingInvoice(null);
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.contact_name && invoice.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const invoiceStatus = getInvoiceStatus(invoice);
    const matchesStatus = filterStatus === 'all' || invoiceStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    partial: invoices.filter(i => i.status === 'partial').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalRevenue: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0)
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div className="header-content">
          <h1>💰 Invoices</h1>
          <p>Create and manage customer invoices</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Invoice
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.partial}</div>
          <div className="stat-label">Partial</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid</div>
        </div>
        <div className="stat-card stat-revenue">
          <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="filter-section">
        <input
          type="text"
          placeholder="🔍 Search invoices..."
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
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="invoices-list">
        {filteredInvoices.length === 0 ? (
          <div className="no-invoices">
            <p>No invoices found. Create your first invoice!</p>
          </div>
        ) : (
          filteredInvoices.map(invoice => {
            const displayStatus = getInvoiceStatus(invoice);
            return (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <h3>{invoice.invoice_number}</h3>
                    <div className="invoice-title">{invoice.title}</div>
                    <div className="customer-info">
                      👤 {invoice.contact_name}
                      {invoice.company_name && ` - ${invoice.company_name}`}
                    </div>
                  </div>
                  <div className="invoice-amount">
                    <div className="amount">${invoice.total?.toFixed(2)}</div>
                    <span className={`status-badge status-${displayStatus}`}>
                      {displayStatus}
                    </span>
                  </div>
                </div>
                
                {invoice.status !== 'paid' && invoice.status !== 'draft' && (
                  <div className="payment-tracking">
                    <div className="payment-info">
                      <span>Paid: ${(invoice.amount_paid || 0).toFixed(2)}</span>
                      <span>Balance: ${(invoice.total - (invoice.amount_paid || 0)).toFixed(2)}</span>
                    </div>
                    <div className="payment-progress">
                      <div 
                        className="payment-progress-bar"
                        style={{ width: `${((invoice.amount_paid || 0) / invoice.total * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="invoice-footer">
                  <div className="invoice-meta">
                    <span>Created: {new Date(invoice.created_at).toLocaleDateString()}</span>
                    {invoice.due_date && (
                      <span className={isOverdue(invoice) ? 'overdue-text' : ''}>
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="invoice-actions">
                    {invoice.status !== 'paid' && invoice.status !== 'draft' && (
                      <button 
                        onClick={() => handleRecordPayment(invoice)} 
                        className="btn-payment"
                        title="Record Payment"
                      >
                        💳 Payment
                      </button>
                    )}
                    <button onClick={() => handleEdit(invoice)} className="btn-edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(invoice.id)} className="btn-delete">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="invoice-form">
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
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
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
                  placeholder="Service details..."
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
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Payment terms and conditions..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && paymentInvoice && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); setPaymentInvoice(null); setPaymentAmount(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="modal-close" onClick={() => { setShowPaymentModal(false); setPaymentInvoice(null); setPaymentAmount(''); }}>
                ✕
              </button>
            </div>
            <form onSubmit={submitPayment} className="payment-form">
              <div className="payment-summary">
                <h3>{paymentInvoice.invoice_number}</h3>
                <p className="payment-detail">Total: ${paymentInvoice.total?.toFixed(2)}</p>
                <p className="payment-detail">Paid: ${(paymentInvoice.amount_paid || 0).toFixed(2)}</p>
                <p className="payment-detail balance">Balance Due: ${(paymentInvoice.total - (paymentInvoice.amount_paid || 0)).toFixed(2)}</p>
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowPaymentModal(false); setPaymentInvoice(null); setPaymentAmount(''); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
