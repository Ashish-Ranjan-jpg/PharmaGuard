import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiSend, FiShield } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error) {
      const msg =
        error.code === "auth/user-not-found"
          ? "No account found with this email"
          : "Failed to send reset email. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Toaster position="top-center" />
      <div className="auth-card">
        <div className="auth-header">
          <FiShield className="auth-icon" />
          <h1>Reset Password</h1>
          <p>
            {sent
              ? "Check your inbox for the reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent ? (
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
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <FiSend /> Send Reset Link
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="auth-success">
            <div className="success-icon">✉️</div>
            <p>
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your email and follow the instructions.
            </p>
          </div>
        )}

        <p className="auth-footer">
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
