const MR_CASE_KEY = 'mr_active_case_id';
const MR_ADVANCE_KEY = 'mr_active_advance_id';

const canUseStorage = () => typeof window !== 'undefined';

export function setActiveMrCaseId(mrId: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(MR_CASE_KEY, mrId);
}

export function getActiveMrCaseId() {
  if (!canUseStorage()) return '';
  return sessionStorage.getItem(MR_CASE_KEY) || '';
}

export function setActiveAdvanceId(advId: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(MR_ADVANCE_KEY, advId);
}

export function getActiveAdvanceId() {
  if (!canUseStorage()) return '';
  return sessionStorage.getItem(MR_ADVANCE_KEY) || '';
}
