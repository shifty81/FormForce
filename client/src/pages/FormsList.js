import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function FormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await axios.get('/api/forms');
      setForms(response.data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await axios.delete(`/api/forms/${id}`);
        setForms(forms.filter(f => f.id !== id));
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Failed to delete form');
      }
    }
  };

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Forms</h1>
        <Link to="/forms/new" className="btn btn-primary">+ Create Form</Link>
      </div>

      <div className="form-group">
        <input
          type="text"
          className="form-control"
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredForms.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            {searchTerm ? 'No forms found matching your search.' : 'No forms yet. Create your first form!'}
          </p>
          {!searchTerm && (
            <Link to="/forms/new" className="btn btn-primary" style={{ marginTop: '1rem', maxWidth: '200px', margin: '1rem auto 0' }}>
              Create Form
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          {filteredForms.map(form => (
            <div key={form.id} className="card">
              <div className="card-header">{form.title}</div>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                {form.description || 'No description'}
              </p>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>
                {form.fields?.length || 0} fields • Created {new Date(form.created_at).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link to={`/forms/${form.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                  View
                </Link>
                <Link to={`/forms/${form.id}/edit`} className="btn btn-secondary" style={{ flex: 1 }}>
                  Edit
                </Link>
                <button 
                  onClick={() => handleDelete(form.id)}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormsList;
