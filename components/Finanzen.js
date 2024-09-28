import React, { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, FlatList, TextInput, Button, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Finanzen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [monatDaten, setMonatDaten] = useState([]);
  const [bearbeiteEintrag, setBearbeiteEintrag] = useState(null);
  const [monatName, setMonatName] = useState('');
  const [datum, setDatum] = useState('');
  const [info, setInfo] = useState('');
  const [betrag, setBetrag] = useState('');

  useEffect(() => {
    ladeDaten();
  }, []);

  const ladeDaten = async () => {
    try {
      const daten = await AsyncStorage.getItem('finDaten');
      if (daten !== null) {
        setMonatDaten(JSON.parse(daten));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const speicherDaten = async (daten) => {
    try {
      await AsyncStorage.setItem('finDaten', JSON.stringify(daten));
    } catch (error) {
      console.log(error);
    }
  };

  const neuenEintragHinzufuegen = () => {
    const neuerEintrag = {
      id: Date.now().toString(),
      datum,
      info,
      betrag: parseFloat(betrag),
    };
    const neueDaten = [...monatDaten, neuerEintrag];
    setMonatDaten(neueDaten);
    speicherDaten(neueDaten);
    setDatum('');
    setInfo('');
    setBetrag('');
    setModalVisible(false);
  };

  const eintragBearbeiten = (eintrag) => {
    setBearbeiteEintrag(eintrag);
    setDatum(eintrag.datum);
    setInfo(eintrag.info);
    setBetrag(eintrag.betrag.toString());
    setModalVisible(true);
  };

  const eintragSpeichern = () => {
    const neueDaten = monatDaten.map((item) =>
      item.id === bearbeiteEintrag.id ? { ...item, datum, info, betrag: parseFloat(betrag) } : item
    );
    setMonatDaten(neueDaten);
    speicherDaten(neueDaten);
    setBearbeiteEintrag(null);
    setModalVisible(false);
  };

  const eintragLoeschen = (id) => {
    Alert.alert('Eintrag löschen', 'Möchtest du diesen Eintrag wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        onPress: () => {
          const neueDaten = monatDaten.filter((item) => item.id !== id);
          setMonatDaten(neueDaten);
          speicherDaten(neueDaten);
        },
      },
    ]);
  };

  const berechneSumme = () => {
    return monatDaten.reduce((sum, item) => sum + item.betrag, 0).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textHeader}>{monatName || 'Budget'}</Text>
      <FlatList
        data={monatDaten}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => eintragBearbeiten(item)}
            onLongPress={() => eintragLoeschen(item.id)}
            style={styles.monatTable}
          >
            <Text style={styles.textHeader2}>{item.datum}</Text>
            <Text style={styles.textHeader2}>{item.info}</Text>
            <Text style={item.betrag >= 0 ? styles.textBetrag : styles.textBetragAbgang}>
              {item.betrag.toFixed(2)} €
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.monatTable}>
            <Text style={styles.textHeader}>Summe</Text>
            <Text style={styles.textHeader}>{berechneSumme()} €</Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.buttonViewNewMonth, pressed ? styles.buttonPressed : null]}
      >
        <Text style={styles.buttonTextNewMonth}>EINTRAG HINZUFÜGEN</Text>
      </Pressable>

      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Datum"
            value={datum}
            onChangeText={(text) => setDatum(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Info"
            value={info}
            onChangeText={(text) => setInfo(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Betrag"
            value={betrag}
            onChangeText={(text) => setBetrag(text)}
            keyboardType="number-pad"
          />
          <View style={styles.buttonContainer}>
            <Button title="Abbrechen" onPress={() => setModalVisible(false)} color="#f31282" />
            <Button title={bearbeiteEintrag ? 'Speichern' : 'Hinzufügen'} onPress={bearbeiteEintrag ? eintragSpeichern : neuenEintragHinzufuegen} color="#b180f0" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#311b6b',
  },
  textHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  monatTable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#a065ec',
    marginBottom: 10,
    borderRadius: 6,
  },
  textHeader2: {
    color: '#311b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  textBetrag: {
    color: '#311b6b',
    fontSize: 16,
    textAlign: 'right',
  },
  textBetragAbgang: {
    color: '#6b1b3b',
    fontSize: 16,
    textAlign: 'right',
  },
  buttonViewNewMonth: {
    padding: 12,
    backgroundColor: '#a065ec',
    borderRadius: 6,
    margin: 10,
  },
  buttonTextNewMonth: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 16,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1e085a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4d0ff',
    backgroundColor: '#e4d0ff',
    padding: 10,
    marginVertical: 10,
    color: '#120438',
    borderRadius: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
