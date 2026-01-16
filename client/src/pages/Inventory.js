import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventory.css';

function Inventory({ socket }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: '',
    category: '',
    location: ''
  });

  useEffect(() => {
    loadInventory();

    if (socket) {
      socket.on('inventory-changed', () => {
        loadInventory();
      });
    }

    return () => {
      if (socket) socket.off('inventory-changed');
    };
  }, [socket]);

  const loadInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/inventory', formData);
      }
      setShowModal(false);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category || '',
      location: item.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        loadInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const adjustQuantity = async (id, adjustment) => {
    try {
      await axios.patch(`/api/inventory/${id}/quantity`, { adjustment });
      loadInventory();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      unit: '',
      category: '',
      location: ''
    });
    setEditingItem(null);
  };

  const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(item => item.quantity < 10).length;

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="inventory-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📦 Inventory Management</h1>
            <p>Real-time inventory tracking and management</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Item
          </button>
        </div>

        <div className="inventory-stats">
          <div className="stat-box">
            <div className="stat-value">{inventory.length}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalItems}</div>
            <div className="stat-label">Total Quantity</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: lowStockItems > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
              {lowStockItems}
            </div>
            <div className="stat-label">Low Stock Items</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="form-control"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 2 }}
          />
          <select
            className="form-control"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Description</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: '2rem' }}>
                    {searchTerm || filterCategory !== 'all' 
                      ? 'No items match your search.' 
                      : 'No inventory items yet. Add your first item!'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => (
                  <tr key={item.id} className={item.quantity < 10 ? 'low-stock' : ''}>
                    <td className="item-name">{item.name}</td>
                    <td className="item-description">{item.description || '-'}</td>
                    <td>
                      {item.category && (
                        <span className="category-badge">{item.category}</span>
                      )}
                    </td>
                    <td>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => adjustQuantity(item.id, -1)}
                          disabled={item.quantity <= 0}
                        >
                          -
                        </button>
                        <span className="quantity-value">
                          {item.quantity} {item.unit}
                        </span>
                        <button 
                          className="quantity-btn"
                          onClick={() => adjustQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingItem ? 'Edit Item' : 'New Item'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., pcs, kg, liters"
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Tools, Materials"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Warehouse A"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
