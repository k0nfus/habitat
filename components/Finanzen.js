import React, { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, FlatList, TextInput, Button, Alert } from 'react-native';
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
    setDatum(formatDatum());  // Setzt das Datum standardmäßig beim Laden
  }, []);

  const formatDatum = (eingabeDatum = '') => {
    let datumObj = new Date();

    // Wenn eine Eingabe vorhanden ist, versuchen wir sie in ein Datum zu konvertieren
    if (eingabeDatum) {
      const [tag, monat, jahr] = eingabeDatum.split('.').map((val) => parseInt(val, 10));

      // Überprüfen, ob die Eingabe gültig ist, und ein korrektes Datum erstellen
      if (!isNaN(tag) && !isNaN(monat) && !isNaN(jahr)) {
        datumObj = new Date(jahr, monat - 1, tag);
      }
    }

    // Formatierung sicherstellen: TT.MM.JJJJ
    const tag = String(datumObj.getDate()).padStart(2, '0');
    const monat = String(datumObj.getMonth() + 1).padStart(2, '0');
    const jahr = datumObj.getFullYear();

    return `${tag}.${monat}.${jahr}`;
  };

  const ladeDaten = async () => {
    try {
      const daten = await AsyncStorage.getItem('finDaten');
      if (daten !== null) {
        const sortierteDaten = JSON.parse(daten).sort((a, b) => new Date(b.datum) - new Date(a.datum));
        setMonatDaten(sortierteDaten);
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
      datum: formatDatum(datum),  // Datum formatieren
      info,
      betrag: parseFloat(betrag),
    };
    const neueDaten = [...monatDaten, neuerEintrag].sort((a, b) => new Date(b.datum) - new Date(a.datum));
    setMonatDaten(neueDaten);
    speicherDaten(neueDaten);
    setDatum(formatDatum());  // Nach dem Hinzufügen wird das Datum wieder auf den aktuellen Tag gesetzt
    setInfo('');
    setBetrag('');
    setModalVisible(false);
  };

  const eintragBearbeiten = (eintrag) => {
    setBearbeiteEintrag(eintrag);
    setDatum(formatDatum(eintrag.datum));  // Datum formatieren
    setInfo(eintrag.info);
    setBetrag(eintrag.betrag.toString());
    setModalVisible(true);
  };

  const eintragSpeichern = () => {
    const neueDaten = monatDaten.map((item) =>
      item.id === bearbeiteEintrag.id
        ? { ...item, datum: formatDatum(datum), info, betrag: parseFloat(betrag) }
        : item
    ).sort((a, b) => new Date(b.datum) - new Date(a.datum));
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
          setMonatDaten(neueDaten.sort((a, b) => new Date(b.datum) - new Date(a.datum)));
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
      <View style={styles.container2}>
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
              <Text style={styles.textHeader3}>{item.info}</Text>
              <Text style={item.betrag >= 0 ? styles.textBetrag : styles.textBetragAbgang}>
                {item.betrag.toFixed(2)} €
              </Text>
            </Pressable>
          )}
          ListHeaderComponent={
            <View style={styles.monatTable}>
              <Text style={styles.textHeader}>Aktueller Stand:</Text>
              <Text style={styles.textHeader}>{berechneSumme()} €</Text>
            </View>
          }
        />

        <Pressable
          onPress={() => {
            setDatum(formatDatum());  // Datum setzen, wenn das Modal geöffnet wird
            setModalVisible(true);
          }}
          style={({ pressed }) => [styles.buttonViewNewMonth, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.buttonTextNewMonth}>HINZUFÜGEN</Text>
        </Pressable>

        <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Datum"
              value={datum}
              onChangeText={(text) => setDatum(formatDatum(text))}  // Datum beim Eingeben formatieren
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
              keyboardType="default"
            />
            <View style={styles.buttonContainer}>
              <Button title="Abbrechen" onPress={() => setModalVisible(false)} color="#f31282" />
              <Button title={bearbeiteEintrag ? 'Speichern' : 'Hinzufügen'} onPress={bearbeiteEintrag ? eintragSpeichern : neuenEintragHinzufuegen} color="#b180f0" />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#311b6b',
  },
  container2: {
    marginTop: 40,
    marginBottom: 40,
  },
  textHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  monatTable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#a065ec',
    marginBottom: 8,
    borderRadius: 6,
  },
  textHeader2: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
  },
  textHeader3: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'left',
  },
  textBetrag: {
    color: '#295519',
    fontSize: 14,
    textAlign: 'right',
  },
  textBetragAbgang: {
    color: '#6b1b3b',
    fontSize: 14,
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
