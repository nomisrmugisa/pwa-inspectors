/**
 * CORRECTED VERSION OF getInspectionIdForFacility
 * Replace the existing method in src/hooks/useAPI.js (lines 721-754) with this version
 */

async getInspectionIdForFacility(orgUnitId) {
    const SCHEDULE_PROGRAM_ID = 'wyQbzZAaJJa';
    console.log(`🔍 Fetching Inspection ID for Facility: ${orgUnitId} from program ${SCHEDULE_PROGRAM_ID}`);

    try {
        // Fetch TEIs for this facility in the scheduling program
        const response = await this.request(
            `/api/trackedEntityInstances?ou=${orgUnitId}&program=${SCHEDULE_PROGRAM_ID}`
        );

        const teis = response?.trackedEntityInstances || [];
        console.log(`📋 Found ${teis.length} inspection schedules for this facility`);

        if (teis.length > 0) {
            const today = new Date();

            // Filter for authorized inspections within date range
            for (const tei of teis) {
                const attributes = tei.attributes || [];

                // Check if this is an authorized inspection
                const statusAttr = attributes.find(attr => attr.code === 'INSP_SCHEDULE_STATUS');
                if (!statusAttr || statusAttr.value !== 'INSP_SCHEDULE_AUTHORIZED') {
                    console.log(`⏭️ Skipping TEI ${tei.trackedEntityInstance} - status: ${statusAttr?.value || 'UNKNOWN'}`);
                    continue;
                }

                // Check date range
                const startDateAttr = attributes.find(attr => attr.code === 'INSP_START_DATE' || attr.code === 'INSP_PROPOSED_START_DATE');
                const endDateAttr = attributes.find(attr => attr.code === 'INSP_END_DATE' || attr.code === 'INSP_PROPOSED_END_DATE');

                if (startDateAttr && endDateAttr) {
                    const startDate = new Date(startDateAttr.value);
                    const endDate = new Date(endDateAttr.value);

                    if (today < startDate || today > endDate) {
                        console.log(`⏭️ Skipping TEI ${tei.trackedEntityInstance} - outside date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
                        continue;
                    }
                }

                // This TEI matches all criteria, return its inspection ID
                const inspectionIdAttr = attributes.find(attr => attr.code === 'INSP_INSPECTION_ID');

                if (inspectionIdAttr && inspectionIdAttr.value) {
                    console.log(`✅ Found Inspection ID: ${inspectionIdAttr.value} (TEI: ${tei.trackedEntityInstance})`);
                    console.log(`   Status: ${statusAttr.value}`);
                    console.log(`   Date Range: ${startDateAttr?.value} to ${endDateAttr?.value}`);
                    return inspectionIdAttr.value;
                }
            }
        }

        console.warn('⚠️ No authorized INSP_INSPECTION_ID found for this facility within current date range');
        return null;
    } catch (error) {
        console.error('❌ Failed to fetch Inspection ID:', error);
        return null;
    }
}
