import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { KeyContext } from '@/contexts/keyContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [encKey, setEncKey] = useState(new ArrayBuffer);
  return (
    <KeyContext.Provider value={{encKey, setEncKey}}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="setup" options={{title: 'About'}} />
          <Stack.Screen name="main" options={{title: 'Home'}} />
          <Stack.Screen name="pass" options={{title: 'Pass'}} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </KeyContext.Provider>
  );
}
