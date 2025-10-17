import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultQuickAccessSettings,
  QUICK_ACCESS_STORAGE_KEY,
  alignQuickAccessGroups,
} from '../constants/todoQuickAccessDefaults';

const MODULE_NAME = 'TodoWidget';
const todoWidgetModule = NativeModulesProxy?.[MODULE_NAME];

const isAndroidWidgetAvailable = () => Platform.OS === 'android' && !!todoWidgetModule;

const normalizeTodos = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item, index) => ({
    id: item?.id || `${item?.group || 'Allgemein'}-${index}-${item?.text || ''}`,
    text: item?.text || '',
    completed: !!item?.completed,
    group: item?.group || 'Allgemein',
  }));
};

const buildWidgetPayload = (todos, quickAccessSettings, groups) => {
  const normalizedGroups = Array.isArray(groups) && groups.length
    ? groups.map((group) => group?.name || 'Allgemein')
    : ['Allgemein'];

  const groupVisibility = quickAccessSettings?.groupVisibility || {};
  const enabledGroups = Object.keys(groupVisibility).filter((group) => groupVisibility[group]);
  const allowedGroups = enabledGroups.length ? enabledGroups : normalizedGroups;

  const filtered = (todos || []).filter((item) => allowedGroups.includes(item.group || 'Allgemein'));

  const sorted = filtered
    .slice()
    .sort((a, b) => {
      if (a.completed === b.completed) {
        return (a.text || '').localeCompare(b.text || '');
      }
      return a.completed ? 1 : -1;
    });

  const maxItems = 3;
  const visibleItems = sorted.slice(0, maxItems).map((item) => ({
    id: item.id,
    text: item.text,
    completed: !!item.completed,
  }));

  const total = filtered.length;
  const done = filtered.filter((item) => item.completed).length;

  return {
    title: 'Habitat Aufgaben',
    subtitle: total ? `${done}/${total} erledigt` : 'Keine sichtbaren Aufgaben',
    items: visibleItems,
  };
};

export const syncTodoWidgetState = async (todos, quickAccessSettings, groups) => {
  if (!isAndroidWidgetAvailable()) {
    return;
  }

  try {
    const payload = buildWidgetPayload(todos, quickAccessSettings, groups);
    await todoWidgetModule?.setWidgetState?.(JSON.stringify(payload));
  } catch (error) {
    console.warn('Widget-Sync fehlgeschlagen', error);
  }
};

export const syncTodoWidgetFromStorage = async (overrideQuickAccessSettings) => {
  if (!isAndroidWidgetAvailable()) {
    return;
  }

  try {
    const [storedTodos, storedGroups, storedSettings] = await Promise.all([
      AsyncStorage.getItem('todoList'),
      AsyncStorage.getItem('todoGroups'),
      AsyncStorage.getItem(QUICK_ACCESS_STORAGE_KEY),
    ]);

    const parsedTodos = storedTodos ? JSON.parse(storedTodos) : [];
    const normalizedTodos = normalizeTodos(parsedTodos);

    const parsedGroups = storedGroups ? JSON.parse(storedGroups) : [];
    const normalizedGroups = parsedGroups.length
      ? parsedGroups
      : [{ name: 'Allgemein', order: 1, showIfEmpty: true }];

    const baseSettings = overrideQuickAccessSettings
      ? { ...defaultQuickAccessSettings, ...overrideQuickAccessSettings }
      : storedSettings
      ? { ...defaultQuickAccessSettings, ...JSON.parse(storedSettings) }
      : { ...defaultQuickAccessSettings };

    const { settings } = alignQuickAccessGroups(baseSettings, normalizedGroups);
    await syncTodoWidgetState(normalizedTodos, settings, normalizedGroups);
  } catch (error) {
    console.warn('Widget-Daten konnten nicht geladen werden', error);
  }
};

export const clearTodoWidget = async () => {
  if (!isAndroidWidgetAvailable()) {
    return;
  }

  try {
    await todoWidgetModule?.clearWidgetState?.();
  } catch (error) {
    console.warn('Widget konnte nicht geleert werden', error);
  }
};
