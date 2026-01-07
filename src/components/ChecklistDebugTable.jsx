import React, { useMemo } from 'react';
import facilityServiceFilters from '../config/facilityServiceFilters';
import './ChecklistDebugTable.css';

/**
 * ChecklistDebugTable - Validation tool for checklist implementation
 * 
 * Compares expected data elements from CSV config against actual DHIS2 data elements
 * being loaded for a given facility type and service departments.
 */
export function ChecklistDebugTable({
    facilityType,
    selectedServiceDepartments = [],
    visibleSections = [],
    configuration
}) {

    const debugData = useMemo(() => {
        if (!facilityType || !configuration) return [];

        const results = [];

        // Get the filter config for this facility type
        const filterConfig = facilityServiceFilters[facilityType];

        if (!filterConfig) {
            return [{
                serviceDepartment: facilityType,
                section: 'N/A',
                status: 'error',
                message: `No filter configuration found for facility type: ${facilityType}`
            }];
        }

        // Normalize function for comparison
        const normalize = (str) => {
            if (!str) return '';
            return str.replace(/^[^a-zA-Z0-9(]+/, "")
                .replace(/[''']/g, "")
                .toLowerCase()
                .trim();
        };

        // For each service department selected
        selectedServiceDepartments.forEach(serviceDept => {
            // Find the matching section in filter config
            const sectionConfig = filterConfig[serviceDept];

            if (!sectionConfig || !sectionConfig.showOnly) {
                results.push({
                    serviceDepartment: serviceDept,
                    section: serviceDept,
                    status: 'warning',
                    message: 'No configuration found for this service department',
                    expectedCount: 0,
                    actualCount: 0,
                    expected: [],
                    actual: [],
                    missing: [],
                    extra: []
                });
                return;
            }

            // Get expected DEs from CSV config
            const expectedDEs = sectionConfig.showOnly || [];

            // Find the corresponding DHIS2 section
            const dhis2Section = visibleSections.find(section => {
                const sectionName = section.displayName || '';
                const normalizeName = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                return normalizeName(sectionName).includes(normalizeName(serviceDept)) ||
                    normalizeName(serviceDept).includes(normalizeName(sectionName));
            });

            // Get actual DEs from DHIS2
            const actualDEs = dhis2Section?.dataElements?.map(de =>
                de.displayName || de.dataElement?.displayName || ''
            ) || [];

            // Find missing DEs (in expected but not in actual)
            const missing = expectedDEs.filter(expected => {
                const normalizedExpected = normalize(expected);
                return !actualDEs.some(actual => normalize(actual) === normalizedExpected);
            });

            // Find extra DEs (in actual but not in expected)
            const extra = actualDEs.filter(actual => {
                const normalizedActual = normalize(actual);
                return !expectedDEs.some(expected => normalize(expected) === normalizedActual);
            });

            // Create merged rows for aligned display
            const mergedRows = [];
            const usedActualIndices = new Set();

            // First pass: Process all expected items
            expectedDEs.forEach((expected, i) => {
                const normalizedExpected = normalize(expected);
                const actualIndex = actualDEs.findIndex(actual =>
                    normalize(actual) === normalizedExpected && !usedActualIndices.has(actualDEs.indexOf(actual))
                );

                if (actualIndex !== -1) {
                    usedActualIndices.add(actualIndex);
                    mergedRows.push({
                        type: 'match',
                        expectedIndex: i,
                        actualIndex: actualIndex,
                        expected: expected,
                        actual: actualDEs[actualIndex]
                    });
                } else {
                    mergedRows.push({
                        type: 'missing',
                        expectedIndex: i,
                        actualIndex: -1,
                        expected: expected,
                        actual: null
                    });
                }
            });

            // Second pass: Find any remaining actual items (extras)
            actualDEs.forEach((actual, i) => {
                if (!usedActualIndices.has(i)) {
                    mergedRows.push({
                        type: 'extra',
                        expectedIndex: -1,
                        actualIndex: i,
                        expected: null,
                        actual: actual
                    });
                }
            });

            // Determine status
            let status = 'success';
            let message = 'All expected data elements are loaded correctly';

            if (missing.length > 0 && extra.length > 0) {
                status = 'error';
                message = `${missing.length} missing, ${extra.length} unexpected`;
            } else if (missing.length > 0) {
                status = 'warning';
                message = `${missing.length} expected data elements are missing`;
            } else if (extra.length > 0) {
                status = 'info';
                message = `${extra.length} unexpected data elements found`;
            }

            results.push({
                serviceDepartment: serviceDept,
                section: dhis2Section?.displayName || serviceDept,
                status,
                message,
                expectedCount: expectedDEs.length,
                actualCount: actualDEs.length,
                expected: expectedDEs,
                actual: actualDEs,
                missing,
                extra,
                mergedRows, // Added mergedRows for display
                dhis2SectionId: dhis2Section?.id,
                normalize
            });
        });

        return results;
    }, [facilityType, selectedServiceDepartments, visibleSections, configuration]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✗';
            case 'info': return 'ℹ';
            default: return '?';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#28a745';
            case 'warning': return '#ffc107';
            case 'error': return '#dc3545';
            case 'info': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    if (!facilityType) {
        return (
            <div className="checklist-debug-table">
                <div className="debug-empty-state">
                    <p>Please select a facility type to view validation data</p>
                </div>
            </div>
        );
    }

    if (selectedServiceDepartments.length === 0) {
        return (
            <div className="checklist-debug-table">
                <div className="debug-empty-state">
                    <p>Please select service departments to view validation data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="checklist-debug-table">
            <div className="debug-header">
                <h3>📊 Checklist Validation Report</h3>
                <div className="debug-meta">
                    <span><strong>Facility Type:</strong> {facilityType}</span>
                    <span><strong>Service Departments:</strong> {selectedServiceDepartments.length}</span>
                </div>
            </div>

            <div className="debug-summary">
                {debugData.map((item, index) => (
                    <div key={index} className={`debug-summary-card status-${item.status}`}>
                        <div className="summary-header">
                            <span className="status-icon" style={{ color: getStatusColor(item.status) }}>
                                {getStatusIcon(item.status)}
                            </span>
                            <h4>{item.serviceDepartment}</h4>
                        </div>
                        <div className="summary-stats">
                            <div className="stat">
                                <span className="stat-label">Expected:</span>
                                <span className="stat-value">{item.expectedCount}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Actual:</span>
                                <span className="stat-value">{item.actualCount}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Missing:</span>
                                <span className="stat-value error">{item.missing?.length || 0}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Extra:</span>
                                <span className="stat-value info">{item.extra?.length || 0}</span>
                            </div>
                        </div>
                        <p className="summary-message">{item.message}</p>
                    </div>
                ))}
            </div>

            <div className="debug-details">
                {debugData.map((item, index) => (
                    <details key={index} className="debug-section" open={item.status !== 'success'}>
                        <summary className="debug-section-header">
                            <span className="status-icon" style={{ color: getStatusColor(item.status) }}>
                                {getStatusIcon(item.status)}
                            </span>
                            <span className="section-title">{item.serviceDepartment}</span>
                            <span className="section-counts">
                                ({item.expectedCount} expected / {item.actualCount} actual)
                            </span>
                        </summary>

                        <div className="debug-section-content">
                            {/* Missing Data Elements */}
                            {item.missing && item.missing.length > 0 && (
                                <div className="de-list missing-list">
                                    <h5>❌ Missing Data Elements ({item.missing.length})</h5>
                                    <p className="list-description">CSV items not found in DHIS2:</p>
                                </div>
                            )}

                            {/* Extra Data Elements */}
                            {item.extra && item.extra.length > 0 && (
                                <div className="de-list extra-list">
                                    <h5>➕ Unexpected Data Elements ({item.extra.length})</h5>
                                    <p className="list-description">DHIS2 items not in CSV:</p>
                                </div>
                            )}

                            {/* Full Comparison Table */}
                            <details className="full-comparison" open={true}>
                                <summary>View Comparison Table</summary>
                                <div className="comparison-container">
                                    <table className="de-table aligned-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '5%' }}>#</th>
                                                <th style={{ width: '45%' }}>Expected (CSV)</th>
                                                <th style={{ width: '5%', textAlign: 'center' }}>Status</th>
                                                <th style={{ width: '45%' }}>Actual (DHIS2)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.mergedRows.map((row, i) => (
                                                <tr key={i} className={`row-${row.type}`} style={{
                                                    backgroundColor: row.type === 'match' ? '#d4edda' :
                                                        row.type === 'missing' ? '#f8d7da' : '#fff3cd'
                                                }}>
                                                    <td>{i + 1}</td>
                                                    <td className={row.type === 'missing' ? 'text-missing' : ''}>
                                                        {row.expected || <span className="empty-cell">-</span>}
                                                        {row.expected && <div className="index-badge expected">{row.expectedIndex + 1}</div>}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                        {row.type === 'match' ? <span style={{ color: '#28a745' }}>✓</span> :
                                                            row.type === 'missing' ? <span style={{ color: '#dc3545' }}>✗</span> :
                                                                <span style={{ color: '#ffc107' }}>?</span>}
                                                    </td>
                                                    <td className={row.type === 'extra' ? 'text-extra' : ''}>
                                                        {row.actual || <span className="empty-cell">-</span>}
                                                        {row.actual && <div className="index-badge actual">{row.actualIndex + 1}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
