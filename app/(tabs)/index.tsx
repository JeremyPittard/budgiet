import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettings } from "@/lib/useSettings";
import { useEntries } from "@/lib/useEntries";
import { calculateProgress, getProgressColor } from "@/lib/formatters";

import { BudgetRing } from "@/components/BudgetRing";
import { EmptyState } from "@/components/EmptyState";
import { EntryRow } from "@/components/EntryRow";
import { QuickAddForm } from "@/components/QuickAddForm";

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const { dailyTarget, hardCapAmount, refreshSettings } = useSettings();
  const { todayEntries, addEntry: addEntryToContext, deleteEntry: deleteEntryToContext } = useEntries();

  const total = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  const remaining = dailyTarget !== null ? dailyTarget - total : null;
  const isOverBudget = dailyTarget !== null ? total > dailyTarget : false;
  const progress = dailyTarget && dailyTarget > 0 ? calculateProgress(total, dailyTarget) : 0;
  const progressColor = dailyTarget ? getProgressColor(total, dailyTarget) : "#6b7280";
const isTargetSet = dailyTarget !== null && dailyTarget > 0;

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSettings();
    setRefreshing(false);
  }, [refreshSettings]);

  const handleAddEntry = useCallback(
    async (amount: number, label: string, note?: string) => {
      try {
        await addEntryToContext(amount, label, note);
      } catch (error) {
        Alert.alert("Error", "Failed to add entry");
      }
    },
    [addEntryToContext],
  );

  const handleDeleteEntry = useCallback(
    async (id: number) => {
      try {
        await deleteEntryToContext(id);
      } catch (error) {
        Alert.alert("Error", "Failed to delete entry");
      }
    },
    [deleteEntryToContext],
  );

const handleResetPeriod = useCallback(() => {
  Alert.alert(
    "Reset Today",
    "Are you sure you want to delete all entries for this period?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          for (const entry of todayEntries) {
            await deleteEntryToContext(entry.id);
          }
        },
      },
    ],
  );
  }, [todayEntries, deleteEntryToContext]);

  const openSettings = () => {
    Linking.openURL("budgiet://settings");
  };

  const getPeriodLabel = () => {
    return format(new Date(), "EEEE, MMMM d");
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "dark"].background },
      ]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* Period Selector */}
<View style={styles.card}>
          <Text style={styles.dateHeader}>{getPeriodLabel()}</Text>
          {!isTargetSet ? (
            <View style={styles.noTargetBanner}>
              <Ionicons
                name="warning-outline"
                size={24}
                color={theme.colors.progress.over80Percent}
              />
              <Text style={styles.noTargetText}>
                Set a daily target in Settings
              </Text>
              <TouchableOpacity
                onPress={openSettings}
                style={styles.noTargetButton}
              >
                <Text style={styles.noTargetButtonText}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <BudgetRing
                spent={todayEntries.reduce((sum, e) => sum + e.amount, 0)}
                remaining={remaining ?? 0}
                target={dailyTarget ?? 50}
                isOverBudget={isOverBudget}
                progress={progress}
                progressColor={progressColor}
                hardCapAmount={hardCapAmount ?? undefined}
              />
            </>
          )}
        </View>

        {/* Quick Add Form */}
        <View style={styles.section}>
          <QuickAddForm
            onAdd={handleAddEntry}
            dailyTarget={dailyTarget ?? 50}
            currentTotal={todayEntries.reduce((sum, e) => sum + e.amount, 0)}
          />
        </View>

        {/* Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Entries</Text>
          {todayEntries.length === 0 ? (
            <EmptyState message="No expenses today" />
          ) : (
            todayEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                id={entry.id}
                amount={entry.amount}
                label={entry.label}
                createdAt={entry.created_at}
                note={entry.note}
                onDelete={handleDeleteEntry}
              />
            ))
          )}
        </View>

        {/* Reset Period Button */}
        {todayEntries.length > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPeriod}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset Day</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  dateHeader: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: "center",
  },
  noTargetBanner: {
    alignItems: "center",
    gap: theme.spacing.md,
  },
  noTargetText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  noTargetButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  noTargetButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  resetButton: {
    alignSelf: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  carryoverDisplay: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  carryoverText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.accent,
  },
  carryoverDaysText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});
