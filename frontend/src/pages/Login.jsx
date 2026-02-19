import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiDna1 } from 'react-icons/gi';
import toast, { Toaster } from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : error.code === 'auth/user-not-found' ? 'No account found with this email'
        : error.code === 'auth/too-many-requests' ? 'Too many attempts. Please try later.'
        : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Google sign-in failed');
    }
  }

  return (
    <div className="auth-page">
      <Toaster position="top-center" />
      <div className="auth-card">
        <div className="auth-header">
          <GiDna1 className="auth-icon" />
          <h1>Welcome Back</h1>
          <p>Sign in to your PharmaGuard account</p>
        </div>

        <button className="btn-google" onClick={handleGoogle}>
          <FcGoogle /> Continue with Google
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="spinner"></span> : <><FiLogIn /> Sign In</>}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
