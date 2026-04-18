const fs = require('fs');

const pagePath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';
let pageData = fs.readFileSync(pagePath, 'utf8');

// If the page already has modernContainer, we might have done it. Let's check.
console.log('Includes modernContainer:', pageData.includes('modernContainer'));
