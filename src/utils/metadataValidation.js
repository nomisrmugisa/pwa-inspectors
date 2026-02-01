
/**
 * Utility to fetch DHIS2 metadata using current credentials and validate local configuration.
 */

export const validateMetadata = async (api, localConfiguration) => {
    console.log("🔍 Starting Metadata Validation...");

    if (!localConfiguration || !localConfiguration.programStageSections) {
        console.warn("⚠️ Local configuration not ready for validation.");
        return;
    }

    try {
        // 1. Fetch live metadata from DHIS2
        // We use the same fields as the Python script to ensure consistency
        const PROGRAM_STAGE_ID = 'Eupjm3J0dt2'; // Hardcoded ID from python script
        const fields = 'programStageDataElements[dataElement[id,formName,displayFormName,name,displayName]]';

        console.log(`🌐 Fetching live metadata for stage: ${PROGRAM_STAGE_ID}...`);
        const liveData = await api.get(`programStages/${PROGRAM_STAGE_ID}`, { fields });

        if (!liveData || !liveData.programStageDataElements) {
            console.error("❌ Failed to fetch live metadata (empty response)");
            return;
        }

        // 2. Build map of existing Data Elements on Server
        const serverElements = new Set();
        const serverElementNames = new Set(); // For fuzzy/name matching check

        liveData.programStageDataElements.forEach(psde => {
            const de = psde.dataElement;
            if (de) {
                serverElements.add(de.id);
                // Track names to help identify "missing" items that might just be renamed
                if (de.formName) serverElementNames.add(normalize(de.formName));
                if (de.displayFormName) serverElementNames.add(normalize(de.displayFormName));
                if (de.displayName) serverElementNames.add(normalize(de.displayName));
                if (de.name) serverElementNames.add(normalize(de.name));
            }
        });

        console.log(`✅ Loaded ${serverElements.size} data elements from DHIS2.`);

        // 3. Compare Local Config vs Server
        const localSections = localConfiguration.programStageSections;
        let missingCount = 0;
        let mismatchCount = 0;
        const missingReport = [];

        localSections.forEach(section => {
            if (!section.dataElements) return;

            section.dataElements.forEach(psde => {
                const de = psde.dataElement;
                if (!de || !de.id) return;

                // Check 1: Does the ID exist on the server?
                if (!serverElements.has(de.id)) {
                    // It's missing by ID. 
                    // Check 2: Is it a "ghost" element? (ID exists in local config but not on server)
                    // OR is it that we are using a name to look it up locally and it failed?
                    // In the App, we rely on IDs. If ID is missing, we can't save data for it.

                    missingCount++;
                    missingReport.push({
                        section: section.displayName,
                        name: de.displayName || de.formName || 'Unknown',
                        id: de.id,
                        reason: 'ID not found on server'
                    });
                }
            });
        });

        // 4. Output Report
        if (missingCount === 0) {
            console.log("%c✅ METADATA VALIDATION PASSED: All local fields exist on the server!", "color: green; font-weight: bold; font-size: 14px;");
        } else {
            console.group(`%c❌ METADATA VALIDATION FAILED: ${missingCount} fields missing!`, "color: red; font-weight: bold; font-size: 14px;");
            console.warn(`These fields exist in your App/Config but NOT in DHIS2. Data entered here WILL NOT SAVE.`);

            missingReport.forEach(item => {
                console.log(`%c[${item.section}] %c${item.name} %c(${item.id})`, "color: gray", "color: red; font-weight: bold", "color: gray");
            });
            console.groupEnd();

            // Optionally alert the user (dev mode only mostly)
            // alert(`WARNING: ${missingCount} fields are missing in DHIS2. Check console for details.`);
        }

    } catch (error) {
        console.error("❌ Metadata validation failed:", error);
    }
};

function normalize(str) {
    return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}
