import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, ScrollView, Text, View, Button, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ToDo() {
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [todoList, setTodoList] = useState([]);

  useEffect(() => {
    loadTodoList();
  }, []);

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

  const saveTodoList = async (list) => {
    try {
      await AsyncStorage.setItem('todoList', JSON.stringify(list));
    } catch (error) {
      console.error('Fehler beim Speichern der To-Do-Liste', error);
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

  const toggleCompletion = (index) => {
    const updatedList = todoList.map((item, i) => {
      if (i === index) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setTodoList(updatedList);
    saveTodoList(updatedList);
  };

  const deleteTodoItem = (index) => {
    const updatedList = todoList.filter((_, i) => i !== index);
    setTodoList(updatedList);
    saveTodoList(updatedList);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scrollview}>
        <ScrollView>
          {todoList.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => toggleCompletion(index)}
              onLongPress={() => deleteTodoItem(index)}
            >
              <Text style={[styles.text, item.completed ? styles.strikethrough : null]}>
                {item.text}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.buttonview}>
        <Button title="Hinzufügen" onPress={() => setModalVisible(true)} />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
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
            <Button title="Abbrechen" onPress={() => setModalVisible(false)} />
            <Button title="Speichern" onPress={addTodoItem} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#ffffff',
    },
    scrollview: {
      flex: 1,
    },
    text: {
      fontSize: 18,
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      color: '#000000',
      fontWeight: 'bold',
    },
    strikethrough: {
      textDecorationLine: 'line-through',
      color: '#058e17',
    },
    buttonview: {
      padding: 10,
    },
    modalView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    input: {
      height: 40,
      width: '80%',
      borderColor: 'gray',
      borderWidth: 1,
      paddingLeft: 10,
      marginBottom: 20,
      backgroundColor: '#ffffff',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      margin: 20,
    },
  });