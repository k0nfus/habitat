import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ToDo from './components/To-Do'; 
import Tagebuch from './components/Tagebuch'; 
import { Ionicons } from '@expo/vector-icons'; 
import { StatusBar } from 'expo-status-bar'; 

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Tagebuch"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'To-Do') {
                  iconName = 'checkmark-done-outline'; 
                } else if (route.name === 'Tagebuch') {
                  iconName = 'book-outline'; 
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              headerShown: false, 
              tabBarStyle: {
                backgroundColor: '#311b6b',  // Hier wird der Hintergrund des Bottom-Menüs gesetzt
              },
              tabBarActiveTintColor: 'tomato',
              tabBarInactiveTintColor: '#e4d0ff',
            })}
          >
            <Tab.Screen name="To-Do" component={ToDo} />
            <Tab.Screen name="Tagebuch" component={Tagebuch} />
          </Tab.Navigator>
        </NavigationContainer>
    </>
  );
}
