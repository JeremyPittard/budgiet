import React, { useCallback, useState } from "react";
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
import { resetAllData } from "@/lib/db";
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
});
