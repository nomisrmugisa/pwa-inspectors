
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

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Normalize string for better matching
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

try {
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvLines = csvContent.split('\n');
    const csvQuestions = [];

    csvLines.forEach((line, index) => {
        // Skip header
        if (index < 2) return;

        // Split by comma, first column is the question
        // Handle quoted CSV values? Simple split for now, assuming standard CSV
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const question = parts[0]?.trim();

        if (question && !question.startsWith('SECTION')) {
            csvQuestions.push({
                original: question.replace(/^"|"$/g, ''),
                line: index + 1
            });
        }
    });

    // Read Data Elements from Metadata
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    // Access nested structure: programStageDataElements -> dataElement -> displayName
    // Note: Structure might vary, checking the sampled content
    // In sample: programStageDataElements[].dataElement.displayName

    // Also, check "dataElements" top level if available, but assuming "programStageDataElements" for this specific program
    let dhis2Elements = [];

    if (metadata.programStageDataElements) {
        dhis2Elements = metadata.programStageDataElements.map(psde => psde.dataElement.displayName);
    } else if (metadata.dataElements) {
        dhis2Elements = metadata.dataElements.map(de => de.displayName);
    } else {
        console.error("Could not find dataElements in metadata");
        process.exit(1);
    }

    console.log(`Found ${csvQuestions.length} CSV questions and ${dhis2Elements.length} DHIS2 elements.`);
    console.log('\n--- MATCH REPORT ---');

    csvQuestions.forEach(q => {
        const normQ = normalize(q.original);

        // Find best match
        let bestMatch = null;
        let minDist = Infinity;

        dhis2Elements.forEach(d => {
            const normD = normalize(d);
            // Optimization: if simple inclusion
            if (normD.includes(normQ) || normQ.includes(normD)) {
                // Give bonus
                const dist = 0; // Or close to 0
                if (dist < minDist) {
                    minDist = dist;
                    bestMatch = d;
                }
            } else {
                const dist = levenshtein(normQ, normD);
                if (dist < minDist) {
                    minDist = dist;
                    bestMatch = d;
                }
            }
        });

        // Similarity score (0 to 1)
        const maxLen = Math.max(normQ.length, normalize(bestMatch).length);
        const score = 1 - (minDist / maxLen);

        if (score > 0.4) {
            console.log(`CSV Line ${q.line}: "${q.original}"`);
            console.log(`Best Match:   "${bestMatch}" (Score: ${score.toFixed(2)})`);
            console.log('---');
        } else {
            console.log(`CSV Line ${q.line}: "${q.original}"`);
            console.log(`NO GOOD MATCH FOUND (Best: "${bestMatch}", Score: ${score.toFixed(2)})`);
            console.log('---');
        }
    });

} catch (err) {
    console.error("Error:", err);
}
