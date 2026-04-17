const fs = require('fs');
const file = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let content = fs.readFileSync(file, 'utf8');

// Ah, they were already defined but earlier I had mistakenly overwritten the render function.
// Let's just restore the file from the original backup completely, and THEN replace the render part.
let orig = fs.readFileSync('original_workspace.tsx', 'utf8');

const splitOrig = orig.split('  if (!c) {');
if(splitOrig.length !== 2) {
    console.error("Could not find the start of render block in original");
    process.exit(1);
}

const beforeRender = splitOrig[0];

// We need the new render from `content`
const splitContent = content.split('  if (!c) {');
const newRender = '  if (!c) {' + splitContent[splitContent.length - 1]; // take the last one in case there are duplicates

fs.writeFileSync(file, beforeRender + newRender);
console.log("Restored original state and re-applied UI.");
