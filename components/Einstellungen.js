import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Einstellungen() {
    const [selectedStartseite, setSelectedStartseite] = useState('Tagebuch');  // Standard auf 'Tagebuch'

    useEffect(() => {
        const getStartseite = async () => {
            const savedStartseite = await AsyncStorage.getItem('startseite');
            if (savedStartseite) {
                setSelectedStartseite(savedStartseite);
            }
        };
        getStartseite();
    }, []);

    const saveStartseite = async (startseite) => {
        setSelectedStartseite(startseite);
        await AsyncStorage.setItem('startseite', startseite);  // Speichere die Auswahl
    };

    return (
        <View style={styles.container}>
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
});
