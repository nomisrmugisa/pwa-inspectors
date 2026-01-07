
const fs = require('fs');
const metadata = JSON.parse(fs.readFileSync('dhis2_full_metadata_v2.json', 'utf8'));

let names = [];
if (metadata.programStageDataElements) {
    names = metadata.programStageDataElements.map(x => x.dataElement.displayName);
} else if (metadata.dataElements) {
    names = metadata.dataElements.map(x => x.displayName);
}

fs.writeFileSync('dhis2_names.txt', names.join('\n'), 'utf8');
console.log('Wrote ' + names.length + ' names to dhis2_names.txt');
