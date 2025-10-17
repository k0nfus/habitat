export const QUICK_ACCESS_STORAGE_KEY = 'todoQuickAccessSettings';

export const defaultQuickAccessSettings = {
  enabled: true,
  widgetEnabled: true,
  statusBarEnabled: false,
  groupVisibility: {},
};

export const alignQuickAccessGroups = (settings, groups) => {
  const normalized = settings ? { ...defaultQuickAccessSettings, ...settings } : { ...defaultQuickAccessSettings };
  let changed = false;
  if (!normalized.enabled) {
    normalized.enabled = true;
    changed = true;
  }
  if (!normalized.widgetEnabled) {
    normalized.widgetEnabled = true;
    changed = true;
  }
  const nextVisibility = { ...normalized.groupVisibility };
  let groupsChanged = false;

  groups.forEach((group) => {
    const name = group.name || 'Allgemein';
    if (typeof nextVisibility[name] === 'undefined') {
      nextVisibility[name] = true;
      groupsChanged = true;
    }
  });

  Object.keys(nextVisibility).forEach((groupName) => {
    if (!groups.some((group) => (group.name || 'Allgemein') === groupName)) {
      delete nextVisibility[groupName];
      groupsChanged = true;
    }
  });

  const hasAnyVisibleGroup = Object.values(nextVisibility).some((value) => value === true);
  if (!hasAnyVisibleGroup && groups.length) {
    groups.forEach((group) => {
      const name = group.name || 'Allgemein';
      if (!nextVisibility[name]) {
        nextVisibility[name] = true;
      }
    });
    groupsChanged = true;
  }

  if (groupsChanged) {
    return {
      settings: { ...normalized, groupVisibility: nextVisibility },
      changed: true,
    };
  }

  return { settings: normalized, changed };
};
