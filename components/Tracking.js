import React, { useState, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Pressable, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AddButton from './AddButton';


export default function Tracking() {
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
        parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(parsed);
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
    setWeightInput(lastWeight.toString());
    setStepsInput('0');
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
    const weight = parseFloat(weightInput) || 0;
    const steps = parseInt(stepsInput) || 0;
    const date = currentDate || new Date().toISOString().split('T')[0];
    const existingIndex = entries.findIndex(e => e.date === date);
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
          const filtered = entries.filter(e => e.date !== date);
          setEntries(filtered);
          saveEntries(filtered);
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const weightMet = goalWeight && item.weight <= goalWeight;
    const stepsMet = minSteps && item.steps >= minSteps;
    return (
      <Pressable onPress={() => openEditModal(item)} onLongPress={() => deleteEntry(item.date)} style={styles.entry}>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('de-DE')}</Text>
        <View style={styles.valueRow}>
          <View style={[styles.valueBox, weightMet && styles.successBox]}>
            <Ionicons name="scale-outline" size={16} color="#f5f5f5" />
            <Text style={styles.valueText}>{item.weight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.separator}>
            <Text style={styles.valueText}>|</Text>
          </View>
          <View style={[styles.valueBox, stepsMet && styles.successBox]}>
            <Ionicons name="walk-outline" size={16} color="#f5f5f5" />
            <Text style={styles.valueText}>{item.steps}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#1c1c1e']} style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <View style={styles.addButtonView}>
        <AddButton onPress={openAddModal} />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalLabel}>Gewicht (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={weightInput}
            onChangeText={setWeightInput}
          />
          <Text style={styles.modalLabel}>Schritte</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={stepsInput}
            onChangeText={setStepsInput}
          />
          <View style={styles.buttonContainer}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Abbrechen</Text>
            </Pressable>
            <Pressable onPress={saveEntry} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Speichern</Text>
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
    paddingTop: 60,
    width: '100%',
  },
  entry: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  dateText: {
    color: '#f5f5f5',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBox: {
    backgroundColor: '#1ba564',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  separator: {
    paddingHorizontal: 8,
  },
  valueText: {
    color: '#f5f5f5',
    marginLeft: 4,
  },
  addButtonView: {
    padding: 16,
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    padding: 20,
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2c2c2e',
    color: '#f5f5f5',
    padding: 16,
    marginBottom: 20,
  },
  modalLabel: {
    color: '#f5f5f5',
    fontSize: 16,
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#b180f0',
    borderRadius: 10,
    margin: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
