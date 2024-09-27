import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, ScrollView, Text, View, Image, Button, Modal, TextInput, Alert } from 'react-native';
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
        <Button title="Hinzufügen" onPress={() => setModalVisible(true)} color="#a065ec"/>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Image style={styles.image} source={require('../assets/daily-planning.png')} />
          <TextInput
            style={styles.input}
            placeholder="Neuer To-Do-Punkt"
            value={textInputValue}
            onChangeText={setTextInputValue}
          />
          <View style={styles.buttonContainer}>
            <Button title="Abbrechen" onPress={() => setModalVisible(false)} color="#f31282"/>
            <Button title="Speichern" onPress={addTodoItem} color="#b180f0" />
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
      backgroundColor: '#311b6b',
    },
    scrollview: {
      flex: 1,
      marginTop: 40,
    },
    image: {
      width: 150,
      height: 150,
      marginBottom: 64,
    },
    text: {
      fontSize: 18,
      padding: 10,
      borderWidth: 1,
      borderColor: '#e4d0ff',
      backgroundColor: '#e4d0ff',
      borderRadius: 6,  
      color: '#1e085a',
      marginBottom: 8,
    },
    strikethrough: {
      textDecorationLine: 'line-through',
      color: '#e4d0ff',
      backgroundColor: '#3d3553',
    },
    buttonview: {
      padding: 10,
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
  });