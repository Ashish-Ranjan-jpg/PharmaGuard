import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiHome,
  FiActivity,
  FiClock,
  FiSun,
  FiMoon,
  FiCloud,
} from "react-icons/fi";
import "./Navbar.css";

const THEME_ICONS = {
  light: <FiSun />,
  dark: <FiMoon />,
  grey: <FiCloud />,
};

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-text">
            Pharma<span className="brand-highlight">Guard</span>
          </span>
        </Link>

        <div className="navbar-right-mobile">
          <button
            className="theme-toggle"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
          >
            {THEME_ICONS[theme]}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiHome /> Dashboard
              </Link>
              <Link
                to="/analyze"
                className={`nav-link ${isActive("/analyze") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiActivity /> Analyze
              </Link>
              <Link
                to="/history"
                className={`nav-link ${isActive("/history") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiClock /> History
              </Link>
              <Link
                to="/profile"
                className={`nav-link mobile-only ${isActive("/profile") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiUser /> Profile
              </Link>

              <div className="navbar-separator"></div>

              <button
                className="theme-toggle desktop-only"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {THEME_ICONS[theme]}
              </button>

              <Link
                to="/profile"
                className="nav-user"
                onClick={() => setMenuOpen(false)}
              >
                <div className="user-avatar">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="avatar" />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <span className="user-name">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="theme-toggle desktop-only"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {THEME_ICONS[theme]}
              </button>
              <Link
                to="/login"
                className={`nav-link ${isActive("/login") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="nav-link btn-signup"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
