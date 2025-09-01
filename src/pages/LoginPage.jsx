import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';

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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-header">
            <div className="app-logo">
              <LocalHospitalIcon style={{ fontSize: '48px', color: '#0369a1' }} />
            </div>
            <h1>Inspections</h1>
            <p>Mobile data capture for facility inspections</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="serverUrl">QIMS Server URL</label>
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
                'Login & Configure'
              )}
            </button>
          </form>
          
          {error && (
            <div className="error-message">
              <CheckCircleIcon style={{ fontSize: '16px', marginRight: '8px' }} />
              {error}
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p>
            <LocalHospitalIcon style={{ fontSize: '16px', marginRight: '8px', verticalAlign: 'middle' }} />
            Built for QIMS program
          </p>
          <p>
            <AssignmentIcon style={{ fontSize: '16px', marginRight: '8px', verticalAlign: 'middle' }} />
            Automated inspection data collection
          </p>
          <p>
            <SignalCellularConnectedNoInternet0BarIcon style={{ fontSize: '16px', marginRight: '8px', verticalAlign: 'middle' }} />
            Works offline with automatic sync
          </p>
        </div>
      </div>
    </div>
  );
} 