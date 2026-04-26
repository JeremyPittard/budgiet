import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initDatabase } from '@/lib/db';
import { EntriesProvider } from '@/lib/EntriesContext';
import { SettingsProvider } from '@/lib/SettingsContext';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { theme } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupDb = async () => {
      try {
        // Try to initialize DB - will use web/localStorage on web
        await initDatabase();
        setDbReady(true);
      } catch (err: any) {
        console.error('DB init error:', err?.message || err);
        // Still mark as ready so app can render
        // The storage will just not persist
        setDbReady(true);
      }
    };

    // Run without blocking - show loading briefly
    setupDb();
    
    // Also set ready after a timeout in case init hangs
    const timer = setTimeout(() => setDbReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <EntriesProvider>
      <SettingsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SettingsProvider>
    </EntriesProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});