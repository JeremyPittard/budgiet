import React, { useCallback, useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { resetAllData, addEntryWithDate, deleteAllEntries } from "@/lib/db";
import { useEntries } from "@/lib/useEntries";
import { useSettings } from "@/lib/useSettings";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const {
    dailyTarget,
    setDailyTarget,
    dayStartHour,
    setDayStartHour,
    hardCap,
    setHardCap,
    loading,
  } = useSettings();
  const [inputValue, setInputValue] = useState("");
  const [hourInputValue, setHourInputValue] = useState("");
  const [hardCapInputValue, setHardCapInputValue] = useState("");
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  const { refreshToday, refreshHistory } = useEntries();

  React.useEffect(() => {
    if (dailyTarget !== null) {
      setInputValue(dailyTarget.toFixed(2));
    }
  }, [dailyTarget]);

  React.useEffect(() => {
    setHourInputValue(dayStartHour.toString());
  }, [dayStartHour]);

  React.useEffect(() => {
    if (hardCap !== null) {
      setHardCapInputValue(hardCap.toFixed(2));
    }
  }, [hardCap]);

  const handleSave = useCallback(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0) {
      Alert.alert("Invalid Value", "Please enter a valid amount.");
      return;
    }
    setDailyTarget(value);
    Alert.alert("Saved", "Daily target updated successfully.");
  }, [inputValue, setDailyTarget]);

  const handleSaveHour = useCallback(() => {
    const hour = parseInt(hourInputValue, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert("Invalid Hour", "Please enter a number between 0 and 23.");
      return;
    }
    setDayStartHour(hour);
    Alert.alert("Saved", "Day start hour updated successfully.");
  }, [hourInputValue, setDayStartHour]);

  const handleSaveHardCap = useCallback(() => {
    const value = parseFloat(hardCapInputValue);
    if (isNaN(value) || value < 0) {
      Alert.alert("Invalid Value", "Please enter a valid amount.");
      return;
    }
    setHardCap(value);
    Alert.alert("Saved", "Hard cap updated successfully.");
  }, [hardCapInputValue, setHardCap]);

  const handleResetAllData = useCallback(() => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all entries and settings. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAllData();
              setInputValue("50.00");
              Alert.alert("Done", "All data has been reset.");
            } catch (error) {
              Alert.alert("Error", "Failed to reset data.");
            }
          },
        },
      ],
    );
  }, []);

  const handleGenerateTestData = useCallback(async () => {
    setIsGeneratingTestData(true);
    try {
      for (let i = -29; i <= 0; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const numEntries = Math.floor(Math.random() * 4) + 1;
        let remaining = Math.floor(Math.random() * 300) + 200;
        
        for (let j = 0; j < numEntries - 1; j++) {
          const amount = Math.floor(Math.random() * (remaining / 2)) + 10;
          await addEntryWithDate(amount, dateStr);
          remaining -= amount;
        }
        if (remaining > 0) {
          await addEntryWithDate(remaining, dateStr);
        }
      }
      await refreshToday();
      await refreshHistory();
      Alert.alert('Done', 'Test data generated (30 days).');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate test data.');
    } finally {
      setIsGeneratingTestData(false);
    }
  }, [refreshToday, refreshHistory]);

  const handleClearTestData = useCallback(() => {
    Alert.alert(
      'Clear Test Data',
      'This will delete all entries. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllEntries();
              await refreshToday();
              await refreshHistory();
              Alert.alert('Done', 'All entries deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ],
    );
  }, [refreshToday, refreshHistory]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "dark"].background },
      ]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Daily Budget Target</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>$</Text>
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
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Hard Cap</Text>
            <Text style={styles.helperText}>
              Visual reference limit (optional)
            </Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={hardCapInputValue}
                onChangeText={setHardCapInputValue}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveHardCap}
                placeholder="75.00"
                placeholderTextColor={theme.colors.text.muted}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveHardCap}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Day Starts At</Text>
            <Text style={styles.helperText}>
              New day begins at this time (24hr)
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={hourInputValue}
                onChangeText={setHourInputValue}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="4"
                placeholderTextColor={theme.colors.text.muted}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value="00"
                keyboardType="number-pad"
                maxLength={2}
                editable={false}
                placeholderTextColor={theme.colors.text.muted}
              />
              <View style={styles.spacer} />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveHour}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {__DEV__ && (
            <View style={styles.section}>
              <Text style={styles.label}>Test Data (Dev Only)</Text>
              <View style={styles.devButtonsRow}>
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={handleGenerateTestData}
                  disabled={isGeneratingTestData}
                  activeOpacity={0.7}
                >
                  <Text style={styles.devButtonText}>
                    {isGeneratingTestData ? 'Generating...' : 'Generate Test Data'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devButton, styles.devButtonDanger]}
                  onPress={handleClearTestData}
                  activeOpacity={0.7}
                >
                  <Text style={styles.devButtonTextDanger}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.dividerBottom} />

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetAllData}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
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
    paddingBottom: theme.spacing.xxl + 8,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.xs,
  },
  timeInput: {
    flex: 0,
    width: 40,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  currencyPrefix: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
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
  dividerBottom: {
    marginTop: "auto",
  },
  dangerButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.error,
  },
  helperText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.sm,
  },
  suffixText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: "center",
  },
  toggleLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleButtonEnabled: {
    backgroundColor: theme.colors.accent,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.background,
  },
  toggleKnobEnabled: {
    alignSelf: 'flex-end',
  },
  carryoverInfo: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
  },
  carryoverInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  appliesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  appliesLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  appliesButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  appliesButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  appliesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  appliesTextActive: {
    color: theme.colors.background,
  },
  devButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  devButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  devButtonDanger: {
    backgroundColor: theme.colors.error + '20',
  },
  devButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
  },
  devButtonTextDanger: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error,
  },
});
