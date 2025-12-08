import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

export const ProgressBar = ({
    progress = 0,
    total = 0,
    completed = 0,
    label = "Overall Progress",
    departments = [], // Array of {name, progress, completed, total}
    color = "#3b82f6"
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Smoothly animate progress changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [progress]);

    // Determine status color based on progress
    const getStatusColor = (p) => {
        if (p >= 100) return 'complete';
        if (p >= 70) return 'high';
        if (p >= 40) return 'medium';
        return 'low';
    };

    const status = getStatusColor(animatedProgress);
    const strokeColor = {
        low: '#ef4444',
        medium: '#f59e0b',
        high: '#3b82f6',
        complete: '#10b981'
    }[status];

    // Circular progress calculation
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

    if (isCollapsed) {
        return (
            <div
                className="progress-bar-container"
                onClick={() => setIsCollapsed(false)}
                title="Click to expand"
            >
                <div className="progress-card collapsed">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg"
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className={`circle status-${status}`}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            stroke={strokeColor}
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage-text">
                            {Math.round(animatedProgress)}%
                        </text>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div
            className="progress-bar-container"
            title="Click to collapse"
        >
            <div className="progress-card">
                <div className="progress-header" onClick={() => setIsCollapsed(true)} style={{ cursor: 'pointer' }}>
                    <span className="progress-title">{label}</span>
                    <span className={`progress-percent text-${status}`}>
                        {Math.round(animatedProgress)}%
                    </span>
                </div>

                <div className="progress-track">
                    <div
                        className={`progress-fill ${status === 'complete' ? 'complete' : ''}`}
                        style={{ width: `${animatedProgress}%` }}
                    />
                </div>

                <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>{completed} of {total} items</span>
                    {status === 'complete' && <span>✨ Done!</span>}
                </div>

                {/* Department Breakdown */}
                {departments && departments.length > 0 && (
                    <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            By Department
                        </div>
                        {departments.map((dept, index) => {
                            const deptStatus = getStatusColor(dept.progress);
                            return (
                                <div key={index} style={{
                                    marginBottom: '8px',
                                    padding: '6px 8px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            color: '#1e293b',
                                            flex: 1
                                        }}>
                                            {dept.name}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: {
                                                low: '#ef4444',
                                                medium: '#f59e0b',
                                                high: '#3b82f6',
                                                complete: '#10b981'
                                            }[deptStatus],
                                            marginLeft: '8px'
                                        }}>
                                            {Math.round(dept.progress)}%
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        backgroundColor: '#e2e8f0',
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${dept.progress}%`,
                                            height: '100%',
                                            backgroundColor: {
                                                low: '#ef4444',
                                                medium: '#f59e0b',
                                                high: '#3b82f6',
                                                complete: '#10b981'
                                            }[deptStatus],
                                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }} />
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#94a3b8',
                                        marginTop: '2px'
                                    }}>
                                        {dept.completed}/{dept.total} fields
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
