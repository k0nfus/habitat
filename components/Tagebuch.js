import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Modal, TextInput, FlatList, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Tagebuch() {
  const [entries, setEntries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('diaryEntries');
      if (storedEntries !== null) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einträge', error);
    }
  };

  const saveEntries = async (newEntries) => {
    try {
      await AsyncStorage.setItem('diaryEntries', JSON.stringify(newEntries));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge', error);
    }
  };

  const addEntry = () => {
    if (textInputValue.trim()) {
      const newEntry = { id: Date.now().toString(), text: textInputValue, date: new Date().toLocaleDateString() };
      const updatedEntries = [newEntry, ...entries];  // Hinzufügen des neuen Eintrags
      setEntries(updatedEntries);
      saveEntries(updatedEntries);
      setTextInputValue('');
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
      setTextInputValue('');
      setModalVisible(false);
      setCurrentEntry(null);
    }
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => editEntry(item.id)}
      onLongPress={() => deleteEntry(item.id)}
      style={styles.eintragcontainer}
    >
      <Text style={styles.eintragtext}>{item.date}</Text>
      <Text>{item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.main}>
      <View style={styles.contentview}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}  // Zeigt 3 Elemente pro Zeile an
          columnWrapperStyle={styles.row}
        />
      </View>
      <View style={styles.buttonview}>
        <Button title="Neuer Eintrag" color="#a065ec" onPress={() => setModalVisible(true)} />
      </View>

      {/* Modal für neuen Eintrag */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Tagebucheintrag"
            value={textInputValue}
            onChangeText={setTextInputValue}
            multiline={true}
            numberOfLines={20}
          />
          <View style={styles.buttonContainer}>
            <Button title="Abbrechen" color="#f31282" onPress={() => setModalVisible(false)} />
            <Button title={currentEntry ? "Speichern" : "Hinzufügen"} color="#b180f0" onPress={currentEntry ? saveEditedEntry : addEntry} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#311b6b',
    width: '100%',
  },
  contentview: {
    flex: 7,
    width: '100%',
  },
  row: {
    justifyContent: 'space-around',
  },
  eintragcontainer: {
    margin: 8,
    padding: 8,
    width: '40%',
    height: 100,
    borderColor: '#e4d0ff',
    backgroundColor: '#e4d0ff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eintragtext: {
    color: '#1e085a',
    fontWeight: 'bold',
  },
  buttonview: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    padding: 16,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#311b6b',
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4d0ff',
    backgroundColor: '#e4d0ff',
    color: '#120438',
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
