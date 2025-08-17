import React, { useState, useEffect, useCallback } from 'react';
import {
  Pressable, StyleSheet, ScrollView, Text, View,
  Modal, TextInput, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AddButton from './AddButton';

export default function ToDo() {
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Allgemein');
  const [todoList, setTodoList] = useState([]);
  const [groups, setGroups] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
      loadTodoList();
    }, [])
  );

  const loadGroups = async () => {
    try {
      const savedGroups = await AsyncStorage.getItem('todoGroups');
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        const validGroups = parsed.length ? parsed : [{ name: 'Allgemein', order: 1, showIfEmpty: true }];
        setGroups(validGroups);
        // Fallback falls selectedGroup leer ist
        if (!selectedGroup || selectedGroup.trim() === '') {
          setSelectedGroup(validGroups[0].name);
        }
      } else {
        const fallback = [{ name: 'Allgemein', order: 1, showIfEmpty: true }];
        setGroups(fallback);
        await AsyncStorage.setItem('todoGroups', JSON.stringify(fallback));
        setSelectedGroup('Allgemein');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen', error);
    }
  };

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
    const cleanGroup = selectedGroup?.trim() || 'Allgemein';
    if (textInputValue.trim()) {
      const updatedList = [
        ...todoList,
        {
          text: textInputValue.trim(),
          completed: false,
          group: cleanGroup,
        }
      ];
      setTodoList(updatedList);
      saveTodoList(updatedList);
      setTextInputValue('');
      setModalVisible(false);
    } else {
      Alert.alert('Eingabefehler', 'Bitte einen gültigen Eintrag hinzufügen.');
    }
  };

  const toggleCompletion = (index) => {
    const updatedList = [...todoList];
    updatedList[index].completed = !updatedList[index].completed;
    setTodoList(updatedList);
    saveTodoList(updatedList);
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

  const getTodosByGroup = (groupName) => {
    return todoList.filter((todo) => todo.group === groupName);
  };

  return (
    <LinearGradient colors={['#000000', '#1c1c1e']} style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {groups
          .sort((a, b) => a.order - b.order)
          .map((group, groupIndex) => {
            const groupTodos = getTodosByGroup(group.name);
            if (!groupTodos.length && !group.showIfEmpty) return null;

            return (
              <View key={groupIndex} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{group.name || 'Unbenannt'}</Text>
                {groupTodos.map((item, index) => {
                  const absoluteIndex = todoList.findIndex(
                    t => t.text === item.text && t.group === item.group
                  );

                  return (
                    <Pressable
                      key={index}
                      onPress={() => toggleCompletion(absoluteIndex)}
                      onLongPress={() => deleteTodoItem(absoluteIndex)}
                      style={[
                        styles.todoItem,
                        item.completed && styles.completedItem,
                      ]}
                    >
                      <Text style={styles.todoText}>{item.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
      </ScrollView>

      <View style={styles.buttonview}>
        <AddButton onPress={() => setModalVisible(true)} />
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
            placeholderTextColor="#ccc"
            value={textInputValue}
            onChangeText={setTextInputValue}
          />

          <Text style={styles.modalLabel}>Gruppe:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(itemValue) => setSelectedGroup(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {groups
                .sort((a, b) => a.order - b.order)
                .map((group, index) => (
                  <Picker.Item
                    key={index}
                    label={group.name || 'Unbenannt'}
                    value={group.name}
                  />
                ))}
            </Picker>
          </View>

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
    padding: 20,
    paddingTop: 60,
    width: '100%',
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5f5f5',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingBottom: 4,
  },
  todoItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  completedItem: {
    backgroundColor: '#1ba564',
    opacity: 0.75,
  },
  todoText: {
    fontSize: 16,
    color: '#f5f5f5',
  },
  buttonview: {
    padding: 16,
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    padding: 20,
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2c2c2e',
    color: '#f5f5f5',
    padding: 16,
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
    marginBottom: 20,
    justifyContent: 'center',
    height: 60,
  },
  picker: {
    height: 60,
    color: '#000000',
    textAlign: 'center',
  },
  pickerItem: {
    color: '#f5f5f5',
    fontSize: 16,
    textAlign: 'center',
  },
  modalLabel: {
    color: '#f5f5f5',
    fontSize: 16,
    marginBottom: 6,
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
