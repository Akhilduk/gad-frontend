const fs = require('fs');

const css = fs.readFileSync('src/modules/medical-reimbursement/mr.module.css', 'utf8');

// The instruction: "fix the black white theme issue.and dark white toggle properly in these pages."
// suggests that the text colors or backgrounds might not be switching properly in dark mode.
// We need to ensure text is white on dark backgrounds, and black on light backgrounds.
// And inputs/selects have proper styles.
