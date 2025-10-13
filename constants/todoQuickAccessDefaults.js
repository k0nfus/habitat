export const QUICK_ACCESS_STORAGE_KEY = 'todoQuickAccessSettings';

export const defaultQuickAccessSettings = {
  enabled: false,
  widgetEnabled: false,
  statusBarEnabled: false,
  groupVisibility: {},
};

export const alignQuickAccessGroups = (settings, groups) => {
  const normalized = settings ? { ...defaultQuickAccessSettings, ...settings } : { ...defaultQuickAccessSettings };
  const nextVisibility = { ...normalized.groupVisibility };
  let changed = false;

  groups.forEach((group) => {
    const name = group.name || 'Allgemein';
    if (typeof nextVisibility[name] === 'undefined') {
      nextVisibility[name] = false;
      changed = true;
    }
  });

  Object.keys(nextVisibility).forEach((groupName) => {
    if (!groups.some((group) => (group.name || 'Allgemein') === groupName)) {
      delete nextVisibility[groupName];
      changed = true;
    }
  });

  if (changed) {
    return {
      settings: { ...normalized, groupVisibility: nextVisibility },
      changed: true,
    };
  }

  return { settings: normalized, changed: false };
};
