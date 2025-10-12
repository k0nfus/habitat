import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AddButton from './AddButton';
import { useTheme } from '../theme';

export default function Tracking() {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [currentDate, setCurrentDate] = useState(null);
  const [goalWeight, setGoalWeight] = useState(0);
  const [minSteps, setMinSteps] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('trackingEntries');
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = parsed.map((entry) => ({
          date: entry.date,
          weight: typeof entry.weight === 'number' ? entry.weight : parseFloat(entry.weight) || 0,
          steps: typeof entry.steps === 'number' ? entry.steps : parseInt(entry.steps, 10) || 0,
        }));
        normalized.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(normalized);
        if (parsed.some((entry) => typeof entry.weight !== 'number' || typeof entry.steps !== 'number')) {
          saveEntries(normalized);
        }
      }
      const gw = await AsyncStorage.getItem('goalWeight');
      if (gw) setGoalWeight(parseFloat(gw));
      const ms = await AsyncStorage.getItem('minSteps');
      if (ms) setMinSteps(parseInt(ms));
    } catch (e) {
      console.error('Fehler beim Laden', e);
    }
  };

  const saveEntries = async (list) => {
    try {
      await AsyncStorage.setItem('trackingEntries', JSON.stringify(list));
    } catch (e) {
      console.error('Fehler beim Speichern', e);
    }
  };

  const openAddModal = () => {
    const lastWeight = entries.length ? entries[0].weight : 0;
    setWeightInput(lastWeight ? lastWeight.toString() : '');
    setStepsInput('');
    setCurrentDate(new Date().toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const openEditModal = (entry) => {
    setWeightInput(entry.weight.toString());
    setStepsInput(entry.steps.toString());
    setCurrentDate(entry.date);
    setModalVisible(true);
  };

  const saveEntry = () => {
    const weight = parseFloat(weightInput.replace(',', '.')) || 0;
    const steps = parseInt(stepsInput, 10) || 0;
    const date = currentDate || new Date().toISOString().split('T')[0];
    const existingIndex = entries.findIndex((e) => e.date === date);
    let updated;
    if (existingIndex >= 0) {
      updated = [...entries];
      updated[existingIndex] = { date, weight, steps };
    } else {
      updated = [{ date, weight, steps }, ...entries];
    }
    updated.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(updated);
    saveEntries(updated);
    setModalVisible(false);
  };

  const deleteEntry = (date) => {
    Alert.alert('Eintrag löschen', 'Möchtest du diesen Eintrag wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          const filtered = entries.filter((e) => e.date !== date);
          setEntries(filtered);
          saveEntries(filtered);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const weightMet = goalWeight && item.weight <= goalWeight;
    const stepsMet = minSteps && item.steps >= minSteps;
    return (
      <Pressable
        onPress={() => openEditModal(item)}
        onLongPress={() => deleteEntry(item.date)}
        style={[styles.entry, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
      >
        <Text style={[styles.dateText, { color: theme.textPrimary }]}>{new Date(item.date).toLocaleDateString('de-DE')}</Text>
        <View style={styles.valueRow}>
          <View
            style={[
              styles.valueBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.surfaceBorder },
              weightMet && { borderColor: theme.accentSecondary, backgroundColor: `${theme.accentSecondary}22` },
            ]}
          >
            <Ionicons name="scale-outline" size={16} color={theme.accent} />
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>{item.weight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.separator}>
            <Text style={[styles.separatorText, { color: theme.textSecondary }]}>|</Text>
          </View>
          <View
            style={[
              styles.valueBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.surfaceBorder },
              stepsMet && { borderColor: theme.accentSecondary, backgroundColor: `${theme.accentSecondary}22` },
            ]}
          >
            <Ionicons name="walk-outline" size={16} color={theme.accent} />
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>{item.steps}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120, gap: 16, paddingHorizontal: 20 }}
      />
      <View style={styles.addButtonView}>
        <AddButton onPress={openAddModal} title="Neuer Eintrag" />
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <LinearGradient colors={theme.backgroundGradient} style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Eintrag bearbeiten</Text>
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Gewicht (kg)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, color: theme.textPrimary, borderColor: theme.inputBorder },
              ]}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Schritte</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, color: theme.textPrimary, borderColor: theme.inputBorder },
              ]}
              keyboardType="number-pad"
              value={stepsInput}
              onChangeText={setStepsInput}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.secondaryButton, { borderColor: theme.surfaceBorder }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={saveEntry}
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
  },
  entry: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  separator: {
    paddingHorizontal: 4,
  },
  separatorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonView: {
    padding: 16,
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  modalContent: {
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});
