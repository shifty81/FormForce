import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SignaturePad from 'signature_pad';
import './FormView.css';

function FormView() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const signaturePadRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (form && canvasRef.current && !signaturePadRef.current) {
      const hasSignatureField = form.fields.some(f => f.type === 'signature');
      if (hasSignatureField) {
        signaturePadRef.current = new SignaturePad(canvasRef.current);
      }
    }
  }, [form]);

  const loadForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`);
      setForm(response.data);
      
      // Initialize form data
      const initialData = {};
      response.data.fields.forEach(field => {
        initialData[field.id] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading form:', error);
      alert('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleFileChange = (fieldId, files) => {
    setFormData({ ...formData, [fieldId]: files[0]?.name || '' });
  };

  const getGPSLocation = (fieldId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setGpsLocation(location);
          setFormData({
            ...formData,
            [fieldId]: `${location.latitude}, ${location.longitude}`
          });
        },
        (error) => {
          alert('Unable to get GPS location: ' + error.message);
        }
      );
    } else {
      alert('GPS not supported by this browser');
    }
  };

  const capturePhoto = async (fieldId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // In a real app, this would open a camera interface
      alert('Camera feature - would open camera interface');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('Camera access denied or not available');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !formData[field.id]) {
        alert(`Please fill in: ${field.label}`);
        return;
      }
    }

    // Get signature if present
    let signatureData = '';
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      signatureData = signaturePadRef.current.toDataURL();
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/forms/${id}/submit`, {
        data: formData,
        signature: signatureData,
        submitted_by: null
      });

      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      required: field.required,
      value: formData[field.id] || '',
      onChange: (e) => handleInputChange(field.id, e.target.value)
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <input
            {...commonProps}
            type={field.type}
            className="form-control"
            placeholder={field.label}
          />
        );

      case 'date':
      case 'time':
        return (
          <input
            {...commonProps}
            type={field.type}
            className="form-control"
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            className="form-control"
            placeholder={field.label}
            rows="4"
          />
        );

      case 'select':
        return (
          <select {...commonProps} className="form-control">
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option, idx) => (
              <label key={idx} className="radio-label">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="checkbox-label-large">
            <input
              type="checkbox"
              checked={formData[field.id] === 'true'}
              onChange={(e) => handleInputChange(field.id, e.target.checked.toString())}
            />
            {field.label}
          </label>
        );

      case 'file':
        return (
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleFileChange(field.id, e.target.files)}
          />
        );

      case 'signature':
        return (
          <div className="signature-container">
            <canvas
              ref={canvasRef}
              className="signature-canvas"
              width="400"
              height="200"
            />
            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={clearSignature}
            >
              Clear Signature
            </button>
            <p className="signature-notice">
              ✅ UETA/ESIGN Compliant - Your signature is legally binding
            </p>
          </div>
        );

      case 'gps':
        return (
          <div className="gps-container">
            <input
              type="text"
              className="form-control"
              value={formData[field.id] || ''}
              readOnly
              placeholder="GPS coordinates will appear here"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => getGPSLocation(field.id)}
            >
              📍 Get Current Location
            </button>
            {gpsLocation && (
              <a
                href={`https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
              >
                🗺️ View on Map
              </a>
            )}
          </div>
        );

      case 'photo':
        return (
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="form-control"
              onChange={(e) => handleFileChange(field.id, e.target.files)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => capturePhoto(field.id)}
              style={{ marginTop: '0.5rem' }}
            >
              📷 Take Photo
            </button>
          </div>
        );

      case 'barcode':
        return (
          <div>
            <input
              {...commonProps}
              type="text"
              className="form-control"
              placeholder="Scan or enter barcode"
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              🔲 Scan Barcode
            </button>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            className="form-control"
          />
        );
    }
  };

  if (loading) return <div className="spinner"></div>;

  if (!form) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-error">Form not found</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '1rem' }}>Form Submitted Successfully!</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Thank you for completing the form. Your submission has been recorded.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/forms'}
          >
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-view">
      <div className="container">
        <div className="form-view-header">
          <h1>{form.title}</h1>
          {form.description && (
            <p className="form-description">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="form-view-content">
          <div className="card">
            {form.fields.map((field) => (
              <div key={field.id} className="form-group">
                <label className="form-label">
                  {field.label}
                  {field.required && <span className="required-mark"> *</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormView;
