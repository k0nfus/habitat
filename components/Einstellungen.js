import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { defaultDiarySettings } from '../constants/diaryDefaults';
import {
  defaultQuickAccessSettings,
  QUICK_ACCESS_STORAGE_KEY,
  alignQuickAccessGroups,
} from '../constants/todoQuickAccessDefaults';
import { syncTodoWidgetFromStorage } from '../utils/todoWidget';

const SETTINGS_STORAGE_KEY = 'diarySettings';

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeSettings = (base, override) => {
  if (!override) return clone(base);
  const merged = clone(base);
  Object.keys(override).forEach((key) => {
    const overrideValue = override[key];
    if (Array.isArray(overrideValue)) {
      merged[key] = overrideValue.map((item) => (typeof item === 'object' ? { ...item } : item));
    } else if (overrideValue && typeof overrideValue === 'object') {
      merged[key] = mergeSettings(base[key] || {}, overrideValue);
    } else {
      merged[key] = overrideValue;
    }
  });
  return merged;
};

export default function Einstellungen() {
  const { theme, mode, setMode } = useTheme();
  const [selectedStartseite, setSelectedStartseite] = useState('Tagebuch');
  const [goalWeight, setGoalWeight] = useState('');
  const [minSteps, setMinSteps] = useState('');
  const [groups, setGroups] = useState([]);
  const [diarySettings, setDiarySettings] = useState(() => clone(defaultDiarySettings));
  const [quickAccessSettings, setQuickAccessSettings] = useState(defaultQuickAccessSettings);
  const [dailyModalVisible, setDailyModalVisible] = useState(false);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedStartseite,
          savedGoalWeight,
          savedMinSteps,
          savedGroups,
          savedDiarySettings,
          savedQuickAccessSettings,
        ] = await Promise.all([
          AsyncStorage.getItem('startseite'),
          AsyncStorage.getItem('goalWeight'),
          AsyncStorage.getItem('minSteps'),
          AsyncStorage.getItem('todoGroups'),
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(QUICK_ACCESS_STORAGE_KEY),
        ]);

        if (savedStartseite) setSelectedStartseite(savedStartseite);
        if (savedGoalWeight) setGoalWeight(savedGoalWeight);
        if (savedMinSteps) setMinSteps(savedMinSteps);
        let loadedGroups;
        if (savedGroups) {
          const parsed = JSON.parse(savedGroups);
          loadedGroups = parsed.length ? parsed : defaultGroups();
          setGroups(loadedGroups);
        } else {
          const defaults = defaultGroups();
          loadedGroups = defaults;
          setGroups(defaults);
          await AsyncStorage.setItem('todoGroups', JSON.stringify(defaults));
        }
        if (savedDiarySettings) {
          setDiarySettings(mergeSettings(defaultDiarySettings, JSON.parse(savedDiarySettings)));
        } else {
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultDiarySettings));
        }
        let resolvedQuickAccessSettings;
        if (savedQuickAccessSettings) {
          const parsed = JSON.parse(savedQuickAccessSettings);
          const { settings } = alignQuickAccessGroups(parsed, loadedGroups || defaultGroups());
          resolvedQuickAccessSettings = settings;
        } else {
          const { settings } = alignQuickAccessGroups(defaultQuickAccessSettings, loadedGroups || defaultGroups());
          resolvedQuickAccessSettings = settings;
          await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
        }
        setQuickAccessSettings(resolvedQuickAccessSettings);
        syncTodoWidgetFromStorage(resolvedQuickAccessSettings).catch((error) =>
          console.warn('Widget konnte nicht aktualisiert werden', error)
        );
      } catch (error) {
        console.error('Fehler beim Laden der Einstellungen', error);
      }
    };

    loadSettings();
  }, []);

  const defaultGroups = () => [{ name: 'Allgemein', order: 1, showIfEmpty: true }];

  const saveStartseite = async (startseite) => {
    try {
      setSelectedStartseite(startseite);
      await AsyncStorage.setItem('startseite', startseite);
    } catch (error) {
      console.error('Fehler beim Speichern der Startseite', error);
    }
  };

  const saveGoalWeight = async (value) => {
    try {
      setGoalWeight(value);
      await AsyncStorage.setItem('goalWeight', value);
    } catch (error) {
      console.error('Fehler beim Speichern des Zielgewichts', error);
    }
  };

  const saveMinSteps = async (value) => {
    try {
      setMinSteps(value);
      await AsyncStorage.setItem('minSteps', value);
    } catch (error) {
      console.error('Fehler beim Speichern der Mindestschritte', error);
    }
  };

  const updateGroups = async (newGroups) => {
    setGroups(newGroups);
    await AsyncStorage.setItem('todoGroups', JSON.stringify(newGroups));
    setQuickAccessSettings((current) => {
      const { settings, changed } = alignQuickAccessGroups(current, newGroups);
      if (changed) {
        AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
      }
      syncTodoWidgetFromStorage(settings).catch((error) =>
        console.warn('Widget konnte nicht aktualisiert werden', error)
      );
      return settings;
    });
  };

  const handleGroupChange = (index, field, value) => {
    const updated = [...groups];
    if (field === 'order') {
      updated[index][field] = parseInt(value) || 0;
    } else if (field === 'showIfEmpty') {
      updated[index][field] = !updated[index][field];
    } else {
      updated[index][field] = value;
    }
    updateGroups(updated);
  };

  const persistQuickAccessSettings = async (settingsToSave) => {
    const normalized = {
      ...settingsToSave,
      enabled: true,
      widgetEnabled: true,
    };
    setQuickAccessSettings(normalized);
    await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(normalized));
    syncTodoWidgetFromStorage(normalized).catch((error) =>
      console.warn('Widget konnte nicht aktualisiert werden', error)
    );
  };

  const toggleQuickAccessOption = async (key) => {
    const next = { ...quickAccessSettings, [key]: !quickAccessSettings[key] };
    await persistQuickAccessSettings(next);
  };

  const toggleQuickAccessGroup = async (groupName) => {
    const currentValue = quickAccessSettings.groupVisibility[groupName];
    const next = {
      ...quickAccessSettings,
      groupVisibility: {
        ...quickAccessSettings.groupVisibility,
        [groupName]: !currentValue,
      },
    };
    await persistQuickAccessSettings(next);
  };

  const addGroup = () => {
    const newGroup = { name: '', order: groups.length + 1, showIfEmpty: true };
    updateGroups([...groups, newGroup]);
  };

  const deleteGroup = (index) => {
    if (groups.length === 1) {
      Alert.alert("Hinweis", "Mindestens eine Gruppe muss vorhanden sein.");
      return;
    }
    const updated = [...groups];
    updated.splice(index, 1);
    updateGroups(updated);
  };

  const persistDiarySettings = async (settingsToSave) => {
    setDiarySettings(settingsToSave);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
  };

  const handleFieldToggle = async (group, index) => {
    const updated = clone(diarySettings);
    if (group === 'daily') {
      updated.daily.fields[index].enabled = !updated.daily.fields[index].enabled;
    } else if (group === 'weeklyRating') {
      updated.weekly.ratingFields[index].enabled = !updated.weekly.ratingFields[index].enabled;
    } else if (group === 'weeklyText') {
      updated.weekly.textFields[index].enabled = !updated.weekly.textFields[index].enabled;
    } else if (group === 'monthlyRating') {
      updated.monthly.ratingFields[index].enabled = !updated.monthly.ratingFields[index].enabled;
    } else if (group === 'monthlyText') {
      updated.monthly.textFields[index].enabled = !updated.monthly.textFields[index].enabled;
    }
    await persistDiarySettings(updated);
  };

  const handleFieldLabelChange = async (group, index, label) => {
    const updated = clone(diarySettings);
    if (group === 'daily') {
      updated.daily.fields[index].label = label;
    } else if (group === 'weeklyRating') {
      updated.weekly.ratingFields[index].label = label;
    } else if (group === 'weeklyText') {
      updated.weekly.textFields[index].label = label;
    } else if (group === 'monthlyRating') {
      updated.monthly.ratingFields[index].label = label;
    } else if (group === 'monthlyText') {
      updated.monthly.textFields[index].label = label;
    }
    await persistDiarySettings(updated);
  };

  const handleWeeklyToggle = async (key) => {
    const updated = { ...diarySettings, weekly: { ...diarySettings.weekly, [key]: !diarySettings.weekly[key] } };
    await persistDiarySettings(updated);
  };

  const handleMonthlyToggle = async (key) => {
    const updated = { ...diarySettings, monthly: { ...diarySettings.monthly, [key]: !diarySettings.monthly[key] } };
    await persistDiarySettings(updated);
  };

  const renderToggleRow = (label, value, onValueChange) => (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
        thumbColor={value ? theme.accent : '#f4f3f4'}
      />
    </View>
  );

  const renderDailyEditorContent = () => (
    <View>
      {diarySettings.daily.fields.map((field, index) => (
        <View key={field.id} style={styles.fieldRow}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{`Feld ${index + 1}`}</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleFieldToggle('daily', index)}
              trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
              thumbColor={field.enabled ? theme.accent : '#f4f3f4'}
            />
          </View>
          <TextInput
            style={inputStyle}
            value={field.label}
            onChangeText={(value) => handleFieldLabelChange('daily', index, value)}
          />
        </View>
      ))}
    </View>
  );

  const renderWeeklyEditorContent = () => (
    <View>
      {renderToggleRow('Aktiviert', diarySettings.weekly.enabled, () => handleWeeklyToggle('enabled'))}
      {renderToggleRow('Automatisch am Sonntag erzeugen', diarySettings.weekly.autoCreate, () => handleWeeklyToggle('autoCreate'))}

      <Text style={[styles.fieldSectionTitle, { color: theme.textSecondary }]}>Bewertungen (1-5)</Text>
      {diarySettings.weekly.ratingFields.map((field, index) => (
        <View key={field.id} style={styles.fieldRow}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{`Bewertung ${index + 1}`}</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleFieldToggle('weeklyRating', index)}
              trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
              thumbColor={field.enabled ? theme.accent : '#f4f3f4'}
            />
          </View>
          <TextInput
            style={inputStyle}
            value={field.label}
            onChangeText={(value) => handleFieldLabelChange('weeklyRating', index, value)}
          />
        </View>
      ))}

      <Text style={[styles.fieldSectionTitle, { color: theme.textSecondary }]}>Freitextfelder</Text>
      {diarySettings.weekly.textFields.map((field, index) => (
        <View key={field.id} style={styles.fieldRow}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{`Frage ${index + 1}`}</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleFieldToggle('weeklyText', index)}
              trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
              thumbColor={field.enabled ? theme.accent : '#f4f3f4'}
            />
          </View>
          <TextInput
            style={inputStyle}
            value={field.label}
            onChangeText={(value) => handleFieldLabelChange('weeklyText', index, value)}
          />
        </View>
      ))}
    </View>
  );

  const renderMonthlyEditorContent = () => (
    <View>
      {renderToggleRow('Aktiviert', diarySettings.monthly.enabled, () => handleMonthlyToggle('enabled'))}
      {renderToggleRow('Automatisch am 1. erzeugen', diarySettings.monthly.autoCreate, () => handleMonthlyToggle('autoCreate'))}

      <Text style={[styles.fieldSectionTitle, { color: theme.textSecondary }]}>Bewertungen (1-5)</Text>
      {diarySettings.monthly.ratingFields.map((field, index) => (
        <View key={field.id} style={styles.fieldRow}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{`Bewertung ${index + 1}`}</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleFieldToggle('monthlyRating', index)}
              trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
              thumbColor={field.enabled ? theme.accent : '#f4f3f4'}
            />
          </View>
          <TextInput
            style={inputStyle}
            value={field.label}
            onChangeText={(value) => handleFieldLabelChange('monthlyRating', index, value)}
          />
        </View>
      ))}

      <Text style={[styles.fieldSectionTitle, { color: theme.textSecondary }]}>Freitextfelder</Text>
      {diarySettings.monthly.textFields.map((field, index) => (
        <View key={field.id} style={styles.fieldRow}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{`Frage ${index + 1}`}</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleFieldToggle('monthlyText', index)}
              trackColor={{ false: theme.surfaceBorder, true: theme.accentSecondary }}
              thumbColor={field.enabled ? theme.accent : '#f4f3f4'}
            />
          </View>
          <TextInput
            style={inputStyle}
            value={field.label}
            onChangeText={(value) => handleFieldLabelChange('monthlyText', index, value)}
          />
        </View>
      ))}
    </View>
  );

  const renderDiaryPreviewContent = () => {
    const activeDailyFields = diarySettings.daily.fields.filter((field) => field.enabled);
    const activeWeeklyRating = diarySettings.weekly.ratingFields.filter((field) => field.enabled);
    const activeWeeklyText = diarySettings.weekly.textFields.filter((field) => field.enabled);
    const activeMonthlyRating = diarySettings.monthly.ratingFields.filter((field) => field.enabled);
    const activeMonthlyText = diarySettings.monthly.textFields.filter((field) => field.enabled);

    const renderPreviewField = (label, key) => (
      <View key={key} style={styles.previewItem}>
        <Text style={[styles.previewLabel, { color: theme.textPrimary }]}>{label || 'Unbenanntes Feld'}</Text>
        <View style={[styles.previewInputLine, { borderColor: theme.surfaceBorder }]} />
      </View>
    );

    return (
      <ScrollView
        style={styles.previewScroll}
        contentContainerStyle={styles.previewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.previewDate, { color: theme.textSecondary }]}>01.01.2025</Text>
        <View style={styles.previewSection}>
          <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>Täglicher Eintrag</Text>
          {activeDailyFields.length ? (
            activeDailyFields.map((field, index) => renderPreviewField(field.label, `daily-${field.id}-${index}`))
          ) : (
            <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Keine Felder aktiviert.</Text>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>Wöchentlicher Rückblick</Text>
          {diarySettings.weekly.enabled ? (
            <>
              <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Bewertungsskala 1 – 5</Text>
              {activeWeeklyRating.length ? (
                activeWeeklyRating.map((field, index) => (
                  <View key={`weekly-rating-${field.id}-${index}`} style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: theme.textPrimary }]}>{field.label || 'Unbenannte Bewertung'}</Text>
                    <Text style={[styles.previewScale, { color: theme.textSecondary }]}>1   2   3   4   5</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Keine Bewertungen aktiviert.</Text>
              )}
              {activeWeeklyText.length ? (
                activeWeeklyText.map((field, index) => renderPreviewField(field.label, `weekly-text-${field.id}-${index}`))
              ) : (
                <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Keine Fragen aktiviert.</Text>
              )}
            </>
          ) : (
            <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Deaktiviert.</Text>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>Monatliche Reflexion</Text>
          {diarySettings.monthly.enabled ? (
            <>
              <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Bewertungsskala 1 – 5</Text>
              {activeMonthlyRating.length ? (
                activeMonthlyRating.map((field, index) => (
                  <View key={`monthly-rating-${field.id}-${index}`} style={styles.previewItem}>
                    <Text style={[styles.previewLabel, { color: theme.textPrimary }]}>{field.label || 'Unbenannte Bewertung'}</Text>
                    <Text style={[styles.previewScale, { color: theme.textSecondary }]}>1   2   3   4   5</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Keine Bewertungen aktiviert.</Text>
              )}
              {activeMonthlyText.length ? (
                activeMonthlyText.map((field, index) => renderPreviewField(field.label, `monthly-text-${field.id}-${index}`))
              ) : (
                <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Keine Fragen aktiviert.</Text>
              )}
            </>
          ) : (
            <Text style={[styles.previewHint, { color: theme.textSecondary }]}>Deaktiviert.</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const sectionStyle = [styles.settingView, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }];
  const textStyle = [styles.text, { color: theme.textPrimary }];
  const paragraphStyle = [styles.paragraph, { color: theme.textPrimary }];
  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.inputBackground,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
  ];
  const activeDailyCount = diarySettings.daily.fields.filter((field) => field.enabled).length;
  const activeWeeklyRatingCount = diarySettings.weekly.ratingFields.filter((field) => field.enabled).length;
  const activeWeeklyTextCount = diarySettings.weekly.textFields.filter((field) => field.enabled).length;
  const activeMonthlyRatingCount = diarySettings.monthly.ratingFields.filter((field) => field.enabled).length;
  const activeMonthlyTextCount = diarySettings.monthly.textFields.filter((field) => field.enabled).length;

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <ScrollView>
        <View style={sectionStyle}>
          <Text style={textStyle}>App-Theme</Text>
          <View style={styles.optionRow}>
            {['dark', 'light'].map((modeOption) => (
              <Pressable
                key={modeOption}
                onPress={() => setMode(modeOption)}
                style={[
                  styles.themeOption,
                  {
                    borderColor: mode === modeOption ? theme.accent : theme.surfaceBorder,
                    backgroundColor: mode === modeOption ? `${theme.accent}22` : theme.surface,
                  },
                ]}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>
                  {modeOption === 'dark' ? 'Dunkel' : 'Hell'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Startseite</Text>
          {['To-Do', 'Tagebuch', 'Tracking'].map((route) => (
            <Pressable key={route} onPress={() => saveStartseite(route)}>
              <View style={styles.option}>
                <Checkbox
                  style={styles.checkbox}
                  value={selectedStartseite === route}
                  onValueChange={() => saveStartseite(route)}
                  color={selectedStartseite === route ? theme.accent : undefined}
                />
                <Text style={paragraphStyle}>{route === 'To-Do' ? 'To-Do-Liste' : route}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Tägliche Eingabefelder</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {`${activeDailyCount} von ${diarySettings.daily.fields.length} Feldern aktiv.`}
          </Text>
          <Pressable
            onPress={() => setDailyModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Felder bearbeiten</Text>
          </Pressable>
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Wöchentlicher Rückblick</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {diarySettings.weekly.enabled
              ? `${activeWeeklyRatingCount} Bewertungen, ${activeWeeklyTextCount} Fragen aktiviert.`
              : 'Der wöchentliche Rückblick ist derzeit deaktiviert.'}
          </Text>
          <Pressable
            onPress={() => setWeeklyModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Inhalt bearbeiten</Text>
          </Pressable>
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Monatliche Reflexion</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {diarySettings.monthly.enabled
              ? `${activeMonthlyRatingCount} Bewertungen, ${activeMonthlyTextCount} Fragen aktiviert.`
              : 'Die monatliche Reflexion ist derzeit deaktiviert.'}
          </Text>
          <Pressable
            onPress={() => setMonthlyModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Inhalt bearbeiten</Text>
          </Pressable>
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Tagebuch-Vorschau</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Sieh dir einen Beispiel-Eintrag basierend auf deinen aktuellen Einstellungen an.
          </Text>
          <Pressable
            onPress={() => setPreviewModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Beispiel anzeigen</Text>
          </Pressable>
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>Tracking-Ziele</Text>
          <TextInput
            style={inputStyle}
            placeholder="Zielgewicht (kg)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={goalWeight}
            onChangeText={saveGoalWeight}
          />
          <TextInput
            style={inputStyle}
            placeholder="Mindestschritte"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={minSteps}
            onChangeText={saveMinSteps}
          />
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>To-Do-Schnellzugriff</Text>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Wähle, welche Gruppen im Homescreen-Widget und in anderen Schnellzugriffen außerhalb der App erscheinen sollen.
          </Text>
          <Text style={[styles.helperNote, { color: theme.textSecondary }]}>Das Homescreen-Widget ist immer aktiv.</Text>
          <Text style={[styles.helperNote, { color: theme.textSecondary }]}>Hinweis: In der Expo-Testumgebung stehen Widgets und Statusleisten-Einträge nicht zur Verfügung. Diese Funktion funktioniert erst in einem eigenständig installierten App-Build.</Text>
          {renderToggleRow(
            'Für Statusleiste vorbereiten',
            quickAccessSettings.statusBarEnabled,
            () => toggleQuickAccessOption('statusBarEnabled'),
          )}
          <Text style={[styles.fieldSectionTitle, { color: theme.textSecondary }]}>Freigegebene Gruppen</Text>
          {groups
            .sort((a, b) => a.order - b.order)
            .map((group) => {
              const groupName = group.name || 'Allgemein';
              return (
                <Pressable key={`quick-${groupName}`} onPress={() => toggleQuickAccessGroup(groupName)}>
                  <View style={styles.option}>
                    <Checkbox
                      style={styles.checkbox}
                      value={!!quickAccessSettings.groupVisibility[groupName]}
                      onValueChange={() => toggleQuickAccessGroup(groupName)}
                      color={quickAccessSettings.groupVisibility[groupName] ? theme.accent : undefined}
                    />
                    <Text style={paragraphStyle}>{groupName}</Text>
                  </View>
                </Pressable>
              );
            })}
        </View>

        <View style={sectionStyle}>
          <Text style={textStyle}>To-Do-Gruppen</Text>
          {groups
            .sort((a, b) => a.order - b.order)
            .map((group, index) => (
              <View key={index} style={styles.groupRow}>
                <TextInput
                  style={[inputStyle, { flex: 2 }]}
                  placeholder="Gruppenname"
                  placeholderTextColor={theme.textSecondary}
                  value={group.name}
                  onChangeText={(val) => handleGroupChange(index, 'name', val)}
                />
                <TextInput
                  style={[inputStyle, { flex: 1 }]}
                  keyboardType="numeric"
                  placeholder="Sort"
                  placeholderTextColor={theme.textSecondary}
                  value={group.order.toString()}
                  onChangeText={(val) => handleGroupChange(index, 'order', val)}
                />
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    value={group.showIfEmpty}
                    onValueChange={() => handleGroupChange(index, 'showIfEmpty')}
                    color={group.showIfEmpty ? theme.accent : undefined}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.textSecondary }]}>anzeigen</Text>
                </View>
                <Pressable onPress={() => deleteGroup(index)} style={styles.deleteButton}>
                  <Text style={[styles.deleteText, { color: theme.danger }]}>🗑</Text>
                </Pressable>
              </View>
            ))}
          <Pressable onPress={addGroup} style={[styles.secondaryButton, { borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Neue Gruppe hinzufügen</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={dailyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDailyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Tägliche Eingabefelder</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderDailyEditorContent()}
            </ScrollView>
            <Pressable
              onPress={() => setDailyModalVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: theme.buttonText }]}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={weeklyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWeeklyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Wöchentlicher Rückblick</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderWeeklyEditorContent()}
            </ScrollView>
            <Pressable
              onPress={() => setWeeklyModalVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: theme.buttonText }]}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={monthlyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMonthlyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Monatliche Reflexion</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderMonthlyEditorContent()}
            </ScrollView>
            <Pressable
              onPress={() => setMonthlyModalVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: theme.buttonText }]}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Beispiel-Tagebucheintrag</Text>
            <View style={styles.modalPreviewContainer}>{renderDiaryPreviewContent()}</View>
            <Pressable
              onPress={() => setPreviewModalVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: theme.buttonText }]}>Schließen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    width: '100%',
  },
  settingView: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    fontSize: 18,
    marginBottom: 14,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 16,
  },
  checkbox: {
    marginRight: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  checkboxLabel: {
    marginLeft: 4,
    fontSize: 12,
  },
  deleteButton: {
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 18,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  toggleRow: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  toggleLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  helperNote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalScroll: {
    maxHeight: 360,
    marginTop: 8,
  },
  modalScrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  modalCloseButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPreviewContainer: {
    marginTop: 8,
    maxHeight: 420,
    width: '100%',
    flexGrow: 1,
  },
  previewScroll: {
    maxHeight: 360,
    paddingHorizontal: 4,
  },
  previewContent: {
    paddingBottom: 20,
    gap: 16,
  },
  previewDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  previewSection: {
    gap: 12,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewItem: {
    gap: 6,
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewInputLine: {
    borderWidth: 1,
    borderRadius: 8,
    height: 38,
  },
  previewHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  previewScale: {
    fontSize: 14,
    letterSpacing: 6,
  },
});
