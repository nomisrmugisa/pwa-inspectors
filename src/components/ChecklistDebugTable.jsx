import React, { useMemo, useState } from 'react';
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
    // State to preserve expanded/collapsed state of details elements
    const [expandedSections, setExpandedSections] = useState({});

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
                message: `No filter configuration found for facility type: ${facilityType}`,
                expectedCount: 0,
                actualCount: 0,
                expected: [],
                actual: [],
                missing: [],
                extra: [],
                mergedRows: []
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
                // Diagnostic check: Does a loose match exist?
                const normalizeLower = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                const looseMatchKey = Object.keys(filterConfig).find(key =>
                    normalizeLower(key).includes(normalizeLower(serviceDept)) ||
                    normalizeLower(serviceDept).includes(normalizeLower(key))
                );

                let msg = `No configuration found for this service department: ${serviceDept}`;
                if (looseMatchKey) {
                    msg = `Strict Mismatch: Selected "${serviceDept}" but config has "${looseMatchKey}". Validation skipped.`;
                }

                results.push({
                    serviceDepartment: serviceDept,
                    section: serviceDept,
                    status: 'error',
                    message: msg,
                    expectedCount: 0,
                    actualCount: 0,
                    expected: [],
                    actual: [],
                    missing: [],
                    extra: [],
                    mergedRows: []
                });
                return;
            }

            // Get expected DEs from CSV config
            const expectedDEs = sectionConfig.showOnly || [];

            // Find the corresponding DHIS2 section
            // Find the corresponding DHIS2 section
            const dhis2Section = visibleSections.find(section => {
                const sectionName = section.displayName || '';
                const normalizeComp = (str) => str.toLowerCase().trim();

                const sName = normalizeComp(sectionName);
                const deptName = normalizeComp(serviceDept);

                // 1. Exact match (case-insensitive)
                if (sName === deptName) return true;

                // 2. Handle "SECTION X-" prefix stripping
                // Only strip if it matches the standard pattern
                const cleanSectionName = sName.replace(/^section\s+[a-z0-9]+\s*-\s*/, '');
                if (cleanSectionName === deptName) return true;

                return false;
            });

            // Get actual DEs from DHIS2
			// NOTE: DHIS2 can represent section elements under different properties depending on
			// how metadata was fetched/transformed. Support both shapes.
			const dhis2SectionElements =
				dhis2Section?.dataElements ||
				dhis2Section?.programStageDataElements ||
				[];

			const actualDEs = dhis2SectionElements
				.map(de => de?.displayName || de?.dataElement?.displayName || '')
				.filter(Boolean);

            // Levenshtein distance for typo detection
            const getLevenshteinDistance = (a, b) => {
                const matrix = [];
                for (let i = 0; i <= b.length; i++) {
                    matrix[i] = [i];
                }
                for (let j = 0; j <= a.length; j++) {
                    matrix[0][j] = j;
                }
                for (let i = 1; i <= b.length; i++) {
                    for (let j = 1; j <= a.length; j++) {
                        if (b.charAt(i - 1) === a.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1,
                                matrix[i][j - 1] + 1,
                                matrix[i - 1][j] + 1
                            );
                        }
                    }
                }
                return matrix[b.length][a.length];
            };

            const isTypo = (str1, str2) => {
                const s1 = normalize(str1);
                const s2 = normalize(str2);
                if (Math.abs(s1.length - s2.length) > 5) return false;
                const distance = getLevenshteinDistance(s1, s2);
                const maxLength = Math.max(s1.length, s2.length);
                return (1 - distance / maxLength) > 0.7; // 70% similarity
            };

            // Create merged rows for aligned display
            const mergedRows = [];
            const usedActualIndices = new Set();

            // First pass: Process all expected items
            expectedDEs.forEach((expected, i) => {
                const normalizedExpected = normalize(expected);

                // 1. Try Exact Match
                let actualIndex = actualDEs.findIndex((actual, idx) =>
                    !usedActualIndices.has(idx) && normalize(actual) === normalizedExpected
                );

                if (actualIndex !== -1) {
                    usedActualIndices.add(actualIndex);
                    // Check for Position Error (Blue)
                    if (actualIndex !== i) {
                        mergedRows.push({
                            type: 'position',
                            expectedIndex: i,
                            actualIndex: actualIndex,
                            expected: expected,
                            actual: actualDEs[actualIndex],
                            message: `Found at position ${actualIndex + 1} instead of ${i + 1}`
                        });
                    } else {
                        mergedRows.push({
                            type: 'match',
                            expectedIndex: i,
                            actualIndex: actualIndex,
                            expected: expected,
                            actual: actualDEs[actualIndex]
                        });
                    }
                    return;
                }

                // 2. Try Fuzzy Match (Typo) - Yellow
                actualIndex = actualDEs.findIndex((actual, idx) =>
                    !usedActualIndices.has(idx) && isTypo(expected, actual)
                );

                if (actualIndex !== -1) {
                    usedActualIndices.add(actualIndex);
                    mergedRows.push({
                        type: 'typo',
                        expectedIndex: i,
                        actualIndex: actualIndex,
                        expected: expected,
                        actual: actualDEs[actualIndex],
                        message: 'Potential typo detected'
                    });
                    return;
                }

                // 3. No match found -> Missing (Red)
                mergedRows.push({
                    type: 'missing',
                    expectedIndex: i,
                    actualIndex: -1,
                    expected: expected,
                    actual: null
                });
            });

            // Second pass: Find any remaining actual items (Extras) - Purple
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

			// Derive missing/extra from mergedRows (occurrence-aware, handles duplicates like multiple "Comments")
			const missing = mergedRows
				.filter(r => r.type === 'missing')
				.map(r => r.expected)
				.filter(Boolean);

			const extra = mergedRows
				.filter(r => r.type === 'extra')
				.map(r => r.actual)
				.filter(Boolean);

            // Determine status
            let status = 'success';
            let message = 'All expected data elements are loaded correctly';

			const hasNonMatchIssues = (mergedRows || []).some(r => r.type !== 'match');

			if (missing.length > 0 && extra.length > 0) {
				status = 'error';
				message = `${missing.length} missing, ${extra.length} unexpected`;
			} else if (missing.length > 0) {
				status = 'warning';
				message = `${missing.length} expected data elements are missing`;
			} else if (extra.length > 0) {
				status = 'info';
				message = `${extra.length} unexpected data elements found`;
			} else if (hasNonMatchIssues) {
				// e.g. ordering/position mismatches or typos
				status = 'warning';
				message = 'Data elements loaded, but ordering/typos differ from expected';
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
            case 'success': return '#28a745'; // Green
            case 'warning': return '#ffc107'; // Yellow
            case 'error': return '#dc3545';   // Red
            case 'info': return '#17a2b8';    // Info Blue
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
                                <span className="stat-label">Issues:</span>
                                <span className="stat-value error">
                                    {(item.mergedRows || []).filter(r => r.type !== 'match').length}
                                </span>
                            </div>
                        </div>
                        <p className="summary-message">{item.message}</p>
                    </div>
                ))}
            </div>

            <div className="debug-details">
                {debugData.map((item, index) => {
                    const sectionKey = `${facilityType}-${item.serviceDepartment}`;
                    const isExpanded = expandedSections[sectionKey] !== undefined
                        ? expandedSections[sectionKey]
                        : item.status !== 'success';

                    return (
                    <details
                        key={index}
                        className="debug-section"
                        open={isExpanded}
                        onToggle={(e) => {
                            setExpandedSections(prev => ({
                                ...prev,
                                [sectionKey]: e.target.open
                            }));
                        }}
                    >
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
                            <div className="comparison-container">
                                <table className="de-table aligned-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>Expected (CSV)</th>
                                            <th>Actual (DHIS2)</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(item.mergedRows || []).map((row, rIndex) => (
                                            <tr key={rIndex} className={`row-${row.type}`} style={{
                                                backgroundColor:
                                                    row.type === 'match' ? '#d4edda' :
                                                        row.type === 'typo' ? '#fff3cd' :
                                                            row.type === 'missing' ? '#f8d7da' :
                                                                row.type === 'extra' ? '#e2d9f3' : // Purple-ish
                                                                    row.type === 'position' ? '#cce5ff' : // Blue-ish
                                                                        'transparent'
                                            }}>
                                                <td>{rIndex + 1}</td>
                                                <td>
                                                    {row.expected ? (
                                                        <div style={{
                                                            fontWeight: row.expected.trim().endsWith('--') ? 'bold' : 'normal'
                                                        }}>
                                                            {row.expected}
                                                            <span className={`index-badge expected`}>#{row.expectedIndex + 1}</span>
                                                        </div>
                                                    ) : <span className="empty-cell">-</span>}
                                                </td>
                                                <td>
                                                    {row.actual ? (
                                                        <div style={{
                                                            fontWeight: row.actual.trim().endsWith('--') ? 'bold' : 'normal'
                                                        }}>
                                                            {row.actual}
                                                            <span className={`index-badge actual`}>#{row.actualIndex + 1}</span>
                                                        </div>
                                                    ) : <span className="empty-cell">-</span>}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                    {row.type === 'match' && <span style={{ color: '#28a745' }}>✓ OK</span>}
                                                    {row.type === 'typo' && <span style={{ color: '#856404' }}>✎ TYPO</span>}
                                                    {row.type === 'missing' && <span style={{ color: '#dc3545' }}>✗ MISSING</span>}
                                                    {row.type === 'extra' && <span style={{ color: '#6f42c1' }}>+ EXTRA</span>}
                                                    {row.type === 'position' && <span style={{ color: '#004085' }}>⇅ MOVED</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>
                    );
                })}
            </div>
        </div>
    );
}
