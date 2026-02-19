import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiDna1 } from 'react-icons/gi';
import toast, { Toaster } from 'react-hot-toast';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.code === 'auth/email-already-in-use' ? 'Email is already registered'
        : error.code === 'auth/weak-password' ? 'Password is too weak'
        : 'Sign up failed. Please try again.';
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
          <h1>Create Account</h1>
          <p>Start your pharmacogenomic journey</p>
        </div>

        <button className="btn-google" onClick={handleGoogle}>
          <FcGoogle /> Continue with Google
        </button>

        <div className="auth-divider">
          <span>or sign up with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FiUser className="input-icon" />
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="spinner"></span> : <><FiUserPlus /> Create Account</>}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
