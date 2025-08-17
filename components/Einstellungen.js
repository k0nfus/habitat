import React, { useState, useEffect } from "react";
import { Button, View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function Einstellungen() {
  const [selectedStartseite, setSelectedStartseite] = useState('Tagebuch');
  const [templateText, setTemplateText] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [minSteps, setMinSteps] = useState('');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedStartseite = await AsyncStorage.getItem('startseite');
        if (savedStartseite) setSelectedStartseite(savedStartseite);

        const savedTemplate = await AsyncStorage.getItem('diaryTemplate');
        if (savedTemplate) setTemplateText(savedTemplate);

        const savedGoalWeight = await AsyncStorage.getItem('goalWeight');
        if (savedGoalWeight) setGoalWeight(savedGoalWeight);

        const savedMinSteps = await AsyncStorage.getItem('minSteps');
        if (savedMinSteps) setMinSteps(savedMinSteps);

        const savedGroups = await AsyncStorage.getItem('todoGroups');
        if (savedGroups) {
          const parsed = JSON.parse(savedGroups);
          setGroups(parsed.length ? parsed : defaultGroups());
        } else {
          const defaults = defaultGroups();
          setGroups(defaults);
          await AsyncStorage.setItem('todoGroups', JSON.stringify(defaults));
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

  const saveTemplateText = async () => {
    try {
      await AsyncStorage.setItem('diaryTemplate', templateText);
      Alert.alert('Erfolg', 'Tagebuch-Template wurde gespeichert.');
    } catch (error) {
      console.error('Fehler beim Speichern des Templates', error);
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

  return (
    <LinearGradient colors={['#000000', '#1c1c1e']} style={styles.container}>
      <ScrollView>
        {/* Startseite */}
        <View style={styles.settingView}>
          <Text style={styles.text}>Startseite</Text>
          <Pressable onPress={() => saveStartseite('To-Do')}>
            <View style={styles.option}>
              <Checkbox
                style={styles.checkbox}
                value={selectedStartseite === 'To-Do'}
                onValueChange={() => saveStartseite('To-Do')}
              />
              <Text style={styles.paragraph}>To-Do-Liste</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => saveStartseite('Tagebuch')}>
            <View style={styles.option}>
              <Checkbox
                style={styles.checkbox}
                value={selectedStartseite === 'Tagebuch'}
                onValueChange={() => saveStartseite('Tagebuch')}
              />
              <Text style={styles.paragraph}>Tagebuch</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => saveStartseite('Tracking')}>
            <View style={styles.option}>
              <Checkbox
                style={styles.checkbox}
                value={selectedStartseite === 'Tracking'}
                onValueChange={() => saveStartseite('Tracking')}
              />
              <Text style={styles.paragraph}>Gewicht & Schritte</Text>
            </View>
          </Pressable>
        </View>

        {/* Tagebuch-Template */}
        <View style={styles.settingView}>
          <Text style={styles.text}>Tagebuch-Template</Text>
          <TextInput
            style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
            multiline
            placeholder="Tagebuch-Vorlage hier eingeben"
            value={templateText}
            onChangeText={setTemplateText}
          />
          <Button title="Speichern" onPress={saveTemplateText} color={'#4CAF50'} />
        </View>

        {/* Tracking-Ziele */}
        <View style={styles.settingView}>
          <Text style={styles.text}>Tracking-Ziele</Text>
          <TextInput
            style={styles.input}
            placeholder="Zielgewicht (kg)"
            keyboardType="decimal-pad"
            value={goalWeight}
            onChangeText={saveGoalWeight}
          />
          <TextInput
            style={styles.input}
            placeholder="Mindestschritte"
            keyboardType="number-pad"
            value={minSteps}
            onChangeText={saveMinSteps}
          />
        </View>

        {/* To-Do Gruppen */}
        <View style={styles.settingView}>
          <Text style={styles.text}>To-Do-Gruppen</Text>
          {groups
            .sort((a, b) => a.order - b.order)
            .map((group, index) => (
              <View key={index} style={styles.groupRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Gruppenname"
                  value={group.name}
                  onChangeText={(val) => handleGroupChange(index, 'name', val)}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="numeric"
                  placeholder="Sort"
                  value={group.order.toString()}
                  onChangeText={(val) => handleGroupChange(index, 'order', val)}
                />
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    value={group.showIfEmpty}
                    onValueChange={() => handleGroupChange(index, 'showIfEmpty')}
                  />
                  <Text style={styles.checkboxLabel}>anzeigen</Text>
                </View>
                <Pressable onPress={() => deleteGroup(index)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>🗑</Text>
                </Pressable>
              </View>
            ))}
          <Button title="Neue Gruppe hinzufügen" color="green" onPress={addGroup} />
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
    padding: 10,
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: '#f5f5f5',
    fontWeight: 'bold',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#f5f5f5',
  },
  checkbox: {
    marginRight: 10,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    color: '#f5f5f5',
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
    color: '#f5f5f5',
  },
  deleteButton: {
    marginLeft: 4,
  },
  deleteText: {
    color: 'red',
    fontSize: 18,
  },
});
