import React, { useState, useEffect, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  View,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AddButton from './AddButton';
import { useTheme } from '../theme';
import {
  defaultQuickAccessSettings,
  QUICK_ACCESS_STORAGE_KEY,
  alignQuickAccessGroups,
} from '../constants/todoQuickAccessDefaults';

export default function ToDo() {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Allgemein');
  const [todoList, setTodoList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [quickAccessSettings, setQuickAccessSettings] = useState(defaultQuickAccessSettings);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
      loadTodoList();
      loadQuickAccessSettings();
    }, [])
  );

  useEffect(() => {
    if (!groups.length) return;
    if (!groups.find((group) => group.name === selectedGroup)) {
      setSelectedGroup(groups[0]?.name || 'Allgemein');
    }
  }, [groups]);

  const loadGroups = async () => {
    try {
      const savedGroups = await AsyncStorage.getItem('todoGroups');
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        const validGroups = parsed.length ? parsed : [{ name: 'Allgemein', order: 1, showIfEmpty: true }];
        setGroups(validGroups);
        setQuickAccessSettings((current) => {
          const { settings, changed } = alignQuickAccessGroups(current, validGroups);
          if (changed) {
            AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
          }
          return settings;
        });
        if (!selectedGroup || selectedGroup.trim() === '') {
          setSelectedGroup(validGroups[0].name);
        }
      } else {
        const fallback = [{ name: 'Allgemein', order: 1, showIfEmpty: true }];
        setGroups(fallback);
        await AsyncStorage.setItem('todoGroups', JSON.stringify(fallback));
        setSelectedGroup('Allgemein');
        setQuickAccessSettings((current) => {
          const { settings } = alignQuickAccessGroups(current, fallback);
          AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
          return settings;
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen', error);
    }
  };

  const loadTodoList = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todoList');
      if (storedTodos !== null) {
        const parsed = JSON.parse(storedTodos);
        const normalized = parsed.map((item, index) => ({
          id: item.id || `${item.group || 'Allgemein'}-${index}-${item.text}`,
          text: item.text,
          completed: !!item.completed,
          group: item.group || 'Allgemein',
        }));
        setTodoList(normalized);
        if (parsed.some((item) => !item.id)) {
          saveTodoList(normalized);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der To-Do-Liste', error);
    }
  };

  const loadQuickAccessSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(QUICK_ACCESS_STORAGE_KEY);
      if (!groups.length) {
        const normalized = raw ? { ...defaultQuickAccessSettings, ...JSON.parse(raw) } : defaultQuickAccessSettings;
        setQuickAccessSettings(normalized);
      } else {
        const { settings } = alignQuickAccessGroups(raw ? JSON.parse(raw) : defaultQuickAccessSettings, groups);
        setQuickAccessSettings(settings);
        await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Schnellzugriff-Einstellungen', error);
    }
  };

  const saveTodoList = async (list) => {
    try {
      await AsyncStorage.setItem('todoList', JSON.stringify(list));
    } catch (error) {
      console.error('Fehler beim Speichern der To-Do-Liste', error);
    }
  };

  const addTodoItem = () => {
    const cleanGroup = selectedGroup?.trim() || 'Allgemein';
    if (textInputValue.trim()) {
      const updatedList = [
        ...todoList,
        {
          id: Date.now().toString(),
          text: textInputValue.trim(),
          completed: false,
          group: cleanGroup,
        },
      ];
      setTodoList(updatedList);
      saveTodoList(updatedList);
      setTextInputValue('');
      setModalVisible(false);
    } else {
      Alert.alert('Eingabefehler', 'Bitte einen gültigen Eintrag hinzufügen.');
    }
  };

  const toggleCompletion = (id) => {
    const updatedList = todoList.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
    setTodoList(updatedList);
    saveTodoList(updatedList);
  };

  const deleteTodoItem = (id) => {
    Alert.alert(
      'Eintrag löschen',
      'Möchtest du diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            const updatedList = todoList.filter((item) => item.id !== id);
            setTodoList(updatedList);
            saveTodoList(updatedList);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getTodosByGroup = (groupName) => todoList.filter((todo) => todo.group === groupName);

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120, gap: 16 }}>
        {quickAccessSettings.enabled && (
          <View
            style={[
              styles.quickAccessCard,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.surfaceBorder },
            ]}
          >
            <Text style={[styles.quickAccessTitle, { color: theme.textPrimary }]}>Schnellzugriff aktiv</Text>
            <Text style={[styles.quickAccessDescription, { color: theme.textSecondary }]}>Diese Gruppen sind für Widgets oder die Statusleiste freigegeben:</Text>
            {Object.entries(quickAccessSettings.groupVisibility)
              .filter(([, value]) => value)
              .map(([name]) => (
                <Text key={name} style={[styles.quickAccessGroup, { color: theme.textPrimary }]}>
                  • {name}
                </Text>
              ))}
            {Object.values(quickAccessSettings.groupVisibility).every((value) => !value) && (
              <Text style={[styles.quickAccessGroup, { color: theme.textSecondary }]}>Noch keine Gruppe ausgewählt.</Text>
            )}
            <View style={styles.quickAccessBadges}>
              {quickAccessSettings.widgetEnabled && (
                <View style={[styles.badge, { backgroundColor: `${theme.accent}22`, borderColor: theme.accent }]}>
                  <Text style={[styles.badgeText, { color: theme.accent }]}>Widget</Text>
                </View>
              )}
              {quickAccessSettings.statusBarEnabled && (
                <View style={[styles.badge, { backgroundColor: `${theme.accentSecondary}22`, borderColor: theme.accentSecondary }]}>
                  <Text style={[styles.badgeText, { color: theme.accentSecondary }]}>Statusleiste</Text>
                </View>
              )}
            </View>
          </View>
        )}
        {groups
          .sort((a, b) => a.order - b.order)
          .map((group, groupIndex) => {
            const groupTodos = getTodosByGroup(group.name);
            if (!groupTodos.length && !group.showIfEmpty) return null;

            return (
              <View
                key={`${group.name}-${groupIndex}`}
                style={[styles.groupSection, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{group.name || 'Unbenannt'}</Text>
                  <Text style={[styles.groupCount, { color: theme.textSecondary }]}>{groupTodos.length} Aufgabe(n)</Text>
                </View>
                {groupTodos.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Keine Einträge vorhanden.</Text>
                ) : (
                  groupTodos.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleCompletion(item.id)}
                      onLongPress={() => deleteTodoItem(item.id)}
                      style={[
                        styles.todoItem,
                        {
                          backgroundColor: theme.surfaceAlt,
                          borderColor: theme.surfaceBorder,
                        },
                        item.completed && {
                          borderColor: theme.accentSecondary,
                          backgroundColor: `${theme.accentSecondary}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.todoText,
                          {
                            color: theme.textPrimary,
                            textDecorationLine: item.completed ? 'line-through' : 'none',
                            opacity: item.completed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {item.text}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            );
          })}
      </ScrollView>

      <View style={styles.buttonview}>
        <AddButton onPress={() => setModalVisible(true)} title="Neue Aufgabe" />
      </View>

      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <LinearGradient colors={theme.backgroundGradient} style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Neue Aufgabe hinzufügen</Text>
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Gruppe</Text>
            <View style={[styles.pickerWrapper, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
            >
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                dropdownIconColor={theme.textPrimary}
                style={{ color: theme.textPrimary }}
              >
                {groups.map((group) => (
                  <Picker.Item key={group.name} label={group.name} value={group.name} color={theme.textPrimary} />
                ))}
              </Picker>
            </View>
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Aufgabe</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  borderColor: theme.inputBorder,
                },
              ]}
              placeholder="Was steht an?"
              placeholderTextColor={theme.textSecondary}
              value={textInputValue}
              onChangeText={setTextInputValue}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.secondaryButton, { borderColor: theme.surfaceBorder }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={addTodoItem}
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Speichern</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  groupSection: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  todoItem: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  todoText: {
    fontSize: 16,
  },
  buttonview: {
    padding: 16,
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'transparent',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickAccessCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickAccessDescription: {
    fontSize: 14,
  },
  quickAccessGroup: {
    fontSize: 14,
  },
  quickAccessBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
