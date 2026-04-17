const fs = require('fs');

const cssPath = 'src/modules/medical-reimbursement/mr.module.css';
let cssData = fs.readFileSync(cssPath, 'utf8');

const newCss = `

/* --- MODERN REDESIGN THEME --- */

.modernContainer {
  @apply min-h-screen p-6 transition-colors duration-300;
  background: linear-gradient(135deg, #f0f4f8 0%, #e0eaf5 100%);
}
:global(.dark) .modernContainer {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}

.modernHeader {
  @apply mb-8 flex items-center justify-between;
}
.modernTitle {
  @apply text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600;
}
:global(.dark) .modernTitle {
  @apply bg-gradient-to-r from-blue-400 to-indigo-400;
}

.modernCard {
  @apply bg-white rounded-2xl shadow-xl border border-blue-50 p-6 transition-all duration-300 hover:shadow-2xl;
}
:global(.dark) .modernCard {
  @apply bg-slate-800 border-slate-700 text-slate-200 shadow-none;
}

.modernCardHeader {
  @apply flex items-center justify-between mb-4 border-b border-gray-100 pb-3;
}
:global(.dark) .modernCardHeader {
  @apply border-slate-700;
}
.modernCardTitle {
  @apply text-lg font-bold text-gray-800 flex items-center gap-2;
}
:global(.dark) .modernCardTitle {
  @apply text-slate-100;
}

.modernGrid3 {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}
.modernGrid2 {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.modernLabel {
  @apply block text-sm font-medium text-gray-600 mb-1.5;
}
:global(.dark) .modernLabel {
  @apply text-slate-400;
}
.modernValue {
  @apply text-base font-semibold text-gray-900;
}
:global(.dark) .modernValue {
  @apply text-slate-200;
}

.modernInput {
  @apply w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none;
}
:global(.dark) .modernInput {
  @apply bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500 focus:ring-blue-900 focus:bg-slate-800;
}

.modernSelect {
  @apply w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none appearance-none;
}
:global(.dark) .modernSelect {
  @apply bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500 focus:ring-blue-900 focus:bg-slate-800;
}

.modernBtnPrimary {
  @apply inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95;
}
:global(.dark) .modernBtnPrimary {
  @apply focus:ring-offset-slate-900;
}

.modernBtnSecondary {
  @apply inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 active:scale-95;
}
:global(.dark) .modernBtnSecondary {
  @apply bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 focus:ring-slate-600 focus:ring-offset-slate-900;
}

.modernBtnDanger {
  @apply inline-flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 text-sm font-semibold transition-all active:scale-95;
}
:global(.dark) .modernBtnDanger {
  @apply bg-red-500/10 text-red-400 hover:bg-red-500/20;
}

.modernBadge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800;
}
:global(.dark) .modernBadge {
  @apply bg-blue-900/50 text-blue-300;
}
.modernBadgeSuccess {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800;
}
:global(.dark) .modernBadgeSuccess {
  @apply bg-green-900/50 text-green-300;
}
.modernBadgeWarning {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800;
}
:global(.dark) .modernBadgeWarning {
  @apply bg-yellow-900/50 text-yellow-300;
}

.modernTable {
  @apply min-w-full divide-y divide-gray-200;
}
:global(.dark) .modernTable {
  @apply divide-slate-700;
}
.modernTable th {
  @apply px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}
:global(.dark) .modernTable th {
  @apply bg-slate-800/50 text-slate-400;
}
.modernTable td {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}
:global(.dark) .modernTable td {
  @apply text-slate-300;
}
.modernTableRow {
  @apply bg-white hover:bg-gray-50 transition-colors;
}
:global(.dark) .modernTableRow {
  @apply bg-slate-800 hover:bg-slate-700/50;
}

.modernTabs {
  @apply flex space-x-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto;
}
:global(.dark) .modernTabs {
  @apply bg-slate-800;
}
.modernTab {
  @apply flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-600 transition-all text-center cursor-pointer hover:text-gray-900 hover:bg-white/50;
}
:global(.dark) .modernTab {
  @apply text-slate-400 hover:text-slate-200 hover:bg-slate-700;
}
.modernTabActive {
  @apply bg-white text-blue-600 shadow-sm;
}
:global(.dark) .modernTabActive {
  @apply bg-slate-900 text-blue-400;
}

.modernIconWrapper {
  @apply p-2 rounded-lg bg-blue-50 text-blue-600;
}
:global(.dark) .modernIconWrapper {
  @apply bg-blue-900/30 text-blue-400;
}

.modernPopupOverlay {
  @apply fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4;
}
.modernPopupContent {
  @apply bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-hidden flex flex-col;
}

/* Animations */
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animateSlideUp {
  animation: slideUpFade 0.4s ease-out forwards;
}

@keyframes pulseSubtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
.animatePulseSubtle {
  animation: pulseSubtle 2s infinite;
}

`;

if (!cssData.includes('modernContainer')) {
    fs.appendFileSync(cssPath, newCss);
}
