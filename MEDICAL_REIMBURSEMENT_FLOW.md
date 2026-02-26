# Medical Reimbursement UX and Design Flow Specification

## 1. Purpose and Scope
This document defines the complete end-to-end design and interaction flow for the AIS Medical Reimbursement module implemented in:
- `src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx`
- `src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/medical-case-workspace-client.tsx`
- `src/app/(officer)/(ais-officer)/reimbursement/medical/storage.ts`

This covers:
- visual layout
- element placement
- labels and controls
- user actions
- data auto-population logic
- state/status progression
- print and PDF outputs

## 2. IA and Navigation Map
1. Dashboard/Services entry -> Medical Reimbursement list
2. List page actions:
- New Reimbursement
- Open existing case
- Track Processing shortcut
- Download Summary
3. Workspace steps:
- 1. My Details
- 2. Treatment
- 3. Documents
- 4. Advance
- 5. Preview & Submit

Route behavior:
- Static-safe route: `/reimbursement/medical/case`
- Active MR context from session storage key: `medical_reimbursement_active_mr`

## 3. Global Visual Language
## 3.1 Theme tokens and style direction
- Primary look: indigo gradient (`from-indigo-900 via-indigo-500 to-indigo-900`)
- Card shells: rounded (`rounded-xl`/`rounded-2xl`), light border in light mode, neutral border in dark mode
- Header glow accents: circular blurred overlays (right-top and left-bottom)
- Text hierarchy:
- H1: section title
- H2/H3: module and sub-section titles
- Label text: `text-xs`
- Data text: `text-sm`

## 3.2 Responsive structure
- Desktop: multi-column cards and split content panes
- Tablet/mobile: stacks and wraps
- Tables in document section remain scannable with compact controls

## 4. List Page Design and Elements (`medical/page.tsx`)
## 4.1 Top Header Banner
Placement:
- Full-width module hero card at top

Elements:
- Left:
- Title: `Medical Reimbursement`
- Subtitle: `Track claims, upload bills, request advance, and submit settlement.`
- Right:
- Summary chip: `Claim Value: Rs {totalAmount}`
- CTA button: `New Reimbursement`

Interactions:
- `New Reimbursement`:
- generates MR ID
- initializes local case with default structure
- stores active MR in session storage
- navigates to `/reimbursement/medical/case`

## 4.2 Stat Cards Row
Placement:
- below hero, 4-card row (responsive)

Cards:
- Active Drafts
- Advance Pending
- Need Action
- Paid & Closed

Behavior:
- card click toggles list filter by status
- active filter card has visible highlight ring/border

## 4.3 Cases Table/Responsive Cards Section
Container:
- bordered section with header and controls

Header area:
- Title: `Your Reimbursement Cases`
- Subtitle: `Distinct status tracking, quick filtering, and faster actions.`
- Action: `Reset Filters`

Filter controls row:
- Search input: `Search MR No, claim type, hospital`
- Claim filter dropdown
- Sort dropdown (`Newest`, `Oldest`, `Amount High`, `Amount Low`)
- Page size dropdown

Status Filter strip:
- label: `Status Filter`
- mobile: select dropdown
- desktop: pill button row for all statuses

Data area (desktop table):
Columns:
1. MR No. & Date
2. Claim For
3. Hospital/Treatment
4. Financial Summary
5. Status
6. Actions

Actions cell:
- Primary button (contextual, e.g. Continue/Submit/Track)
- Three-dot menu button
- Expand menu options:
- Open Case
- Track Processing
- Download Summary

Responsive cards (mobile/tablet):
- same data in stacked card format
- preserves primary action + open + menu

Pagination footer:
- `Showing X to Y of Z results`
- previous/next and page controls

## 5. Workspace Page Design and Elements (`medical/[mrId]/medical-case-workspace-client.tsx`)
## 5.1 Workspace Header Card
Placement:
- top of workspace

Elements:
- Module text: `Medical Reimbursement Workspace`
- MR number
- Created/Updated date
- Status chip
- Save Draft button

## 5.2 Step Navigation Row
Placement:
- under header, 5 equal step buttons

Buttons:
- `1. My Details`
- `2. Treatment`
- `3. Documents`
- `4. Advance`
- `5. Preview & Submit`

Behavior:
- active step has gradient fill and contrast highlight

## 6. Step 1: My Details
Layout:
- two cards in two-column desktop layout

## 6.1 Card A: Officer Details (Auto-populated)
Fields (read-only):
- Name
- PEN
- Email
- Mobile
- Cadre
- Batch
- Current Role
- Grade / Scale

Data source priority:
1. `/officer/officer-preview` payload (`officer_data`)
2. `profileData` + `service_details` from session storage
3. `user_details` fallback

Current service selection:
- current/latest row chosen by date/flag ranking logic

## 6.2 Card B: Claim Person
Controls:
- toggle buttons: `Self`, `Dependent`

Dependent mode:
- dependent dropdown
- details panel:
- Name
- Relation
- DOB
- Gender

Dependent source merge:
- preview API `family`
- SPARK `family_details`
- DB `family_info`
- deduped by name+relation

## 7. Step 2: Treatment (Reduced Entry + Max Auto-fill)
Design goal:
- minimal manual fields
- avoid irrelevant empanelment entries
- auto-derived summary heads

Manual/required fields:
- Hospital Name
- Diagnosis
- Place at which illness occurred
- Whether Hospitalized (`Yes/No`)
- From Date
- To Date
- Hospital Address
- Notes
- Declaration Date

Auto-populated read-only fields:
- Service (IAS/IPS/IFS)
- Name of Patient
- Relationship with Member
- Present Posting / Office Address
- Residential Address
- Declaration Place

