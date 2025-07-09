import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

export function LoginPage() {
  const { login, loading, error } = useApp();
  const [formData, setFormData] = useState({
    serverUrl: 'https://qimsdev.5am.co.bw/qims', // QIMS development server
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.serverUrl.trim()) {
      errors.serverUrl = 'Server URL is required';
    } else {
      try {
        new URL(formData.serverUrl);
      } catch {
        errors.serverUrl = 'Please enter a valid URL';
      }
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.serverUrl, formData.username, formData.password);
    } catch (error) {
      // Error is handled by the context and displayed via toast
      console.error('Login failed:', error);
    }
  };

  const fillQimsCredentials = () => {
    setFormData({
      serverUrl: 'https://qimsdev.5am.co.bw/qims',
      username: 'admin',
      password: 'district'
    });
    setFormErrors({});
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-header">
            <div className="app-logo">🏥</div>
            <h1>Inspections</h1>
            <p>Mobile data capture for facility inspections</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="serverUrl">DHIS2 Server URL</label>
              <input 
                type="url" 
                id="serverUrl" 
                name="serverUrl"
                value={formData.serverUrl}
                onChange={handleInputChange}
                placeholder="https://your-dhis2-server.com" 
                required
                className={formErrors.serverUrl ? 'error' : ''}
              />
              {formErrors.serverUrl && (
                <div className="field-error">{formErrors.serverUrl}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username" 
                required
                className={formErrors.username ? 'error' : ''}
              />
              {formErrors.username && (
                <div className="field-error">{formErrors.username}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password" 
                required
                className={formErrors.password ? 'error' : ''}
              />
              {formErrors.password && (
                <div className="field-error">{formErrors.password}</div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Configuring inspections...
                </>
              ) : (
                <>
                  🚀 Login & Configure
                </>
              )}
            </button>
          </form>
          
          <div className="demo-section">
            <p className="demo-text">Use QIMS server:</p>
            <button 
              type="button"
              className="btn btn-secondary btn-small"
              onClick={fillQimsCredentials}
            >
              📝 Use QIMS Credentials
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p>🏥 Built for QIMS program</p>
          <p>📋 Automated inspection data collection</p>
          <p>📴 Works offline with automatic sync</p>
        </div>
      </div>
    </div>
  );
} 