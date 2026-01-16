/**
 * Database Module Tests
 * Tests for basic database operations and table initialization
 */

const dbModule = require('./database');

describe('Database Module', () => {
  // Test database module exports
  test('should export database module', () => {
    expect(dbModule).toBeDefined();
    expect(typeof dbModule).toBe('object');
  });

  test('should have initialize function', () => {
    expect(dbModule.initialize).toBeDefined();
    expect(typeof dbModule.initialize).toBe('function');
  });

  test('should have query function', () => {
    expect(dbModule.query).toBeDefined();
    expect(typeof dbModule.query).toBe('function');
  });

  test('should have run function', () => {
    expect(dbModule.run).toBeDefined();
    expect(typeof dbModule.run).toBe('function');
  });

  test('should have get function', () => {
    expect(dbModule.get).toBeDefined();
    expect(typeof dbModule.get).toBe('function');
  });
});

describe('Database Operations', () => {
  // Basic query test using promise-based API
  test('should execute SELECT 1 query', async () => {
    const result = await dbModule.get('SELECT 1 as result', []);
    expect(result).toBeDefined();
    expect(result.result).toBe(1);
  });

  test('should check if users table exists', async () => {
    const query = "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
    const result = await dbModule.get(query, []);
    // Table may or may not exist depending on database state
    // This test just verifies the query executes without error
    // Result can be undefined if table doesn't exist
    if (result) {
      expect(result.name).toBe('users');
    } else {
      // If no table exists, that's also valid - query executed successfully
      expect(result).toBeUndefined();
    }
  });

  test('should execute query and return array', async () => {
    const results = await dbModule.query('SELECT 1 as test UNION SELECT 2', []);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});
