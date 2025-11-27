/**
 * Restore Progress Bar Banner Component
 * Shows a button to restore departments when loading existing events
 */

import React from 'react';

export const RestoreProgressBanner = ({ onRestore, departmentCount }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                animation: 'slideDown 0.3s ease-out'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        Progress Bar Available
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        {departmentCount > 0
                            ? `${departmentCount} department${departmentCount !== 1 ? 's' : ''} found`
                            : 'Click to restore your progress tracking'}
                    </div>
                </div>
            </div>

            <button
                onClick={onRestore}
                style={{
                    backgroundColor: 'white',
                    color: '#2196f3',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                Restore Progress Bar
            </button>
        </div>
    );
};

// Add this to your CSS file for the animation
const styles = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
`;
