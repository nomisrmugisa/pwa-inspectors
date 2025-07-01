import React from 'react';

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">🏥</div>
        <div className="spinner"></div>
        <h2>Facility Registry Inspections</h2>
        <p>Configuring inspection forms...</p>
      </div>
    </div>
  );
} 