const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/pages/FormPage.jsx', 'utf8');

try {
    parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'classProperties']
    });
    console.log('Syntax is valid!');
} catch (e) {
    console.error('Syntax Error:', e.message);
    console.error('Location:', e.loc);
}
