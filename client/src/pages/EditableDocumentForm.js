import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SignaturePad from 'signature_pad';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './EditableDocumentForm.css';

function EditableDocumentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [documentDimensions, setDocumentDimensions] = useState({ width: 0, height: 0 });
  const signaturePadRef = useRef(null);
  const canvasRef = useRef(null);
  const documentRef = useRef(null);
  const documentContainerRef = useRef(null);

  useEffect(() => {
    loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`);
      setForm(response.data);
      
      // Initialize form data
      const initialData = {};
      response.data.fields.forEach(field => {
        initialData[field.id] = field.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading form:', error);
      alert('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (form && documentRef.current) {
      // Get document dimensions once loaded
      const img = documentRef.current;
      const updateDimensions = () => {
        setDocumentDimensions({
          width: img.offsetWidth,
          height: img.offsetHeight
        });
      };
      
      if (img.complete) {
        updateDimensions();
      } else {
        img.addEventListener('load', updateDimensions);
        return () => img.removeEventListener('load', updateDimensions);
      }
    }
  }, [form]);

  useEffect(() => {
    // Initialize signature pad for signature fields
    if (form && canvasRef.current && !signaturePadRef.current) {
      const signatureFields = form.fields.filter(f => f.type === 'signature');
      if (signatureFields.length > 0) {
        signaturePadRef.current = new SignaturePad(canvasRef.current);
      }
    }
  }, [form]);

  const handleFieldChange = (fieldId, value) => {
    setFormData({
      ...formData,
      [fieldId]: value
    });
  };

  const handleFieldClick = (field) => {
    if (field.type !== 'signature') {
      setEditingField(field.id);
    }
  };

  const handleFieldBlur = () => {
    setEditingField(null);
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const getSignatureData = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      return signaturePadRef.current.toDataURL();
    }
    return null;
  };

  const calculateFieldPosition = (fieldPosition) => {
    if (!documentDimensions.width || !documentDimensions.height) {
      return { top: 0, left: 0, width: '100%', height: '40px' };
    }

    // Convert percentage-based positions to pixels
    return {
      top: `${fieldPosition.y}%`,
      left: `${fieldPosition.x}%`,
      width: `${fieldPosition.width}%`,
      height: `${fieldPosition.height}px`
    };
  };

  const downloadFilledForm = async () => {
    try {
      setSubmitting(true);
      
      // Capture the filled form as an image
      const element = documentContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${form.title}-filled-${Date.now()}.pdf`);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error downloading form:', error);
      alert('Failed to download form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n${missingFields.join('\n')}`);
      return;
    }

    // Check for signature
    const hasSignatureField = form.fields.some(f => f.type === 'signature');
    let signatureData = null;
    if (hasSignatureField) {
      signatureData = getSignatureData();
      if (!signatureData) {
        alert('Please provide your signature');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Submit the form data
      await axios.post(`/api/forms/${id}/submit`, {
        data: formData,
        signature: signatureData
      });

      // Download the filled copy
      await downloadFilledForm();

      alert('Form submitted successfully! A copy has been downloaded to your device.');
      navigate('/forms');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
      setSubmitting(false);
    }
  };

  const renderFieldInput = (field) => {
    const value = formData[field.id] || '';
    const isEditing = editingField === field.id;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={isEditing ? field.label : ''}
            className="field-input"
            autoFocus={isEditing}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={isEditing ? field.label : ''}
            className="field-input"
            autoFocus={isEditing}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            className="field-input"
            autoFocus={isEditing}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={isEditing ? field.label : ''}
            className="field-input field-textarea"
            autoFocus={isEditing}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            className="field-input"
            autoFocus={isEditing}
          >
            <option value="">Select...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
            className="field-checkbox"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={isEditing ? field.label : ''}
            className="field-input"
            autoFocus={isEditing}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="editable-document-page">
        <div className="container">
          <div className="loading">Loading form...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="editable-document-page">
        <div className="container">
          <div className="alert alert-error">Form not found</div>
        </div>
      </div>
    );
  }

  const hasDocument = form.uploaded_file_path;
  const fieldPositions = form.field_positions || [];

  return (
    <div className="editable-document-page">
      <div className="container">
        <div className="page-header">
          <h1>📝 {form.title}</h1>
          <p>{form.description}</p>
        </div>

        {showSuccess && (
          <div className="alert alert-success">
            ✓ Form downloaded successfully! The blank form is retained for future use.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {hasDocument ? (
            <div className="document-editor-container">
              <div className="document-wrapper" ref={documentContainerRef}>
                <img 
                  ref={documentRef}
                  src={form.uploaded_file_path} 
                  alt="Form Document" 
                  className="document-image"
                />
                
                <div className="fields-overlay">
                  {form.fields.map((field, index) => {
                    const position = fieldPositions.find(p => p.fieldId === field.id);
                    if (!position || field.type === 'signature') return null;

                    return (
                      <div
                        key={field.id}
                        className={`field-overlay ${editingField === field.id ? 'editing' : ''}`}
                        style={calculateFieldPosition(position)}
                        onClick={() => handleFieldClick(field)}
                      >
                        <div className="field-label-hint">{field.label}</div>
                        {renderFieldInput(field)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signature section below document */}
              {form.fields.some(f => f.type === 'signature') && (
                <div className="signature-section">
                  <h3>✍️ Signature (UETA/ESIGN Compliant)</h3>
                  <div className="signature-pad-container">
                    <canvas 
                      ref={canvasRef} 
                      className="signature-canvas"
                      width="500"
                      height="150"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={clearSignature} 
                    className="btn btn-secondary"
                  >
                    Clear Signature
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="standard-form">
              {form.fields.map(field => (
                <div key={field.id} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  
                  {field.type === 'signature' ? (
                    <div className="signature-pad-container">
                      <canvas 
                        ref={canvasRef} 
                        className="signature-canvas"
                        width="500"
                        height="150"
                      />
                      <button 
                        type="button" 
                        onClick={clearSignature} 
                        className="btn btn-secondary btn-sm"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    renderFieldInput(field)
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/forms')} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={downloadFilledForm}
              className="btn btn-outline"
              disabled={submitting}
            >
              💾 Download Copy Only
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '✓ Submit & Download'}
            </button>
          </div>
        </form>

        <div className="info-note">
          <strong>ℹ️ Note:</strong> When you submit this form, a filled copy will be downloaded to your device. 
          The original blank form will be retained for future use.
        </div>
      </div>
    </div>
  );
}

export default EditableDocumentForm;