Auto-derived read-only amount heads from bills:
- Consultation Charges
- Investigation Charges
- Medicine Charges
- Hospital Charges
- Other Charges
- Total Amount Claimed

Essentiality source note block:
- informs user that certificate data is derived from diagnosis/hospital/treatment period + bill OCR rows
- displays auto row count and computed auto total

## 8. Step 3: Documents
Layout:
- split panel: left (table/list), right (preview/editor)

## 8.1 Bills and OCR Section
Header controls:
- title: `Bills & OCR Details`
- button: `Add Bill/Invoice`

Bills table columns:
- Bill File
- Hospital
- Amount
- Actions (edit/select, delete)

Behavior:
- selecting a row opens OCR editor in side panel
- OCR fields editable:
- Invoice No
- Invoice Date
- Hospital
- Amount
- Description

## 8.2 Other Supporting Docs
- upload button: `Add Other Document`
- list with preview link (if available) and remove button

## 8.3 Totals Card
- Total Bill Amount
- Total Advance
- Net Claim

## 9. Step 4: Advance (Professional Form Flow)
Layout:
- two columns: form + submitted requests

## 9.1 Advance Request Form
Fields:
- Requested Amount (Rs)
- Expected Need By (date)
- Hospital / Treatment Center
- Reason / Estimate Summary
- Estimate document upload + preview

Submission:
- button: `Submit Advance Request`
- validation: amount > 0 and reason required

Saved request payload includes:
- ADV ID
- date
- amount
- reason
- hospital
- expected-by date
- estimate doc metadata and preview
- status

## 9.2 Submitted Advance Requests List
Each request card:
- ADV ID
- status badge
- requested date
- amount
- hospital
- reason
- estimate doc link (if uploaded)
- status select (`Submitted`, `Paid`, `Rejected`)

Calculation impact:
- advance totals feed net claim summary across module

## 10. Step 5: Preview and Submit
## 10.1 Submission Readiness Strip
Cards:
- Officer details available
- Treatment completed
- Bills uploaded
- Net claim ready

## 10.2 Request Form Preview Block
Structured preview includes:
- Officer details subsection
- Claim and treatment subsection
- Financial summary grid
- Declaration preview

## 10.3 Preview Downloads and Print
Actions:
- Print Preview
- Request PDF
- Essentiality Certificate PDF
- Merged Submission Packet

## 10.4 Final Submission (eSign)
Inputs:
- Signer Name
- consent checkbox (`submit using OTP based eSign`)

Action:
- `Submit Final Claim`
- confirmation modal with MR ID, signer, net claim
- note: OTP-based eSign verification message

## 11. PDF Output Design
## 11.1 Request PDF
Contains:
- AIS Medical reimbursement form sections
- officer/service/patient/treatment fields
- expenditure head totals
- advance and net values
- declaration + eSign status/signer

## 11.2 Essentiality PDF
Auto-filled from general details + bills:
- officer/service + treatment period
- diagnosis as patient condition
- hospitalization derived from treatment flag
- medicine/investigation statement rows from bills
- total amount

Signature/certification zone:
- rendered as formal blanks (no duplicate entry form in UI)

## 11.3 Submission Packet PDF
Contains:
- case header
- status
- claimant/treatment summary
- attached document/bill index

## 12. State and Status Lifecycle
Case status values:
- Draft
- Advance Pending
- Advance Paid
- Ready to Submit
- Final Submitted
- Approved
- Paid & Closed

Derived transitions:
- Draft -> Advance Pending (advance submitted)
- Draft/Advance Paid -> Ready to Submit (treatment + bill completeness)
- Ready to Submit -> Final Submitted (eSign confirm)

Primary action text auto-updates:
- Continue / Await Advance / Submit / Track

## 13. Accessibility and Usability Notes
- clear form labels and short field names
- read-only styling for auto-populated fields to reduce confusion
- high-contrast status chips and action buttons
- consistent button heights and border radii
- compact but distinguishable section boundaries

## 14. Data Source Priority (Autofill)
For claimant/service/address fields:
1. `GET /officer/officer-preview` -> `officer_data`
2. `sessionStorage.profileData` (`spark_data` + `officer_data` blocks)
3. `sessionStorage.service_details`
4. `sessionStorage.user_details`

For dependents:
1. preview `officer_data.family`
2. SPARK `family_details`
3. DB `family_info`

## 15. Files and Responsibilities
- List UX, filter, table/cards, new case creation:
- `src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx`
- Workspace step UI and interactions:
- `src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/medical-case-workspace-client.tsx`
- Types, local storage, MR generation, quota-safe persistence:
- `src/app/(officer)/(ais-officer)/reimbursement/medical/storage.ts`

## 16. QA Checklist (Pinpoint)
1. New Reimbursement creates MR and opens workspace
2. Cadre/Batch/Role/Grade/Scale are populated from current service context
3. Dependent dropdown shows merged saved dependents
4. Selecting dependent updates patient/relation fields automatically
5. Bill upload updates OCR table and totals
6. Expenditure heads auto-derive and stay read-only
7. Advance request requires amount+reason and stores estimate doc metadata
8. Advance status updates net claim correctly
9. Preview shows complete document blocks before submit
10. Request/Essentiality/Merged PDFs download correctly
11. Final submit requires signer + consent
12. List page filters/search/pagination/actions work on all breakpoints
13. Dark mode readability and borders are intact

## 17. Future Enhancements (Optional)
- integrate real OCR backend extraction
- map relation IDs to master relation names in reimbursement view
- server-backed draft/save and submission audit trail
- print CSS for strict A4 page break control
