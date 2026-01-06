import React, { useEffect, useState } from "react";
import { useAPI } from "../hooks/useAPI";

/**
 * Debug component to fetch inspections
 * where today lies between start and end dates
 * using the Inspection Scheduling Program.
 *
 * This component will help us discover the actual attribute UIDs
 * and test the enrollment/TEI fetching approach.
 */
const ActiveInspectionsDebug = () => {
    const api = useAPI();
    const [loading, setLoading] = useState(false);
    const [enrollments, setEnrollments] = useState(null);
    const [teis, setTeis] = useState(null);
    const [error, setError] = useState(null);
    const [programMetadata, setProgramMetadata] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    /* ======================================================
     * HARD-CODED CONFIG (EDIT ONLY THESE IF NEEDED)
     * ====================================================== */

    // Inspection Scheduling Program UID
    const PROGRAM_UID = "wyQbzZAaJJa";

    // 🔴 These are PLACEHOLDER UIDs - we'll discover the real ones
    const ATTR_STATUS_UID = "PLACEHOLDER_STATUS";
    const ATTR_START_DATE_UID = "PLACEHOLDER_START";
    const ATTR_END_DATE_UID = "PLACEHOLDER_END";

    // Allowed workflow states
    const ACTIVE_STATUSES = [
        "INSP_SCHEDULE_APPROVED",
        "INSP_SCHEDULE_AUTHORIZED",
    ];

    const today = new Date().toISOString().split("T")[0];

    /* ======================================================
     * EFFECT
     * ====================================================== */
    useEffect(() => {
        const fetchActiveInspections = async () => {
            setLoading(true);
            setError(null);

            try {
                /* ----------------------------------------------
                 * STEP 0: FETCH PROGRAM METADATA TO DISCOVER ATTRIBUTES
                 * ---------------------------------------------- */
                console.log('🔍 Fetching program metadata...');
                const programMeta = await api.request(
                    `/api/programs/${PROGRAM_UID}?fields=id,displayName,programTrackedEntityAttributes[id,displayName,mandatory,valueType,trackedEntityAttribute[id,displayName,code,valueType,optionSet[id,displayName,options[id,displayName,code]]]]`
                );
                setProgramMetadata(programMeta);
                console.log('📋 Program Metadata:', programMeta);

                // Fetch current user for inspector filtering
                const userResult = await api.getMe();
                setCurrentUser(userResult);
                console.log('👤 Current User:', userResult);

                /* ----------------------------------------------
                 * STEP 1: FETCH ALL ENROLLMENTS (NO FILTERS FIRST)
                 * ---------------------------------------------- */
                console.log('🔍 Fetching all enrollments...');
                const enrollmentParams = new URLSearchParams({
                    paging: 'false',
                    ouMode: 'ALL',
                    program: PROGRAM_UID,
                    fields: 'enrollment,trackedEntityInstance,orgUnit,orgUnitName,attributes[attribute,displayName,value],enrollmentDate,incidentDate'
                });

                const enrollmentResponse = await api.request(`/api/enrollments?${enrollmentParams}`);
                setEnrollments(enrollmentResponse);
                console.log('📊 Enrollments:', enrollmentResponse);

                // TESTING: Hardcode specific TEI ID
                const teiIds = ['R68j4JhPGxG'];
                console.log('🧪 TESTING MODE: Fetching only TEI:', teiIds[0]);

                if (teiIds.length === 0) {
                    console.warn('⚠️ No enrollments found');
                    setTeis([]);
                    setLoading(false);
                    return;
                }

                /* ----------------------------------------------
                 * STEP 2: FETCH FULL TEIs IN BATCHES
                 * ---------------------------------------------- */
                console.log('🔍 Fetching TEIs in batches...');

                // Batch TEI IDs to avoid URL length limits (max ~50 IDs per request)
                const BATCH_SIZE = 50;
                const teiBatches = [];
                for (let i = 0; i < teiIds.length; i += BATCH_SIZE) {
                    teiBatches.push(teiIds.slice(i, i + BATCH_SIZE));
                }

                console.log(`📦 Fetching ${teiIds.length} TEIs in ${teiBatches.length} batches`);

                let allTeis = [];
                for (let i = 0; i < teiBatches.length; i++) {
                    const batch = teiBatches[i];
                    console.log(`  Batch ${i + 1}/${teiBatches.length}: Fetching ${batch.length} TEIs...`);

                    const teiParams = new URLSearchParams({
                        paging: 'false',
                        trackedEntityInstance: batch.join(';'),
                        fields: 'trackedEntityInstance,created,lastUpdated,attributes[attribute,displayName,value],enrollments[enrollment,orgUnit,orgUnitName,enrollmentDate,attributes[attribute,displayName,value],events[event,programStage,eventDate,status,dataValues[dataElement,value]]]'
                    });

                    const teiResponse = await api.request(`/api/trackedEntityInstances?${teiParams}`);
                    const batchTeis = teiResponse?.trackedEntityInstances || [];
                    allTeis = allTeis.concat(batchTeis);

                    console.log(`  ✅ Batch ${i + 1} fetched ${batchTeis.length} TEIs`);
                }

                // Debug: Find missing TEIs
                const fetchedTeiIds = new Set(allTeis.map(tei => tei.trackedEntityInstance));
                const missingTeiIds = teiIds.filter(id => !fetchedTeiIds.has(id));

                if (missingTeiIds.length > 0) {
                    console.warn('⚠️ Missing TEIs after batched fetch:', {
                        totalEnrollmentTeis: teiIds.length,
                        fetchedTeis: allTeis.length,
                        missingCount: missingTeiIds.length,
                        missingIds: missingTeiIds
                    });

                    // Find which enrollments have missing TEIs
                    const enrollmentsWithMissingTeis = enrollmentResponse.enrollments.filter(
                        e => missingTeiIds.includes(e.trackedEntityInstance)
                    );
                    console.warn('📋 Enrollments with missing TEIs:', enrollmentsWithMissingTeis);
                } else {
                    console.log('✅ All TEIs successfully fetched!');
                }

                // Filter TEIs by status, date, AND inspector assignment
                const authorizedTeis = allTeis.filter(tei => {
                    // 1. STATUS FILTER
                    const statusAttr = tei.attributes?.find(attr =>
                        attr.displayName === 'Inspection Schedule Status' ||
                        attr.displayName?.toLowerCase().includes('schedule status')
                    );
                    const isAuthorized = statusAttr?.value === 'INSP_SCHEDULE_AUTHORIZED';

                    // 2. DATE FILTER
                    const startDateAttr = tei.attributes?.find(attr =>
                        attr.displayName === 'Inspection Start Date' ||
                        attr.displayName === 'Inspection Proposed Start Date'
                    );
                    const endDateAttr = tei.attributes?.find(attr =>
                        attr.displayName === 'Inspection End Date' ||
                        attr.displayName === 'Inspection Proposed End Date'
                    );
                    const inspectorListAttr = tei.attributes?.find(attr =>
                        attr.displayName === 'Inspectors Final List'
                    );

                    let isDateActive = false;
                    if (startDateAttr?.value && endDateAttr?.value) {
                        const start = new Date(startDateAttr.value);
                        const end = new Date(endDateAttr.value);
                        const current = new Date(today);

                        // Set times to midnight for accurate date comparison
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999); // Include the entire end day
                        current.setHours(12, 0, 0, 0); // Mid-day to avoid edge cases

                        isDateActive = current >= start && current <= end;
                    } else {
                        // If dates are missing, we might want to include it for debugging, 
                        // but strictly speaking it's not "active" in a date range.
                        // Let's log it and exclude it to be safe, or include if we want to catch data issues.
                        // For now, let's include ONLY if dates are valid to be strict.
                        console.warn(`TEI ${tei.trackedEntityInstance}: Missing date attributes`);
                    }

                    // 3. INSPECTOR FILTER
                    const inspectorList = inspectorListAttr?.value || '';
                    const isAssignedToUser = userResult?.username && inspectorList.includes(userResult.username);

                    const match = isAuthorized && isDateActive && isAssignedToUser;

                    if (isAuthorized && !isDateActive) {
                        console.log(`TEI ${tei.trackedEntityInstance}: Authorized but outside date range (${startDateAttr?.value} - ${endDateAttr?.value})`);
                    }
                    if (isAuthorized && isDateActive && !isAssignedToUser) {
                        console.log(`TEI ${tei.trackedEntityInstance}: Authorized & Active, but NOT assigned to ${userResult?.username}. Assigned to: ${inspectorList}`);
                    }

                    return match;
                });

                console.log('🔍 Filtering by status INSP_SCHEDULE_AUTHORIZED:');
                console.log(`  Total TEIs: ${allTeis.length}`);
                console.log(`  Authorized TEIs: ${authorizedTeis.length}`);

                setTeis(authorizedTeis);
                console.log('👥 Displaying TEIs:', authorizedTeis.length);
                console.log('📋 TEI Data:', authorizedTeis);

            } catch (err) {
                console.error('❌ Error:', err);
                setError(
                    err?.response?.data?.message ||
                    err.message ||
                    "Unexpected error"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchActiveInspections();
    }, []);

    /* ======================================================
     * RENDER
     * ====================================================== */
    return (
        <div style={{ padding: 20, fontFamily: "monospace", maxWidth: 1200 }}>
            <h2>🧪 Active Inspections Debug</h2>

            <p>
                <strong>Program UID:</strong> {PROGRAM_UID}
            </p>
            <p>
                <strong>Today:</strong> {today}
            </p>

            {loading && <p>⏳ Loading…</p>}
            {error && (
                <div style={{
                    color: "white",
                    backgroundColor: "#dc3545",
                    padding: 10,
                    borderRadius: 4,
                    marginBottom: 20
                }}>
                    <strong>Error:</strong>
                    <pre style={{ whiteSpace: "pre-wrap", margin: "10px 0 0 0" }}>
                        {error}
                    </pre>
                </div>
            )}

            <hr />

            <h3>0️⃣ Program Metadata (Attributes)</h3>
            {programMetadata && (
                <div style={{ marginBottom: 20 }}>
                    <p><strong>Program:</strong> {programMetadata.displayName}</p>
                    <h4>Tracked Entity Attributes:</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Display Name</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>UID</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Code</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Type</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Mandatory</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programMetadata.programTrackedEntityAttributes?.map(pta => (
                                <tr key={pta.trackedEntityAttribute.id}>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{pta.trackedEntityAttribute.displayName}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8, fontFamily: 'monospace' }}>{pta.trackedEntityAttribute.id}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{pta.trackedEntityAttribute.code || '-'}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{pta.trackedEntityAttribute.valueType}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{pta.mandatory ? '✅' : '❌'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <details>
                <summary>View Raw JSON</summary>
                <pre style={{ maxHeight: 300, overflow: "auto", fontSize: 11 }}>
                    {JSON.stringify(programMetadata, null, 2)}
                </pre>
            </details>

            <hr />

            <h3>1️⃣ Enrollment Response ({enrollments?.enrollments?.length || 0} enrollments)</h3>
            {enrollments?.enrollments?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <h4>Sample Enrollment Attributes:</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Attribute Name</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.enrollments[0]?.attributes?.map(attr => (
                                <tr key={attr.attribute}>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{attr.displayName}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{attr.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <details>
                <summary>View Raw JSON</summary>
                <pre style={{ maxHeight: 300, overflow: "auto", fontSize: 11 }}>
                    {JSON.stringify(enrollments, null, 2)}
                </pre>
            </details>

            <hr />

            <h3>2️⃣ Tracked Entity Instances ({teis?.length || 0} TEIs)</h3>
            {teis && teis.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <h4>Sample TEI Attributes:</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Attribute Name</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teis[0]?.attributes?.map(attr => (
                                <tr key={attr.attribute}>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{attr.displayName}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{attr.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <details>
                <summary>View Raw JSON</summary>
                <pre style={{ maxHeight: 300, overflow: "auto", fontSize: 11 }}>
                    {JSON.stringify(teis, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default ActiveInspectionsDebug;
