/**
 * DHIS2 Section Comparison Tool
 * 
 * This script fetches the program stage sections from DHIS2 and compares them
 * with the CSV-generated service departments in the app.
 * 
 * Usage:
 * 1. Open the browser at localhost:3000 (with the dev server running)
 * 2. Open the browser console (F12 -> Console)
 * 3. Copy and paste this entire script into the console
 * 4. Review the comparison output
 */

(async function compareDHIS2Sections() {
    console.log('🔍 DHIS2 Section Comparison Tool');
    console.log('='.repeat(60));

    // CSV-generated sections from the app (from facilityServiceDepartments.js)
    const csvSections = [
        'BLEEDING ROOM',
        'CUSTOMER SATISFACTION',
        'FACILITY-CONSULTATION/ TREATMENT ROOM',
        'FACILITY-ENVIRONMENT',
        'FACILITY-PROCEDURE ROOM',
        'FACILITY-RECEPTION/WAITING AREA',
        'FACILITY-SCREENING ROOM',
        'HIV SCREENING',
        'LABORATORY TESTING AREAS CHEMISTRY',
        'LABORATORY TESTING AREAS HAEMATOLOGY',
        'MICROBIOLOGY',
        'ORGANISATION AND MANAGEMENT',
        'PERSONNEL',
        'PHARMACY/DISPENSARY',
        'SAFETY AND WASTE MANAGEMENT',
        'SERVICES PROVIDED',
        'SLUICE ROOM',
        'SPECIMEN RECEPTION ROOM',
        'SUPPLIES',
        'TOILET FACILITIES'
    ];

    console.log(`\n📋 CSV Sections (from checklist): ${csvSections.length} sections`);
    csvSections.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

    // Try to fetch DHIS2 sections
    const PROGRAM_STAGE_ID = 'Eupjm3J0dt2';

    try {
        console.log(`\n🌐 Fetching DHIS2 program stage sections...`);
        console.log(`   Program Stage ID: ${PROGRAM_STAGE_ID}`);

        const response = await fetch(`/api/programStages/${PROGRAM_STAGE_ID}?fields=programStageSections[id,displayName,sortOrder]`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const dhis2Sections = data.programStageSections || [];

        console.log(`\n📋 DHIS2 Sections: ${dhis2Sections.length} sections`);
        dhis2Sections
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .forEach((s, i) => console.log(`  ${i + 1}. ${s.displayName} (ID: ${s.id})`));

        // Compare sections
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPARISON RESULTS');
        console.log('='.repeat(60));

        const dhis2Names = dhis2Sections.map(s => s.displayName.toUpperCase().trim());
        const csvNamesUpper = csvSections.map(s => s.toUpperCase().trim());

        // Find matches
        const matches = [];
        const csvOnly = [];
        const dhis2Only = [];

        csvSections.forEach(csvSection => {
            const csvUpper = csvSection.toUpperCase().trim();
            const matchedDhis2 = dhis2Sections.find(d =>
                d.displayName.toUpperCase().trim() === csvUpper ||
                d.displayName.toUpperCase().includes(csvUpper) ||
                csvUpper.includes(d.displayName.toUpperCase().trim())
            );

            if (matchedDhis2) {
                matches.push({
                    csv: csvSection,
                    dhis2: matchedDhis2.displayName,
                    dhis2Id: matchedDhis2.id,
                    exactMatch: matchedDhis2.displayName.toUpperCase().trim() === csvUpper
                });
            } else {
                csvOnly.push(csvSection);
            }
        });

        dhis2Sections.forEach(d => {
            const dhis2Upper = d.displayName.toUpperCase().trim();
            const matched = csvSections.find(csv =>
                csv.toUpperCase().trim() === dhis2Upper ||
                csv.toUpperCase().includes(dhis2Upper) ||
                dhis2Upper.includes(csv.toUpperCase().trim())
            );
            if (!matched) {
                dhis2Only.push(d);
            }
        });

        console.log(`\n✅ MATCHED SECTIONS (${matches.length}):`);
        matches.forEach((m, i) => {
            const status = m.exactMatch ? '✅ EXACT' : '⚠️ PARTIAL';
            console.log(`  ${i + 1}. ${status}`);
            console.log(`     CSV:   "${m.csv}"`);
            console.log(`     DHIS2: "${m.dhis2}" (${m.dhis2Id})`);
        });

        console.log(`\n❌ CSV ONLY (Not in DHIS2) - ${csvOnly.length}:`);
        csvOnly.forEach((s, i) => console.log(`  ${i + 1}. "${s}"`));

        console.log(`\n❌ DHIS2 ONLY (Not in CSV) - ${dhis2Only.length}:`);
        dhis2Only.forEach((s, i) => console.log(`  ${i + 1}. "${s.displayName}" (${s.id})`));

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total CSV Sections:   ${csvSections.length}`);
        console.log(`Total DHIS2 Sections: ${dhis2Sections.length}`);
        console.log(`Matched:              ${matches.length} (${matches.filter(m => m.exactMatch).length} exact)`);
        console.log(`CSV Only:             ${csvOnly.length}`);
        console.log(`DHIS2 Only:           ${dhis2Only.length}`);

        // Return data for further analysis
        return {
            csvSections,
            dhis2Sections,
            matches,
            csvOnly,
            dhis2Only
        };

    } catch (error) {
        console.error(`\n❌ Error fetching DHIS2 sections: ${error.message}`);
        console.log('\n💡 Make sure:');
        console.log('   1. The dev server is running (npm run dev)');
        console.log('   2. You are logged in to the app');
        console.log('   3. The DHIS2 server is accessible');

        return { error: error.message, csvSections };
    }
})();
