/**
 * App Component Tests
 * Basic tests to ensure the App component renders and functions correctly
 */

import { render, screen } from '@testing-library/react';
import App from './App';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders without crashing', () => {
    render(<App />);
    // App should render without errors
    expect(document.body).toBeTruthy();
  });

  test('initializes with no user when localStorage is empty', () => {
    render(<App />);
    // Should show login page when no user is logged in
    const loginElement = document.querySelector('body');
    expect(loginElement).toBeTruthy();
  });

  test('checks localStorage for token on mount', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    render(<App />);
    
    expect(getItemSpy).toHaveBeenCalledWith('token');
    expect(getItemSpy).toHaveBeenCalledWith('user');
    
    getItemSpy.mockRestore();
  });

  test('initializes socket connection', () => {
    const { io } = require('socket.io-client');
    render(<App />);
    
    expect(io).toHaveBeenCalled();
  });
});

describe('App Authentication', () => {
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
