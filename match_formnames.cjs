
const fs = require('fs');
const path = require('path');

// Configure paths
const csvPath = 'checklist for facilities.csv';
const metadataPath = 'dhis2_full_metadata_v2.json';

// Simple Levenshtein distance
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

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
                    Math.min(
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Normalize string
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
}

try {
    // Read CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvLines = csvContent.split('\n');
    const csvQuestions = [];

    csvLines.forEach((line, index) => {
        if (index < 2) return;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const question = parts[0]?.trim();

        if (question && !question.startsWith('SECTION')) {
            csvQuestions.push({
                original: question.replace(/^"|"$/g, ''),
                line: index + 1
            });
        }
    });

    // Read Data Elements
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    let dhis2Elements = [];

    // We want to capture both the display name (for reference) and the form name (for matching)
    const extractElement = (de) => {
        const item = de.dataElement || de;
        return {
            id: item.id,
            displayName: item.displayName,
            formName: item.formName || item.displayFormName || item.displayName, // Fallback chain
            rawFormName: item.formName // Just to see if it exists
        };
    };

    if (metadata.programStageDataElements) {
        dhis2Elements = metadata.programStageDataElements.map(extractElement);
    } else if (metadata.dataElements) {
        dhis2Elements = metadata.dataElements.map(extractElement);
    }

    console.log(`Found ${csvQuestions.length} CSV questions and ${dhis2Elements.length} DHIS2 elements.`);
    console.log('\n--- FORM NAME MATCH REPORT ---');

    let goodMatches = 0;

    csvQuestions.forEach(q => {
        const normQ = normalize(q.original);

        let bestMatch = null;
        let bestScore = 0;
        let matchedOn = '';

        dhis2Elements.forEach(d => {
            // Check against FormName
            const normFormName = normalize(d.formName);
            // Check against DisplayName (fallback)
            const normDisplayName = normalize(d.displayName);

            // Calculate score for FormName
            let distF = levenshtein(normQ, normFormName);
            let scoreF = 1 - (distF / Math.max(normQ.length, normFormName.length));

            // Calculate score for DisplayName
            let distD = levenshtein(normQ, normDisplayName);
            let scoreD = 1 - (distD / Math.max(normQ.length, normDisplayName.length));

            if (scoreF > bestScore) {
                bestScore = scoreF;
                bestMatch = d;
                matchedOn = 'FormName';
            }
            // Also update if display name is significantly better (unlikely if user is right, but good safety)
            if (scoreD > bestScore) {
                bestScore = scoreD;
                bestMatch = d;
                matchedOn = 'DisplayName';
            }
        });

        if (bestScore > 0.6) { // Stricter threshold check
            goodMatches++;
            console.log(`CSV Line ${q.line}: "${q.original}"`);
            console.log(`MATCH (${matchedOn}): "${matchedOn === 'FormName' ? bestMatch.formName : bestMatch.displayName}"`);
            console.log(`(DHIS2 Name: ${bestMatch.displayName})`)
            console.log(`Score: ${bestScore.toFixed(2)}`);
            console.log('---');
        } else {
            console.log(`CSV Line ${q.line}: "${q.original}"`);
            console.log(`NO MATCH FOUND (Best: "${bestMatch?.formName || 'N/A'}", Score: ${bestScore.toFixed(2)})`);
            console.log('---');
        }
    });

    console.log(`Total Good Matches: ${goodMatches} / ${csvQuestions.length}`);

} catch (err) {
    console.error("Error:", err);
}
