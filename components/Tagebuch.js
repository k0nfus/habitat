import React, { useState, useEffect } from 'react';
import { Text, View, Button, Modal, StyleSheet, TextInput, FlatList, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Tagebuch() {
  const [entries, setEntries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [textInputValue, setTextInputValue] = useState(
    "Ich bin dankbar für...\n\n\n\nDarauf freue ich mich besonders:\n\n\n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n\n\nPositive Selbstbekräftigung:\n\n\n\nTagesfokus:\n\n\n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n\n\nZitat des Tages:\n\n"
  );

  const templateText = "Ich bin dankbar für...\n\n\n\nDarauf freue ich mich besonders:\n\n\n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n\n\nPositive Selbstbekräftigung:\n\n\n\nTagesfokus:\n\n\n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n\n\nZitat des Tages:\n\n";

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

  const handleNewEntry = () => {
    setTextInputValue(templateText);
    setCurrentEntry(null);
    setModalVisible(true);
  };

  const addEntry = () => {
    if (textInputValue.trim()) {
      const newEntry = { id: Date.now().toString(), text: textInputValue, date: new Date() }; // Date wird als Objekt gespeichert
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      saveEntries(updatedEntries);

      setTextInputValue(templateText);
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
    ])}

  const getDayStyle = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 (Sonntag) bis 6 (Samstag)

    switch (day) {
      case 1: // Montag
        return { backgroundColor: '#FFD700' }; // Dunkles Gelb
      case 2: // Dienstag
        return { backgroundColor: '#FFA500' }; // Orange
      case 3: // Mittwoch
        return { backgroundColor: '#8B0000' }; // Weinrot
      case 4: // Donnerstag
        return { backgroundColor: '#4B0082' }; // Dunkles Lila
      case 5: // Freitag
        return { backgroundColor: '#40E0D0', color: 'black' }; // Türkis mit schwarzer Schrift
      case 6: // Samstag
        return { backgroundColor: '#006400' }; // Dunkelgrün
      case 0: // Sonntag
        return { backgroundColor: '#90EE90', color: 'black' }; // Hellgrün mit schwarzer Schrift
      default:
        return { backgroundColor: '#e4d0ff' }; // Standard
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('de-DE', { weekday: 'short' }).substring(0, 2).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek}\n${day}.${month}.`;
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => editEntry(item.id)}
      onLongPress={() => deleteEntry(item.id)}
      style={[styles.eintragcontainer, getDayStyle(item.date)]}
    >
      <Text style={[styles.eintragtext, getDayStyle(item.date)]}>{formatDate(item.date)}</Text>
    </Pressable>
  );

  return (
    <View style={styles.main}>
      <View style={styles.contentview}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
        />
      </View>
      <View style={styles.buttonview}>
        <Button title="Hinzufügen" color="#a065ec" onPress={handleNewEntry} />
      </View>

      {/* Modal für neuen oder bearbeiteten Eintrag */}
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
    padding: 20,
  },
  contentview: {
    marginTop: 40,
    flex: 7,
    width: '100%',
  },
  row: {
    justifyContent: 'space-around',
  },
  eintragcontainer: {
    margin: 8,
    padding: 8,
    height: 100,
    width: 100,
    borderColor: '#e4d0ff',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  eintragtext: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
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
