import React, { useState, useEffect } from 'react';
import { Text, Button, View, Modal, StyleSheet, TextInput, FlatList, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function Tagebuch() {
  const [entries, setEntries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [templateText, setTemplateText] = useState('');

  useEffect(() => {
    const loadTemplateAndEntries = async () => {
      try {
        const savedTemplate = await AsyncStorage.getItem('diaryTemplate');
        if (savedTemplate) {
          setTemplateText(savedTemplate);
          setTextInputValue(savedTemplate);
        } else {
          const defaultText = "Ich bin dankbar für...\n\n     → \n     → \n     → \n\nDarauf freue ich mich besonders:\n\n     \n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n     \n\nPositive Selbstbekräftigung:\n\n     \n\nTagesfokus:\n\n     → \n     → \n     → \n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n     → \n     → \n     → \n\nZitat des Tages:\n\n";
          setTemplateText(defaultText);
          setTextInputValue(defaultText);
        }

        const storedEntries = await AsyncStorage.getItem('diaryEntries');
        if (storedEntries !== null) {
          setEntries(JSON.parse(storedEntries));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten', error);
      }
    };

    loadTemplateAndEntries();
  }, []);

  const saveEntries = async (newEntries) => {
    try {
      await AsyncStorage.setItem('diaryEntries', JSON.stringify(newEntries));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge', error);
    }
  };

  const handleNewEntry = async () => {
    try {
      const savedTemplate = await AsyncStorage.getItem('diaryTemplate');
      if (savedTemplate) {
        setTextInputValue(savedTemplate);
      } else {
        const fallback = "Ich bin dankbar für...\n\n     → \n     → \n     → \n\nDarauf freue ich mich besonders:\n\n     \n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n     \n\nPositive Selbstbekräftigung:\n\n     \n\nTagesfokus:\n\n     → \n     → \n     → \n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n     → \n     → \n     → \n\nZitat des Tages:\n\n";
        setTextInputValue(fallback);
      }
      setCurrentEntry(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Fehler beim Laden des Templates', error);
    }
  };

  const addEntry = () => {
    if (textInputValue.trim()) {
      const newEntry = { id: Date.now().toString(), text: textInputValue, date: new Date() };
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      saveEntries(updatedEntries);
      setModalVisible(false);
    } else {
      Alert.alert('Eingabefehler', 'Bitte einen gültigen Eintrag hinzufügen.');
    }
  };

  const editEntry = (id) => {
    const entry = entries.find(e => e.id === id);
    setTextInputValue(entry.text);
    setCurrentEntry(id);
    setModalVisible(true);
  };

  const saveEditedEntry = () => {
    if (textInputValue.trim()) {
      const updatedEntries = entries.map(entry =>
        entry.id === currentEntry ? { ...entry, text: textInputValue } : entry
      );
      setEntries(updatedEntries);
      saveEntries(updatedEntries);
      setModalVisible(false);
      setCurrentEntry(null);
    }
  };

  const deleteEntry = (id) => {
    Alert.alert('Eintrag löschen', 'Möchtest du diesen Eintrag wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        onPress: () => {
          const updatedEntries = entries.filter(entry => entry.id !== id);
          setEntries(updatedEntries);
          saveEntries(updatedEntries);
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => editEntry(item.id)}
      onLongPress={() => deleteEntry(item.id)}
      style={styles.entryCard}
    >
      <Text style={styles.dateText}>{formatDate(item.date)}</Text>
    </Pressable>
  );

  return (
    <LinearGradient colors={['#000000', '#1c1c1e']} style={styles.main}>
      <View style={styles.contentview}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>

      <View style={styles.buttonview}>
        <Pressable onPress={handleNewEntry} style={styles.buttonPressable}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.gradientButton}>
            <Text style={styles.buttonText}>Hinzufügen</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Tagebucheintrag"
            value={textInputValue}
            onChangeText={setTextInputValue}
            multiline
            numberOfLines={20}
          />
          <View style={styles.buttonContainer}>
            <Button title="Abbrechen" color="#f31282" onPress={() => setModalVisible(false)} />
            <Button
              title={currentEntry ? 'Speichern' : 'Hinzufügen'}
              color="#b180f0"
              onPress={currentEntry ? saveEditedEntry : addEntry}
            />
          </View>
        </View>
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
  entryCard: {
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#f5f5f5',
    fontWeight: 'bold',
  },
  buttonview: {
    padding: 16,
    alignItems: 'center',
  },
  buttonPressable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalView: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    padding: 20,
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#f5f5f5',
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
