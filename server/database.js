const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../formforce.db');
const db = new sqlite3.Database(dbPath);

const initialize = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Forms table
      db.run(`
        CREATE TABLE IF NOT EXISTS forms (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          fields TEXT NOT NULL,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Form submissions table
      db.run(`
        CREATE TABLE IF NOT EXISTS form_submissions (
          id TEXT PRIMARY KEY,
          form_id TEXT NOT NULL,
          data TEXT NOT NULL,
          signature TEXT,
          submitted_by TEXT,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (form_id) REFERENCES forms(id),
          FOREIGN KEY (submitted_by) REFERENCES users(id)
        )
      `);

      // Dispatch table
      db.run(`
        CREATE TABLE IF NOT EXISTS dispatches (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          address TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          assigned_to TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'normal',
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        )
      `);

      // Inventory table
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          quantity INTEGER DEFAULT 0,
          unit TEXT,
          category TEXT,
          location TEXT,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT,
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `);

      // Customers table (CRM)
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          company_name TEXT,
          contact_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Estimates table
      db.run(`
        CREATE TABLE IF NOT EXISTS estimates (
          id TEXT PRIMARY KEY,
          estimate_number TEXT UNIQUE NOT NULL,
          customer_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'draft',
          subtotal REAL DEFAULT 0,
          tax_rate REAL DEFAULT 0,
          tax_amount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          valid_until DATE,
          line_items TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Invoices table
      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          invoice_number TEXT UNIQUE NOT NULL,
          customer_id TEXT NOT NULL,
          estimate_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'draft',
          subtotal REAL DEFAULT 0,
          tax_rate REAL DEFAULT 0,
          tax_amount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          amount_paid REAL DEFAULT 0,
          due_date DATE,
          line_items TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          paid_at DATETIME,
          created_by TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (estimate_id) REFERENCES estimates(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = {
  initialize,
  query,
  run,
  get,
  db
};
