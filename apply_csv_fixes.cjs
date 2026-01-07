
const fs = require('fs');
const path = require('path');

// Configure paths
const csvPath = 'checklist-final.csv';
const outputPath = 'checklist-updated.csv';
const metadataPath = 'dhis2_full_metadata_v2.json';

// Simple Levenshtein distance
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
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

// Quote CSV string if it contains comma or quote
function quoteCsv(str) {
    if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`; // Escape quotes with double quotes
    }
    return str;
}

try {
    // Read Data Elements
    console.log("Reading metadata...");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    let dhis2Elements = [];

    // Extract both formName and displayName
    const extractElement = (de) => {
        const item = de.dataElement || de;
        // Prioritize formName, then displayFormName, then displayName
        const bestName = item.formName || item.displayFormName || item.displayName;
        return {
            id: item.id,
            matchName: bestName, // name to replace WITH
            searchName: bestName, // name to search FOR match against
            displayName: item.displayName
        };
    };

    if (metadata.programStageDataElements) {
        dhis2Elements = metadata.programStageDataElements.map(extractElement);
    } else if (metadata.dataElements) {
        dhis2Elements = metadata.dataElements.map(extractElement);
    }

    console.log(`Loaded ${dhis2Elements.length} DHIS2 elements.`);

    // Read CSV
    console.log(`Reading CSV: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvLines = csvContent.split(/\r?\n/);
    const updatedLines = [];
    let replacements = 0;

    csvLines.forEach((line, index) => {
        // Skip header lines (some headers might start with empty string)
        if (index < 2) {
            updatedLines.push(line);
            return;
        }

        // Parse line logic simplified (assumes Question is first column, then commas)
        // We need to parse carefully to preserve the rest of the line
        // Regex to separate first column from the rest
        // Matches: Start, optional quotes ("..."), then comma, then rest
        const match = line.match(/^(".*?"|[^,]*)(,.*)$/);

        if (!match) {
            // Probably empty line or weird format
            updatedLines.push(line);
            return;
        }

        let originalQuestion = match[1].trim();
        const restOfLine = match[2];

        // Remove quotes for processing
        let cleanQuestion = originalQuestion.replace(/^"|"$/g, '');

        // Skip sections
        if (!cleanQuestion || cleanQuestion.startsWith('SECTION')) {
            updatedLines.push(line);
            return;
        }

        // Fuzzy match
        const normQ = normalize(cleanQuestion);
        let bestMatch = null;
        let bestScore = 0;

        dhis2Elements.forEach(d => {
            const normD = normalize(d.searchName);
            let dist = levenshtein(normQ, normD);
            let score = 1 - (dist / Math.max(normQ.length, normD.length));
            if (score > bestScore) {
                bestScore = score;
                bestMatch = d;
            }
        });

        if (bestScore > 0.5) { // Confidence threshold lowered
            const newName = quoteCsv(bestMatch.matchName);
            if (newName !== originalQuestion && `"${cleanQuestion}"` !== newName) {
                // If it's different and not just a quoting difference
                if (bestScore < 0.7) {
                    console.log(`[Low Score ${bestScore.toFixed(2)}] Replacing: "${cleanQuestion.substring(0, 30)}..." -> "${bestMatch.matchName.substring(0, 30)}..."`);
                }
                updatedLines.push(`${newName}${restOfLine}`);
                replacements++;
            } else {
                updatedLines.push(line); // Already correct
            }
        } else {
            // No good match, keep original
            console.log(`[No Match ${bestScore.toFixed(2)}] "${cleanQuestion.substring(0, 40)}..."`);
            updatedLines.push(line);
        }
    });

    console.log(`Writing updated CSV to ${outputPath}`);
    console.log(`Made ${replacements} replacements.`);
    fs.writeFileSync(outputPath, updatedLines.join('\n'), 'utf8');

} catch (err) {
    console.error("Error:", err);
}
