import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, Leaf, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import './Login.css'; // Reuse authentication styles

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signup(name, email, password, role);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-background-blobs">
        <div className="blob green-blob"></div>
        <div className="blob yellow-blob"></div>
      </div>
      
      <div className="auth-card glass-panel">
        <div className="auth-brand">
          <div className="brand-logo-wrapper">
            <Leaf className="brand-logo-icon" size={32} />
          </div>
          <h1>CROPIC</h1>
          <p>Real-Time Crop Image Analytics</p>
        </div>

        {success ? (
          <div className="auth-success-screen" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(82, 183, 136, 0.15)', color: '#52b788', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className="auth-title">Registration Successful!</h2>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
              Your account has been created. Redirecting to Login...
            </p>
            <Link to="/login" className="btn btn-auth" style={{ textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Sign up for crop analytics and claim tracking</p>

            {error && (
              <div className="auth-error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-input-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={18} />
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="e.g. ramesh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="role">Select Your Role</label>
                <div className="input-with-icon">
                  <Shield className="input-icon" size={18} />
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="farmer">Farmer (किसान)</option>
                    <option value="officer">Insurance Officer (बीमा अधिकारी)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-auth" disabled={loading}>
                {loading ? (
                  <>
                    <div className="auth-spinner"></div> Registering...
                  </>
                ) : (
                  <>
                    Sign Up <UserPlus size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Signup;
