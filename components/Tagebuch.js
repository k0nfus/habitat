import React, { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  Modal,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import AddButton from './AddButton';
import { useTheme } from '../theme';
import { DATA_VERSION, defaultDiarySettings } from '../constants/diaryDefaults';

const ENTRY_STORAGE_KEY = 'diaryEntriesV2';
const SETTINGS_STORAGE_KEY = 'diarySettings';
const VERSION_STORAGE_KEY = 'diaryDataVersion';

const ICONS = {
  daily: require('../assets/Tag.png'),
  weekly: require('../assets/Woche.png'),
  monthly: require('../assets/Monat.png'),
};

const ENTRY_TITLES = {
  daily: 'Täglicher Eintrag',
  weekly: 'Wöchentlicher Rückblick',
  monthly: 'Monatliche Reflexion',
};

const getBerlinDate = () => {
  const now = new Date();
  const berlinString = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
  return new Date(berlinString);
};

const getDailyKey = (date) => date.toISOString().split('T')[0];

const getWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeSettings = (base, override) => {
  if (!override) return clone(base);
  const merged = clone(base);
  Object.keys(override).forEach((key) => {
    const baseValue = merged[key];
    const overrideValue = override[key];
    if (Array.isArray(overrideValue)) {
      merged[key] = overrideValue.map((item) => (typeof item === 'object' ? { ...item } : item));
    } else if (overrideValue && typeof overrideValue === 'object') {
      merged[key] = mergeSettings(baseValue || {}, overrideValue);
    } else {
      merged[key] = overrideValue;
    }
  });
  return merged;
};

const getFieldDefinitions = (settings, type) => {
  if (type === 'daily') {
    return settings.daily.fields.map((field) => ({ ...field, type: 'text' }));
  }
  if (type === 'weekly') {
    return [
      ...settings.weekly.ratingFields.map((field) => ({ ...field, type: 'rating' })),
      ...settings.weekly.textFields.map((field) => ({ ...field, type: 'text' })),
    ];
  }
  return [
    ...settings.monthly.ratingFields.map((field) => ({ ...field, type: 'rating' })),
    ...settings.monthly.textFields.map((field) => ({ ...field, type: 'text' })),
  ];
};

const createEntryFromSettings = (type, settings, date = getBerlinDate()) => {
  const definitions = getFieldDefinitions(settings, type).filter((field) => field.enabled);
  const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  return {
    id,
    type,
    date: date.toISOString(),
    periodKey: type === 'daily' ? getDailyKey(date) : type === 'weekly' ? getWeekKey(date) : getMonthKey(date),
    fields: definitions.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      value: field.type === 'rating' ? 3 : '',
    })),
  };
};

const mergeEntryWithSettings = (entry, settings) => {
  const definitions = getFieldDefinitions(settings, entry.type);
  const definitionMap = definitions.reduce((acc, field) => {
    acc[field.id] = field;
    return acc;
  }, {});

  const mergedFields = entry.fields
    .map((field) => {
      const definition = definitionMap[field.id];
      if (!definition || !definition.enabled) {
        return null;
      }
      return {
        ...field,
        label: definition.label,
        type: definition.type,
        value:
          definition.type === 'rating'
            ? typeof field.value === 'number'
              ? field.value
              : parseInt(field.value, 10) || 3
            : field.value ?? '',
      };
    })
    .filter(Boolean);

  const existingIds = mergedFields.map((field) => field.id);
  const missingFields = definitions
    .filter((definition) => definition.enabled && !existingIds.includes(definition.id))
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      type: definition.type,
      value: definition.type === 'rating' ? 3 : '',
    }));

  return {
    ...entry,
    fields: [...mergedFields, ...missingFields],
  };
};

