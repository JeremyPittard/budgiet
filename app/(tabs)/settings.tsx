import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/lib/useSettings';
import { formatCurrency } from '@/lib/formatters';
import { resetAllData } from '@/lib/db';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { dailyTarget, setDailyTarget, loading } = useSettings();
  const [inputValue, setInputValue] = useState('');

  React.useEffect(() => {
    if (dailyTarget !== null) {
      setInputValue(dailyTarget.toFixed(2));
    }
  }, [dailyTarget]);

  const handleSave = useCallback(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid Value', 'Please enter a valid amount.');
      return;
    }
    setDailyTarget(value);
    Alert.alert('Saved', 'Daily target updated successfully.');
  }, [inputValue, setDailyTarget]);

  const handleResetAllData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all entries and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              setInputValue('50.00');
              Alert.alert('Done', 'All data has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data.');
            }
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Daily Budget Target</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>A$</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
                placeholder="50.00"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetAllData}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Currency is fixed to AUD (A$)
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  currencySymbol: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xl,
  },
  dangerButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.error,
  },
  footer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});