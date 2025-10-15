import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ToDo from './components/To-Do';
import Tagebuch from './components/Tagebuch';
import Tracking from './components/Tracking';
import Einstellungen from './components/Einstellungen';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, themes } from './theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    const initialize = async () => {
      try {
        const [savedRoute, savedTheme] = await Promise.all([
          AsyncStorage.getItem('startseite'),
          AsyncStorage.getItem('appTheme'),
        ]);
        if (savedRoute) {
          setInitialRoute(savedRoute);
        } else {
          setInitialRoute('Tagebuch');
        }
        if (savedTheme && themes[savedTheme]) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Error loading app settings', error);
        setInitialRoute('Tagebuch');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const themeValue = useMemo(
    () => ({
      theme: themes[themeMode] || themes.dark,
      mode: themeMode,
      setMode: async (mode) => {
        if (!themes[mode]) return;
        setThemeMode(mode);
        try {
          await AsyncStorage.setItem('appTheme', mode);
        } catch (error) {
          console.error('Error saving theme', error);
        }
      },
    }),
    [themeMode]
  );

  if (isLoading || initialRoute === null) {
    return null;
  }

  const currentTheme = themeValue.theme;
  const navigationTheme = currentTheme.mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;

  const mergedNavigationTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: currentTheme.backgroundGradient[1],
      card: currentTheme.tabBarBackground,
      text: currentTheme.textPrimary,
      border: currentTheme.surfaceBorder,
      primary: currentTheme.accent,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={themeValue}>
        <StatusBar style={currentTheme.statusBarStyle} />
        <NavigationContainer theme={mergedNavigationTheme}>
          <Tab.Navigator
          initialRouteName={initialRoute}
          screenOptions={({ route }) => ({
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'To-Do') {
                iconName = 'checkmark-done-outline';
              } else if (route.name === 'Tagebuch') {
                iconName = 'book-outline';
              } else if (route.name === 'Tracking') {
                iconName = 'bar-chart-outline';
              } else if (route.name === 'Einstellungen') {
                iconName = 'settings-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false,
            tabBarStyle: {
              backgroundColor: currentTheme.tabBarBackground,
              borderTopColor: currentTheme.surfaceBorder,
            },
            tabBarActiveTintColor: currentTheme.tabActive,
            tabBarInactiveTintColor: currentTheme.tabInactive,
          })}
        >
            <Tab.Screen name="To-Do" component={ToDo} />
            <Tab.Screen name="Tagebuch" component={Tagebuch} />
            <Tab.Screen name="Tracking" component={Tracking} />
            <Tab.Screen name="Einstellungen" component={Einstellungen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
