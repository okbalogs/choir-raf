import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LightTheme, DarkTheme } from '../../constants/Theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync('user_theme');
      if (saved) setThemeMode(saved);
    } catch (e) {
      console.log('SecureStore read error', e);
    }
  };

  const updateTheme = async (mode) => {
    setThemeMode(mode);
    try {
      await SecureStore.setItemAsync('user_theme', mode);
    } catch (e) {
      console.log('SecureStore write error', e);
    }
  };

  const currentTheme = themeMode === 'system' 
    ? (systemColorScheme === 'dark' ? DarkTheme : LightTheme)
    : (themeMode === 'dark' ? DarkTheme : LightTheme);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeMode, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
