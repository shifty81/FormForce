import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FormBuilder.css';

function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'tel', label: 'Phone', icon: '📱' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'time', label: 'Time', icon: '🕐' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'select', label: 'Dropdown', icon: '▼' },
    { value: 'radio', label: 'Radio Buttons', icon: '⭕' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'signature', label: 'Signature (UETA)', icon: '✍️' },
    { value: 'gps', label: 'GPS Location', icon: '📍' },
    { value: 'photo', label: 'Photo Capture', icon: '📷' },
    { value: 'barcode', label: 'Barcode Scanner', icon: '🔲' },
    { value: 'calculation', label: 'Auto-Calculate', icon: '🧮' }
  ];

  useEffect(() => {
    if (id) {
      loadForm();
    }
  }, [id]);

  const loadForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`);
      setTitle(response.data.title);
      setDescription(response.data.description || '');
      setFields(response.data.fields || []);
    } catch (error) {
      console.error('Error loading form:', error);
      alert('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const addField = (type) => {
    const newField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
      validation: {},
      conditionalLogic: null
    };
    setFields([...fields, newField]);
  };

  const updateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (fromIndex, toIndex) => {
    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }

    setSaving(true);
    try {
      const formData = { title, description, fields };
      
      if (id) {
        await axios.put(`/api/forms/${id}`, formData);
      } else {
        await axios.post('/api/forms', formData);
      }
      
      navigate('/forms');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="form-builder">
      <div className="container">
        <div className="builder-header">
          <h1>{id ? 'Edit Form' : 'Create New Form'}</h1>
          <div className="builder-actions">
            <button onClick={() => navigate('/forms')} className="btn btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        <div className="builder-content">
          <div className="builder-main">
            <div className="card">
              <div className="form-group">
                <label className="form-label">Form Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter form description (optional)"
                  rows="3"
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">Form Fields</div>
              
              {fields.length === 0 ? (
                <div className="empty-state">
                  <p>No fields yet. Add fields from the sidebar →</p>
                </div>
              ) : (
                <div className="fields-list">
                  {fields.map((field, index) => (
                    <div key={field.id} className="field-item">
                      <div className="field-header">
                        <span className="field-type-badge">{field.type}</span>
                        <button 
                          className="btn-icon"
                          onClick={() => removeField(index)}
                          title="Remove field"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                        />
                      </div>

                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="form-group">
                          <label className="form-label">Options (one per line)</label>
                          <textarea
                            className="form-control"
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(index, { 
                              options: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            rows="3"
                          />
                        </div>
                      )}

                      <div className="field-options">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="builder-sidebar">
            <div className="card sticky-card">
              <div className="card-header">Add Fields</div>
              <div className="field-types-grid">
                {fieldTypes.map(type => (
                  <button
                    key={type.value}
                    className="field-type-button"
                    onClick={() => addField(type.value)}
                    title={type.label}
                  >
                    <span className="field-type-icon">{type.icon}</span>
                    <span className="field-type-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card sticky-card" style={{ marginTop: '1rem' }}>
              <div className="card-header">Features</div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
                <li style={{ padding: '0.5rem 0' }}>✅ Drag & drop reordering</li>
                <li style={{ padding: '0.5rem 0' }}>✅ Conditional logic</li>
                <li style={{ padding: '0.5rem 0' }}>✅ Field validation</li>
                <li style={{ padding: '0.5rem 0' }}>✅ Auto-calculations</li>
                <li style={{ padding: '0.5rem 0' }}>✅ UETA signatures</li>
                <li style={{ padding: '0.5rem 0' }}>✅ GPS & media capture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBuilder;
