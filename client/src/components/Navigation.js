import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-logo">📋</span>
          FormForce
        </Link>
        
        <button 
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/forms" className="nav-link" onClick={() => setMenuOpen(false)}>
            Forms
          </Link>
          <Link to="/ai-upload" className="nav-link" onClick={() => setMenuOpen(false)}>
            AI Upload
          </Link>
          <Link to="/dispatch" className="nav-link" onClick={() => setMenuOpen(false)}>
            Dispatch
          </Link>
          <Link to="/inventory" className="nav-link" onClick={() => setMenuOpen(false)}>
            Inventory
          </Link>
          <Link to="/customers" className="nav-link" onClick={() => setMenuOpen(false)}>
            Customers
          </Link>
          <Link to="/estimates" className="nav-link" onClick={() => setMenuOpen(false)}>
            Estimates
          </Link>
          <Link to="/invoices" className="nav-link" onClick={() => setMenuOpen(false)}>
            Invoices
          </Link>
          <Link to="/timetracking" className="nav-link" onClick={() => setMenuOpen(false)}>
            Time Tracking
          </Link>
          <Link to="/reports" className="nav-link" onClick={() => setMenuOpen(false)}>
            Reports
          </Link>
          
          <div className="nav-user">
            <span className="user-name">{user?.username || 'User'}</span>
            <button className="btn btn-sm btn-outline" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