export default function Tagebuch() {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(defaultDiarySettings);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [entryQueue, setEntryQueue] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const version = await AsyncStorage.getItem(VERSION_STORAGE_KEY);
        if (version !== DATA_VERSION) {
          await AsyncStorage.multiRemove(['diaryEntries', 'diaryTemplate', ENTRY_STORAGE_KEY]);
          await AsyncStorage.setItem(VERSION_STORAGE_KEY, DATA_VERSION);
        }

        const [storedEntries, storedSettings] = await Promise.all([
          AsyncStorage.getItem(ENTRY_STORAGE_KEY),
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
        ]);

        if (storedSettings) {
          setSettings(mergeSettings(defaultDiarySettings, JSON.parse(storedSettings)));
        } else {
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultDiarySettings));
        }

        if (storedEntries) {
          setEntries(JSON.parse(storedEntries));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Tagebuchdaten', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!entryQueue.length) return;
    const [nextEntry, ...rest] = entryQueue;
    setCurrentEntry(nextEntry);
    setEntryQueue(rest);
    setModalVisible(true);
  }, [entryQueue]);

  const saveEntries = async (newEntries) => {
    try {
      const sorted = [...newEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(sorted);
      await AsyncStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(sorted));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge', error);
    }
  };

  const handleSaveEntry = (entryToSave) => {
    const merged = mergeEntryWithSettings(entryToSave, settings);
    const updatedEntries = entries.some((entry) => entry.id === merged.id)
      ? entries.map((entry) => (entry.id === merged.id ? merged : entry))
      : [merged, ...entries];

    saveEntries(updatedEntries);
    if (entryQueue.length) {
      const [nextEntry, ...rest] = entryQueue;
      setCurrentEntry(nextEntry);
      setEntryQueue(rest);
    } else {
      setModalVisible(false);
      setCurrentEntry(null);
    }
  };

  const ensureSettingsSynced = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettings(mergeSettings(defaultDiarySettings, JSON.parse(storedSettings)));
      } else {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultDiarySettings));
        setSettings(defaultDiarySettings);
      }
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Einstellungen', error);
    }
  };

  const hasEntryForPeriod = (type, periodKey) => entries.some((entry) => entry.type === type && entry.periodKey === periodKey);

  const handleNewEntry = async () => {
    await ensureSettingsSynced();
    const berlinNow = getBerlinDate();
    const queue = [];

    const dailyDefinitions = getFieldDefinitions(settings, 'daily').filter((field) => field.enabled);
    if (dailyDefinitions.length) {
      queue.push(createEntryFromSettings('daily', settings, berlinNow));
    }

    const isSunday = berlinNow.getDay() === 0;
    const isFirstDay = berlinNow.getDate() === 1;

    if (settings.weekly.enabled && settings.weekly.autoCreate && isSunday) {
      const weekKey = getWeekKey(berlinNow);
      if (!hasEntryForPeriod('weekly', weekKey)) {
        queue.push(createEntryFromSettings('weekly', settings, berlinNow));
      }
    }

    if (settings.monthly.enabled && settings.monthly.autoCreate && isFirstDay) {
      const monthKey = getMonthKey(berlinNow);
      if (!hasEntryForPeriod('monthly', monthKey)) {
        queue.push(createEntryFromSettings('monthly', settings, berlinNow));
      }
    }

    if (!queue.length) {
      Alert.alert('Hinweis', 'Es sind keine aktiven Felder für neue Einträge konfiguriert.');
      return;
    }

    setEntryQueue(queue);
  };

  const editEntry = async (id) => {
    await ensureSettingsSynced();
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const merged = mergeEntryWithSettings(entry, settings);
    setCurrentEntry(merged);
    setModalVisible(true);
  };

  const deleteEntry = (id) => {
    Alert.alert('Eintrag löschen', 'Möchtest du diesen Eintrag wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          const updatedEntries = entries.filter((entry) => entry.id !== id);
          saveEntries(updatedEntries);
        },
      },
    ]);
  };

  const updateFieldValue = (fieldId, value) => {
    setCurrentEntry((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((field) => (field.id === fieldId ? { ...field, value } : field)),
      };
    });
  };

  const renderEntryField = (field) => {
    if (field.type === 'rating') {
      return (
        <View
          key={field.id}
          style={[styles.field, { backgroundColor: theme.surfaceAlt, borderColor: theme.surfaceBorder }]}
        >
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{field.label}</Text>
            <Text style={[styles.ratingValue, { color: theme.accent }]}>{field.value}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={field.value || 3}
            onValueChange={(value) => updateFieldValue(field.id, value)}
            minimumTrackTintColor={theme.accent}
            maximumTrackTintColor={theme.surfaceBorder}
            thumbTintColor={theme.accentSecondary}
          />
          <View style={styles.sliderScale}>
            {[1, 2, 3, 4, 5].map((val) => (
              <Text key={val} style={[styles.sliderScaleText, { color: theme.textSecondary }]}>{val}</Text>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View
        key={field.id}
        style={[styles.field, { backgroundColor: theme.surfaceAlt, borderColor: theme.surfaceBorder }]}
      >
        <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{field.label}</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
              borderColor: theme.inputBorder,
            },
          ]}
          multiline
          value={field.value}
          onChangeText={(value) => updateFieldValue(field.id, value)}
        />
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => editEntry(item.id)}
      onLongPress={() => deleteEntry(item.id)}
      style={[styles.entry, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
    >
      <View style={styles.entryHeader}>
        <Image source={ICONS[item.type]} style={styles.entryIcon} />
        <View style={styles.entryMeta}>
          <Text style={[styles.entryTitle, { color: theme.textPrimary }]}>{ENTRY_TITLES[item.type]}</Text>
          <Text style={[styles.entryDate, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
        </View>
      </View>
      {item.fields && item.fields.length > 0 && (
        <Text style={[styles.entryPreview, { color: theme.textSecondary }]}>
          {item.fields.find((field) => field.type === 'text' && field.value)?.value?.slice(0, 120) ||
            'Tippe, um den Eintrag zu bearbeiten.'}
        </Text>
      )}
    </Pressable>
  );

  const modalContent = useMemo(() => {
    if (!currentEntry) return null;
    return (
      <LinearGradient colors={theme.backgroundGradient} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={styles.modalHeader}>
            <Image source={ICONS[currentEntry.type]} style={styles.modalIcon} />
            <View>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{ENTRY_TITLES[currentEntry.type]}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{formatDate(currentEntry.date)}</Text>
            </View>
          </View>
          {currentEntry.fields.map(renderEntryField)}
        </ScrollView>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => {
              setModalVisible(false);
              setCurrentEntry(null);
              setEntryQueue([]);
            }}
            style={[styles.secondaryButton, { borderColor: theme.surfaceBorder }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Abbrechen</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSaveEntry(currentEntry)}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Speichern</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }, [currentEntry, theme]);

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.main}>
      <View style={styles.contentview}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={styles.buttonview}>
        <AddButton onPress={handleNewEntry} title="Neuer Eintrag" />
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        {modalContent}
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  contentview: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
    gap: 16,
  },
  entry: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  entryMeta: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryDate: {
    fontSize: 14,
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonview: {
    padding: 16,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  modalIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
  },
  field: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderScaleText: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
