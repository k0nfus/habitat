import React from 'react';
import { Alert, Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-web';

export default function Finanzen() {

    return (
        <View style={styles.container}>
            <View style={styles.scrollview}>
                <ScrollView>
                    <Pressable>
                        <Text style={styles.container}>Finanzen</Text>
                    </Pressable>
                </ScrollView>
            </View>
            <View style={styles.buttonview}>
                <Button title="Hinzufügen" color="#a065ec"/>
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