/**
 * Database Module Tests
 * Tests for basic database operations and table initialization
 */

const db = require('./database');

describe('Database Module', () => {
  // Test database initialization
  test('should export database object', () => {
    expect(db).toBeDefined();
    expect(typeof db).toBe('object');
  });

  test('should have run method', () => {
    expect(db.run).toBeDefined();
    expect(typeof db.run).toBe('function');
  });

  test('should have get method', () => {
    expect(db.get).toBeDefined();
    expect(typeof db.get).toBe('function');
  });

  test('should have all method', () => {
    expect(db.all).toBeDefined();
    expect(typeof db.all).toBe('function');
  });
});

describe('Database Operations', () => {
  // Basic query test
  test('should execute SELECT 1 query', (done) => {
    db.get('SELECT 1 as result', [], (err, row) => {
      expect(err).toBeNull();
      expect(row).toBeDefined();
      expect(row.result).toBe(1);
      done();
    });
  });

  test('should check if users table exists', (done) => {
    const query = "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
    db.get(query, [], (err, row) => {
      expect(err).toBeNull();
      if (row) {
        expect(row.name).toBe('users');
      }
      done();
    });
  });
});
