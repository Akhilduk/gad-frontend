export const STATIC_MR_ROUTE_PARAM = 'current';
export const STATIC_ADV_ROUTE_PARAM = 'current-advance';

const ACTIVE_MR_ID_KEY = 'mr_active_case_id';
const ACTIVE_ADV_ID_KEY = 'mr_active_advance_id';

const canUseSessionStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

export const getActiveMrId = () => {
  if (!canUseSessionStorage()) return '';
  return sessionStorage.getItem(ACTIVE_MR_ID_KEY) || '';
};

export const setActiveMrId = (mrId: string) => {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(ACTIVE_MR_ID_KEY, mrId);
};

export const getActiveAdvanceId = () => {
  if (!canUseSessionStorage()) return '';
  return sessionStorage.getItem(ACTIVE_ADV_ID_KEY) || '';
};

export const setActiveAdvanceId = (advId: string) => {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(ACTIVE_ADV_ID_KEY, advId);
};
