import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Einstellungen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Einstellungen</Text>
            <Text style={styles.text}>Hier können Sie Einstellungen vornehmen.</Text>
            <Text style={styles.text}></Text>
            <Text style={styles.text}>Startseite</Text>
            <Text style={styles.text}>Theme</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    text: {
        fontSize: 18,
    },
});