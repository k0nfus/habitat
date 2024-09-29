import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ToDo from './components/To-Do'; 
import Tagebuch from './components/Tagebuch'; 
import Finanzen from './components/Finanzen'; 
import Einstellungen from './components/Einstellungen'; 
import { Ionicons } from '@expo/vector-icons'; 
import { StatusBar } from 'expo-status-bar'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const Tab = createBottomTabNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);  // Standard auf null gesetzt, um Ladezustand zu erkennen
  const [isLoading, setIsLoading] = useState(true);  // Ladezustand

  useEffect(() => {
    const getStartseite = async () => {
      try {
        const savedRoute = await AsyncStorage.getItem('startseite');
        if (savedRoute) {
          setInitialRoute(savedRoute);  // Gespeicherte Startseite verwenden
        } else {
          setInitialRoute('Tagebuch');  // Fallback zur Standard-Startseite
        }
      } catch (error) {
        console.error('Error loading start page', error);
        setInitialRoute('Tagebuch');  // Fallback bei Fehler
      } finally {
        setIsLoading(false);  // Ladezustand beenden
      }
    };

    getStartseite();
  }, []);

  if (isLoading || initialRoute === null) {
    return null;  // Hier kann ein Lade-Spinner oder eine andere Komponente hinzugefügt werden
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName={initialRoute}  // Die initiale Route basierend auf AsyncStorage
          screenOptions={({ route }) => ({
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'To-Do') {
                iconName = 'checkmark-done-outline'; 
              } else if (route.name === 'Tagebuch') {
                iconName = 'book-outline'; 
              } else if (route.name === 'Finanzen') {
                iconName = 'bar-chart-outline'; 
              } else if (route.name === 'Einstellungen') {
                iconName = 'settings-outline'; 
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false, 
            tabBarStyle: {
              backgroundColor: '#311b6b',
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: '#e4d0ff',
          })}
        >
          <Tab.Screen name="To-Do" component={ToDo} />
          <Tab.Screen name="Tagebuch" component={Tagebuch} />
          <Tab.Screen name="Finanzen" component={Finanzen} />
          <Tab.Screen name="Einstellungen" component={Einstellungen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
