import React, { useState, useEffect } from 'react';
import { Text, Button, View, Modal, StyleSheet, TextInput, FlatList, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function Tagebuch() {
  const [entries, setEntries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [textInputValue, setTextInputValue] = useState(
    "Ich bin dankbar für...\n\n     → \n     → \n     → \n\nDarauf freue ich mich besonders:\n\n     \n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n     \n\nPositive Selbstbekräftigung:\n\n     \n\nTagesfokus:\n\n     → \n     → \n     → \n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n     → \n     → \n     → \n\nZitat des Tages:\n\n"
  );

  const templateText = "Ich bin dankbar für...\n\n     → \n     → \n     → \n\nDarauf freue ich mich besonders:\n\n     \n\nDas habe ich mir gestern vorgenommen heute anders zu machen:\n\n     \n\nPositive Selbstbekräftigung:\n\n     \n\nTagesfokus:\n\n     → \n     → \n     → \n\nWas habe ich heute Gutes für jemanden getan?\n\n\n\nWas hat mir heute Energie geraubt?\n\n\n\nWas werde ich morgen anders machen?\n\n\n\nTolle Dinge, die ich heute erlebt habe:\n\n     → \n     → \n     → \n\nZitat des Tages:\n\n";

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
    ]);
  };

  const getDayStyle = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 (Sonntag) bis 6 (Samstag)
  
    switch (day) {
      case 1: // Montag
        return { colors: ['#FFD700', '#FFEC8B'], textColor: 'black' }; // Gelber Verlauf mit schwarzer Schrift
      case 2: // Dienstag
        return { colors: ['#FFA500', '#FFDAB9'], textColor: 'black' }; // Orange Verlauf mit schwarzer Schrift
      case 3: // Mittwoch
        return { colors: ['#8B0000', '#B22222'], textColor: 'white' }; // Dunkles Rot mit weißer Schrift
      case 4: // Donnerstag
        return { colors: ['#4B0082', '#8A2BE2'], textColor: 'white' }; // Lila Verlauf mit weißer Schrift
      case 5: // Freitag
        return { colors: ['#40E0D0', '#AFEEEE'], textColor: 'black' }; // Türkis Verlauf mit schwarzer Schrift
      case 6: // Samstag
        return { colors: ['#006400', '#228B22'], textColor: 'white' }; // Dunkelgrün mit weißer Schrift
      case 0: // Sonntag
        return { colors: ['#90EE90', '#98FB98'], textColor: 'black' }; // Hellgrün Verlauf mit schwarzer Schrift
      default:
        return { colors: ['#e4d0ff', '#c8a2ff'], textColor: 'black' }; // Standard mit schwarzer Schrift
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('de-DE', { weekday: 'short' }).substring(0, 2).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek}\n${day}.${month}.`;
  };

  const renderItem = ({ item }) => {
    const dayStyle = getDayStyle(item.date); // Holt die Farbverläufe und die Textfarbe

    return (
      <Pressable
        onPress={() => editEntry(item.id)}
        onLongPress={() => deleteEntry(item.id)}
        style={styles.eintragcontainer}
      >
        <LinearGradient
          colors={dayStyle.colors} // Benutze den Farbverlauf
          style={styles.gradientBackground}
        >
          <Text style={[styles.eintragtext, { color: dayStyle.textColor }]}>{formatDate(item.date)}</Text>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderGradientButton = () => {
    return (
      <Pressable onPress={handleNewEntry} style={styles.buttonPressable}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']} // Freundliche, warme Farben (Gelb-Orange)
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Hinzufügen</Text>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <LinearGradient
      colors={['#85C1E9', '#311b6b']} // Sanfter Hintergrundverlauf (Hellblau zu Lila)
      style={styles.main} // Der LinearGradient ersetzt den Hintergrund-View
    >
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
        {renderGradientButton()}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonPressable: {
    borderRadius: 10,
    overflow: 'hidden', // Damit der Gradient im Pressable sichtbar bleibt
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
  eintragcontainer: {
    margin: 8,
    padding: 8,
    height: 100,
    width: 100,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3, // Leichter Schatten
    borderWidth: 1,
    borderColor: '#fff', // 1px weißer Rand
  },
  gradientBackground: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
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
