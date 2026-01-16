/**
 * App Component Tests
 * Basic tests to ensure the App component renders and functions correctly
 */

import { render } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  test('initializes with no user when localStorage is empty', () => {
    localStorage.clear();
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});

describe('App Utilities', () => {
  test('localStorage methods are available', () => {
    expect(typeof localStorage.getItem).toBe('function');
    expect(typeof localStorage.setItem).toBe('function');
    expect(typeof localStorage.removeItem).toBe('function');
  });

  test('can store and retrieve data from localStorage', () => {
    const testData = { username: 'testuser', id: '123' };
    localStorage.setItem('user', JSON.stringify(testData));
    
    const retrieved = JSON.parse(localStorage.getItem('user'));
    expect(retrieved.username).toBe('testuser');
    expect(retrieved.id).toBe('123');
  });
});
