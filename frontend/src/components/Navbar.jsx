import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser, FiHome, FiActivity, FiClock, FiShield } from 'react-icons/fi';
import { GiDna1 } from 'react-icons/gi';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <GiDna1 className="brand-icon" />
          <span className="brand-text">Pharma<span className="brand-highlight">Guard</span></span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          {currentUser ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                <FiHome /> Dashboard
              </Link>
              <Link to="/analyze" className={`nav-link ${isActive('/analyze') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                <FiActivity /> Analyze
              </Link>
              <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                <FiClock /> History
              </Link>
              <div className="nav-user">
                <div className="user-avatar">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="avatar" />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <span className="user-name">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                <button className="btn-logout" onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="nav-link btn-signup" onClick={() => setMenuOpen(false)}>
                <FiShield /> Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
