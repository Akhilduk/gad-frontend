const TRACKED_PROGRESS_KEYS = [
  'personal',
  'profile_photo',
  'education',
  'service',
  'central_deputation',
  'training',
  'awards',
  'disability',
  'disciplinary',
];

const toStatusString = (status) => String(status ?? '').trim();

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getProfileCompletionPercentage = () => {
  if (typeof window === 'undefined') return 0;

  const rawProgress = sessionStorage.getItem('profile_completion');
  if (rawProgress) {
    const parsed = safeParseJson(rawProgress);
    if (parsed && typeof parsed === 'object') {
      const totals = TRACKED_PROGRESS_KEYS.reduce(
        (acc, key) => {
          const section = parsed[key];
          if (
            section &&
            typeof section.completed === 'number' &&
            typeof section.total === 'number'
          ) {
            acc.completed += section.completed;
            acc.total += section.total;
          }
          return acc;
        },
        { completed: 0, total: 0 }
      );

      if (totals.total > 0) {
        return Math.round((totals.completed / totals.total) * 100);
      }
    }
  }

  const legacyProgress = Number.parseInt(
    sessionStorage.getItem('profileProgress') || '',
    10
  );
  if (Number.isFinite(legacyProgress)) {
    return Math.min(100, Math.max(0, legacyProgress));
  }

  return 0;
};

export const isApprovedButIncomplete = (status) => {
  const normalizedStatus = toStatusString(status);
  return normalizedStatus === '3' && getProfileCompletionPercentage() < 100;
};

export const isProfileEditDisabledByStatus = (status) => {
  const normalizedStatus = toStatusString(status);
  if (normalizedStatus === '2') return true;
  if (normalizedStatus === '3') return !isApprovedButIncomplete(normalizedStatus);
  return false;
};
