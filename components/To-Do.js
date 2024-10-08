import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet, ScrollView, Text, View, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function ToDo() {
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [todoList, setTodoList] = useState([]);
  const [habits, setHabits] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadTodoList();
    }, [])
  );

  const loadTodoList = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todoList');
      if (storedTodos !== null) {
        setTodoList(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error('Fehler beim Laden der To-Do-Liste', error);
    }
  };

  const loadHabits = async () => {
    try {
      const savedHabits = await AsyncStorage.getItem('habits');
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
          .filter(habit => habit.trim() !== '') // Nur nicht-leere Habits laden
          .map(habit => ({
            text: habit,
            completed: false,
          }));
        setHabits(parsedHabits);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Habits', error);
    }
  };

  const saveTodoList = async (list) => {
    try {
      await AsyncStorage.setItem('todoList', JSON.stringify(list));
    } catch (error) {
      console.error('Fehler beim Speichern der To-Do-Liste', error);
    }
  };

  const saveHabits = async (updatedHabits) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits.map(habit => habit.text)));
    } catch (error) {
      console.error('Fehler beim Speichern der Habits', error);
    }
  };

  const addTodoItem = () => {
    if (textInputValue.trim()) {
      const updatedList = [...todoList, { text: textInputValue, completed: false }];
      setTodoList(updatedList);
      saveTodoList(updatedList);
      setTextInputValue('');
      setModalVisible(false);
    } else {
      Alert.alert('Eingabefehler', 'Bitte einen gültigen Eintrag hinzufügen.');
    }
  };

  const toggleCompletion = (index, isHabit = false) => {
    if (isHabit) {
      const updatedHabits = habits.map((habit, i) => {
        if (i === index) {
          return { ...habit, completed: !habit.completed };
        }
        return habit;
      });
      setHabits(updatedHabits);
      saveHabits(updatedHabits);
    } else {
      const updatedList = todoList.map((item, i) => {
        if (i === index) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });
      setTodoList(updatedList);
      saveTodoList(updatedList);
    }
  };

  const deleteTodoItem = (index) => {
    Alert.alert(
      'Eintrag löschen',
      'Möchtest du diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          onPress: () => {
            const updatedList = todoList.filter((_, i) => i !== index);
            setTodoList(updatedList);
            saveTodoList(updatedList);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <LinearGradient
      colors={['#85C1E9', '#311b6b']} // Gleicher Hintergrundverlauf wie in den anderen Komponenten
      style={styles.container}
    >
      <View style={styles.scrollview}>
        <ScrollView>
          {/* Nur Habits mit Text anzeigen */}
          {habits.map((habit, index) => (
            <Pressable key={`habit-${index}`} onPress={() => toggleCompletion(index, true)}>
              <Text style={[styles.text, habit.completed ? styles.strikethrough : null]}>
                {habit.text}
              </Text>
            </Pressable>
          ))}
          {/* Normale To-Do-Liste */}
          {todoList.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => toggleCompletion(index)}
              onLongPress={() => deleteTodoItem(index)} // Hinzugefügt: Löschen mit Longpress
            >
              <Text style={[styles.text, item.completed ? styles.strikethrough : null]}>
                {item.text}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.buttonview}>
        <Pressable onPress={() => setModalVisible(true)} style={styles.buttonPressable}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']} // Gelb-Orange Verlauf
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Hinzufügen</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Neuer To-Do-Punkt"
            value={textInputValue}
            onChangeText={setTextInputValue}
          />
          <View style={styles.buttonContainer}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Abbrechen</Text>
            </Pressable>
            <Pressable onPress={addTodoItem} style={styles.modalButton}>
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
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  scrollview: {
    flex: 1,
    marginTop: 40,
  },
  text: {
    fontSize: 16,
    padding: 10,
    color: 'white',
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: 'white',
  },
  buttonview: {
    padding: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e085a',
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4d0ff',
    backgroundColor: '#e4d0ff',
    color: '#120438',
    padding: 16,
    width: '70%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    width: '70%',
    margin: 32,
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
