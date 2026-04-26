import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/lib/useSettings';
import { usePeriodSummary } from '@/lib/usePeriodSummary';
import { useCarryover } from '@/lib/useCarryover';
import { addEntry as addEntryToDb, deleteEntry as deleteEntryFromDb } from '@/lib/db';

import { BudgetRing } from '@/components/BudgetRing';
import { EntryRow } from '@/components/EntryRow';
import { QuickAddForm } from '@/components/QuickAddForm';
import { EmptyState } from '@/components/EmptyState';

type PeriodType = 'today' | 'week' | 'fortnight' | 'month' | 'year';

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'fortnight', label: 'Fortnight' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const { dailyTarget, refreshSettings } = useSettings();
  const { periodTarget, total, remaining, isOverBudget, progress, progressColor, isTargetSet, hardCapAmount, entries, refresh } = usePeriodSummary(selectedPeriod);
  const { carryoverBalance, daysRemaining, carryoverEnabled, effectiveRemaining } = useCarryover();
  
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSettings();
    setRefreshing(false);
  }, [refreshSettings]);

  const handleAddEntry = useCallback(async (amount: number, label: string, note?: string) => {
    try {
      await addEntryToDb(amount, label, note);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry');
    }
  }, [refresh]);

  const handleDeleteEntry = useCallback(async (id: number) => {
    try {
      await deleteEntryFromDb(id);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry');
    }
  }, [refresh]);

  const handleResetPeriod = useCallback(() => {
    Alert.alert(
      `Reset ${selectedPeriod === 'today' ? 'Today' : 'This ' + selectedPeriod}`,
      `Are you sure you want to delete all entries for this period?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            for (const entry of entries) {
              await deleteEntryFromDb(entry.id);
            }
          },
        },
      ]
    );
  }, [entries, selectedPeriod]);

  const openSettings = () => {
    Linking.openURL('track-bud://settings');
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return format(new Date(), 'EEEE, MMMM d');
      case 'week':
        return 'This Week';
      case 'fortnight':
        return 'This Fortnight';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]} edges={['top']}>
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
        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Header */}
        <Text style={styles.dateHeader}>{getPeriodLabel()}</Text>

        {/* Budget Ring / Summary Card */}
        <View style={styles.card}>
          {!isTargetSet ? (
            <View style={styles.noTargetBanner}>
              <Ionicons name="warning-outline" size={24} color={theme.colors.progress.over80Percent} />
              <Text style={styles.noTargetText}>
                Set a daily target in Settings
              </Text>
              <TouchableOpacity onPress={openSettings} style={styles.noTargetButton}>
                <Text style={styles.noTargetButtonText}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
) : (
            <>
              <BudgetRing
                spent={total}
                remaining={remaining ?? 0}
                target={periodTarget ?? 50}
                isOverBudget={isOverBudget}
                progress={progress}
                progressColor={progressColor}
                hardCapAmount={hardCapAmount ?? undefined}
              />
              {selectedPeriod === 'today' && carryoverEnabled && carryoverBalance > 0 && (
                <View style={styles.carryoverDisplay}>
                  <Text style={styles.carryoverText}>
                    +${carryoverBalance.toFixed(2)} carryover
                  </Text>
                  <Text style={styles.carryoverDaysText}>
                    {daysRemaining} days left
                  </Text>
                </View>
              )}
            </>
          )}
          </View>

        {/* Quick Add Form - Only for Today */}
        {selectedPeriod === 'today' && (
          <View style={styles.section}>
            <QuickAddForm 
              onAdd={handleAddEntry} 
              dailyTarget={dailyTarget ?? 50}
              currentTotal={total}
            />
          </View>
        )}

        {/* Entries for Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedPeriod === 'today' ? "Today's Entries" : `This ${selectedPeriod}`}
          </Text>
          {entries.length === 0 ? (
            <EmptyState message={`No expenses this ${selectedPeriod}`} />
          ) : (
            entries.map((entry) => (
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
        {entries.length > 0 && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetPeriod}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset {selectedPeriod === 'today' ? 'Day' : selectedPeriod}</Text>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: theme.colors.background,
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
    alignItems: 'center',
  },
  noTargetBanner: {
    alignItems: 'center',
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
    alignSelf: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  carryoverDisplay: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
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