import fs from 'fs';
import path from 'path';

/**
 * Script to fetch the latest DHIS2 metadata for the Inspections program stage.
 * 
 * Usage:
 * node scripts/fetch-metadata.js <username> <password>
 */

const SERVER_URL = 'https://qimsdev.5am.co.bw/qims';
const PROGRAM_STAGE_ID = 'Eupjm3J0dt2';
const OUTPUT_FILE = 'dhis2_full_metadata_v2.json';

async function fetchMetadata() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('❌ Error: Username and password are required.');
        console.log('Usage: node scripts/fetch-metadata.js <username> <password>');
        process.exit(1);
    }

    const [username, password] = args;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    console.log(`🌐 Fetching metadata from ${SERVER_URL}...`);
    console.log(`📋 Program Stage ID: ${PROGRAM_STAGE_ID}`);

    const fields = [
        'id',
        'name',
        'displayName',
        'description',
        'sortOrder',
        'repeatable',
        'programStageSections[id,name,displayName,sortOrder,dataElements[id,formName,displayFormName,name,displayName,shortName,code,description,valueType,compulsory,allowProvidedElsewhere,lastUpdated,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]',
        'programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,formName,displayFormName,name,displayName,shortName,code,description,valueType,aggregationType,lastUpdated,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]'
    ].join(',');

    const url = `${SERVER_URL}/api/programStages/${PROGRAM_STAGE_ID}?fields=${fields}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();

        // Wrap the result in the expected format (if needed)
        // The previous scripts seemed to expect a top-level key or direct access.
        // Let's save it directly.

        const outputPath = path.resolve(OUTPUT_FILE);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`✅ Metadata successfully saved to ${OUTPUT_FILE}`);
        console.log(`📊 Fetched ${data.programStageSections?.length || 0} sections and ${data.programStageDataElements?.length || 0} data elements.`);
    } catch (error) {
        console.error('❌ Failed to fetch metadata:', error.message);
        process.exit(1);
    }
}

fetchMetadata();
