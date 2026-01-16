const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// Get all forms
router.get('/', async (req, res) => {
  try {
    const forms = await db.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(forms.map(form => ({
      ...form,
      fields: JSON.parse(form.fields)
    })));
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get single form
router.get('/:id', async (req, res) => {
  try {
    const form = await db.get('SELECT * FROM forms WHERE id = ?', [req.params.id]);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json({
      ...form,
      fields: JSON.parse(form.fields)
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create form
router.post('/', async (req, res) => {
  try {
    const { title, description, fields, created_by } = req.body;
    const id = uuidv4();

    await db.run(
      'INSERT INTO forms (id, title, description, fields, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, title, description, JSON.stringify(fields), created_by || null]
    );

    res.status(201).json({ id, title, description, fields });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
router.put('/:id', async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    await db.run(
      'UPDATE forms SET title = ?, description = ?, fields = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, JSON.stringify(fields), req.params.id]
    );
    res.json({ id: req.params.id, title, description, fields });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM forms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Submit form
router.post('/:id/submit', async (req, res) => {
  try {
    const { data, signature, submitted_by } = req.body;
    const id = uuidv4();

    await db.run(
      'INSERT INTO form_submissions (id, form_id, data, signature, submitted_by) VALUES (?, ?, ?, ?, ?)',
      [id, req.params.id, JSON.stringify(data), signature || null, submitted_by || null]
    );

    res.status(201).json({ id, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get form submissions
router.get('/:id/submissions', async (req, res) => {
  try {
    const submissions = await db.query(
      'SELECT * FROM form_submissions WHERE form_id = ? ORDER BY submitted_at DESC',
      [req.params.id]
    );
    res.json(submissions.map(sub => ({
      ...sub,
      data: JSON.parse(sub.data)
    })));
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
