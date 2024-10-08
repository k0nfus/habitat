import React, { useState, useEffect } from "react";
import { Button, View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function Einstellungen() {
    const [selectedStartseite, setSelectedStartseite] = useState('Tagebuch');  // Standard auf 'Tagebuch'
    const [habits, setHabits] = useState([]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedStartseite = await AsyncStorage.getItem('startseite');
                if (savedStartseite) {
                    setSelectedStartseite(savedStartseite);
                }

                const savedHabits = await AsyncStorage.getItem('habits');
                if (savedHabits) {
                    setHabits(JSON.parse(savedHabits));
                } else {
                    setHabits([]); // Starten mit einem leeren Array für Habits
                }
            } catch (error) {
                console.error('Fehler beim Laden der Einstellungen', error);
            }
        };

        loadSettings();
    }, []);

    const saveStartseite = async (startseite) => {
        try {
            setSelectedStartseite(startseite);
            await AsyncStorage.setItem('startseite', startseite);  // Speichere die Auswahl
        } catch (error) {
            console.error('Fehler beim Speichern der Startseite', error);
        }
    };

    const saveHabits = async (newHabits) => {
        try {
            setHabits(newHabits);
            await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
        } catch (error) {
            console.error('Fehler beim Speichern der Habits', error);
        }
    };

    const handleHabitChange = (index, value) => {
        const updatedHabits = [...habits];
        updatedHabits[index] = value;
        saveHabits(updatedHabits);
    };

    const addHabit = () => {
        if (habits.length < 5) {
            const updatedHabits = [...habits, ''];
            saveHabits(updatedHabits);
        } else {
            Alert.alert('Limit erreicht', 'Du kannst maximal 5 Habits hinzufügen.');
        }
    };

    const deleteHabit = (index) => {
        const updatedHabits = [...habits];
        updatedHabits.splice(index, 1);
        saveHabits(updatedHabits);
    };

    return (
        <LinearGradient
            colors={['#85C1E9', '#311b6b']} // Gleicher Hintergrundverlauf wie in den anderen Komponenten
            style={styles.container}
        >
            <ScrollView> 
                <View style={styles.settingView}>
                    <Text style={styles.text}>Startseite</Text>
                    <Pressable onPress={() => saveStartseite('To-Do')}>
                        <View style={styles.option}>
                            <Checkbox
                                style={styles.checkbox}
                                value={selectedStartseite === 'To-Do'}
                                onValueChange={() => saveStartseite('To-Do')}
                            />
                            <Text style={styles.paragraph}>To-Do-Liste</Text>
                        </View>
                    </Pressable>
                    <Pressable onPress={() => saveStartseite('Tagebuch')}>
                        <View style={styles.option}>
                            <Checkbox
                                style={styles.checkbox}
                                value={selectedStartseite === 'Tagebuch'}
                                onValueChange={() => saveStartseite('Tagebuch')}
                            />
                            <Text style={styles.paragraph}>Tagebuch</Text>
                        </View>
                    </Pressable>
                    <Pressable onPress={() => saveStartseite('Finanzen')}>
                        <View style={styles.option}>
                            <Checkbox
                                style={styles.checkbox}
                                value={selectedStartseite === 'Finanzen'}
                                onValueChange={() => saveStartseite('Finanzen')}
                            />
                            <Text style={styles.paragraph}>Finanzen</Text>
                        </View>
                    </Pressable>
                </View>
                <View style={styles.settingView}>
                    <Text style={styles.text}>Habits</Text>
                    {habits.map((habit, index) => (
                        <View key={index} style={styles.rowview}>
                            <TextInput
                                style={styles.input}
                                placeholder={`Gewohnheit ${index + 1}`}
                                value={habit}
                                onChangeText={(value) => handleHabitChange(index, value)}
                            />
                            <Button title="löschen" style={styles.button} color={'red'} onPress={() => deleteHabit(index)} />
                        </View>
                    ))}
                    {habits.length < 5 && (
                        <View style={styles.rowview}>
                            <Button title="Hinzufügen" style={styles.addButton} color={'green'} onPress={addHabit} />
                        </View>
                    )}
                </View>
            </ScrollView>
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
    button: {
        marginLeft: 8,
    },
    rowview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    settingView: {
        margin: 8,
        padding: 8,
        borderColor: '#e4d0ff',
        backgroundColor: '#e4d0ff',
        borderRadius: 6,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        marginRight: 10,
    },
    paragraph: {
        fontSize: 16,
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
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e4d0ff',
        backgroundColor: '#ffffff',
        color: '#120438',
        padding: 8,
        marginRight: 8,
    },
    addButton: {
        marginLeft: 8,
    },
});
