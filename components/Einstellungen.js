import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
        if (savedQuickAccessSettings) {
          const parsed = JSON.parse(savedQuickAccessSettings);
          const { settings } = alignQuickAccessGroups(parsed, loadedGroups || defaultGroups());
          setQuickAccessSettings(settings);
        } else {
          const { settings } = alignQuickAccessGroups(defaultQuickAccessSettings, loadedGroups || defaultGroups());
          setQuickAccessSettings(settings);
          await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
        }
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
    setQuickAccessSettings(settingsToSave);
    await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settingsToSave));
  };

  const toggleQuickAccessEnabled = async () => {
    const next = {
      ...quickAccessSettings,
      enabled: !quickAccessSettings.enabled,
      widgetEnabled: quickAccessSettings.enabled ? false : quickAccessSettings.widgetEnabled,
      statusBarEnabled: quickAccessSettings.enabled ? false : quickAccessSettings.statusBarEnabled,
    };
    await persistQuickAccessSettings(next);
  };

  const toggleQuickAccessOption = async (key) => {
    if (!quickAccessSettings.enabled) return;
    const next = { ...quickAccessSettings, [key]: !quickAccessSettings[key] };
    await persistQuickAccessSettings(next);
  };

  const toggleQuickAccessGroup = async (groupName) => {
    if (!quickAccessSettings.enabled) return;
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

        <View style={sectionStyle}>
          <Text style={textStyle}>Wöchentlicher Rückblick</Text>
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

        <View style={sectionStyle}>
          <Text style={textStyle}>Monatliche Reflexion</Text>
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
            Lege fest, ob ausgewählte Gruppen für ein Widget oder Schnellzugriff außerhalb der App
            bereitgestellt werden sollen.
          </Text>
          {renderToggleRow('Schnellzugriff aktivieren', quickAccessSettings.enabled, toggleQuickAccessEnabled)}
          <View
            style={quickAccessSettings.enabled ? null : styles.disabledBlock}
            pointerEvents={quickAccessSettings.enabled ? 'auto' : 'none'}
          >
            {renderToggleRow(
              'Für Homescreen-Widget vorbereiten',
              quickAccessSettings.widgetEnabled,
              () => toggleQuickAccessOption('widgetEnabled'),
            )}
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
                  <Pressable
                    key={`quick-${groupName}`}
                    onPress={() => toggleQuickAccessGroup(groupName)}
                    disabled={!quickAccessSettings.enabled}
                  >
                    <View style={styles.option}>
                      <Checkbox
                        style={styles.checkbox}
                        value={!!quickAccessSettings.groupVisibility[groupName]}
                        onValueChange={() => toggleQuickAccessGroup(groupName)}
                        color={quickAccessSettings.groupVisibility[groupName] ? theme.accent : undefined}
                        disabled={!quickAccessSettings.enabled}
                      />
                      <Text style={paragraphStyle}>{groupName}</Text>
                    </View>
                  </Pressable>
                );
              })}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
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
  disabledBlock: {
    opacity: 0.5,
  },
});
