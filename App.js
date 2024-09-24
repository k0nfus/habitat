import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ToDo from './components/To-Do'; // Import der To-Do-Komponente
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Verwende Ionicons für die Symbole

const Tab = createBottomTabNavigator();

// Einfaches Tagebuch-Stub
function Tagebuch() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tagebuch</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Tagebuch" // Startet beim Tagebuch
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'To-Do') {
              iconName = 'checkmark-done-outline'; // Passendes Icon für To-Do
            } else if (route.name === 'Tagebuch') {
              iconName = 'book-outline'; // Passendes Icon für Tagebuch
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          headerShown: false, // Entfernt die Titelleiste (Header)
        })}
        tabBarOptions={{
          activeTintColor: 'tomato',
          inactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen name="To-Do" component={ToDo} />
        <Tab.Screen name="Tagebuch" component={Tagebuch} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
