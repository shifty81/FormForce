import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PurchaseOrders.css';

function PurchaseOrders({ socket }) {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [formData, setFormData] = useState({
    service_call_id: '',
    vendor_name: '',
    vendor_contact: '',
    vendor_phone: '',
    vendor_email: '',
    notes: ''
  });
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const userType = currentUser?.user_type || 'admin';

  useEffect(() => {
    loadPurchaseOrders();
    loadServiceCalls();

    if (socket) {
      socket.on('purchase-order-changed', () => {
        loadPurchaseOrders();
      });
    }

    return () => {
      if (socket) socket.off('purchase-order-changed');
    };
  }, [socket]);

  const loadPurchaseOrders = async () => {
    try {
      const response = await axios.get('/api/purchaseorders');
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCalls = async () => {
    try {
      const response = await axios.get('/api/servicecalls');
      setServiceCalls(response.data);
    } catch (error) {
      console.error('Error loading service calls:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        line_items: JSON.stringify(lineItems),
        requested_by: currentUser.id
      };

      if (editingPO) {
        await axios.put(`/api/purchaseorders/${editingPO.id}`, dataToSend);
      } else {
        await axios.post('/api/purchaseorders', dataToSend);
      }
      setShowModal(false);
      resetForm();
      loadPurchaseOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Failed to save purchase order');
    }
  };

  const handleEdit = (po) => {
    setEditingPO(po);
    setFormData({
      service_call_id: po.service_call_id || '',
      vendor_name: po.vendor_name,
      vendor_contact: po.vendor_contact || '',
      vendor_phone: po.vendor_phone || '',
      vendor_email: po.vendor_email || '',
      notes: po.notes || ''
    });
    setLineItems(JSON.parse(po.line_items || '[{"description":"","quantity":1,"unit_price":0}]'));
    setShowModal(true);
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this purchase order?')) {
      try {
        await axios.post(`/api/purchaseorders/${id}/approve`, {
          approved_by: currentUser.id
        });
        loadPurchaseOrders();
      } catch (error) {
        console.error('Error approving purchase order:', error);
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this purchase order?')) {
      try {
        await axios.post(`/api/purchaseorders/${id}/reject`);
        loadPurchaseOrders();
      } catch (error) {
        console.error('Error rejecting purchase order:', error);
      }
    }
  };

  const handleReceive = async (id) => {
    if (window.confirm('Mark this purchase order as received?')) {
      try {
        await axios.post(`/api/purchaseorders/${id}/receive`);
        loadPurchaseOrders();
      } catch (error) {
        console.error('Error marking as received:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await axios.delete(`/api/purchaseorders/${id}`);
        loadPurchaseOrders();
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingPO(null);
    setFormData({
      service_call_id: '',
      vendor_name: '',
      vendor_contact: '',
      vendor_phone: '',
      vendor_email: '',
      notes: ''
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      approved: '#28a745',
      rejected: '#dc3545',
      received: '#17a2b8'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading purchase orders...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>📦 Purchase Orders</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Purchase Order
        </button>
      </div>

      <div className="po-grid">
        {purchaseOrders.length === 0 ? (
          <div className="empty-state">
            <p>No purchase orders found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create First Purchase Order
            </button>
          </div>
        ) : (
          purchaseOrders.map(po => (
            <div key={po.id} className="po-card">
              <div className="po-header">
                <div>
                  <h3>{po.po_number}</h3>
                  <p className="vendor-name">{po.vendor_name}</p>
                </div>
                <span className="badge" style={{ backgroundColor: getStatusColor(po.status) }}>
                  {po.status}
                </span>
              </div>

              <div className="po-details">
                {po.service_call_title && (
                  <p><strong>Service Call:</strong> {po.service_call_title}</p>
                )}
                <p><strong>Total:</strong> ${po.total?.toFixed(2)}</p>
                {po.requested_by_name && (
                  <p><strong>Requested by:</strong> {po.requested_by_name}</p>
                )}
                {po.approved_by_name && (
                  <p><strong>Approved by:</strong> {po.approved_by_name}</p>
                )}
                <p><strong>Created:</strong> {new Date(po.created_at).toLocaleDateString()}</p>
              </div>

              <div className="po-actions">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate(`/purchaseorders/${po.id}`)}
                >
                  View Details
                </button>
                
                {po.status === 'draft' && (
                  <>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(po)}
                    >
                      Edit
                    </button>
                    {userType === 'admin' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(po.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(po.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {po.status === 'approved' && (
                  <>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleReceive(po.id)}
                    >
                      Mark Received
                    </button>
                    {userType === 'admin' && (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleReject(po.id)}
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Service Call (Optional)</label>
                  <select
                    className="form-control"
                    value={formData.service_call_id}
                    onChange={(e) => setFormData({...formData, service_call_id: e.target.value})}
                  >
                    <option value="">None</option>
                    {serviceCalls.map(sc => (
                      <option key={sc.id} value={sc.id}>
                        {sc.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vendor Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.vendor_contact}
                    onChange={(e) => setFormData({...formData, vendor_contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.vendor_phone}
                    onChange={(e) => setFormData({...formData, vendor_phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.vendor_email}
                    onChange={(e) => setFormData({...formData, vendor_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="line-items-section">
                <div className="section-header">
                  <h3>Line Items</h3>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addLineItem}>
                    + Add Item
                  </button>
                </div>

                {lineItems.map((item, index) => (
                  <div key={index} className="line-item-row">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-control quantity-input"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-control price-input"
                      placeholder="Unit Price"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      required
                    />
                    <span className="line-total">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeLineItem(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <div className="po-total">
                  <strong>Total: ${calculateTotal().toFixed(2)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPO ? 'Update' : 'Create'} Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrders;
