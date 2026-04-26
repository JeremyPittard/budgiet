import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailySummary } from '@/lib/useDailySummary';
import { useEntries } from '@/lib/useEntries';
import { useSettings } from '@/lib/useSettings';

import { BudgetRing } from '@/components/BudgetRing';
import { EntryRow } from '@/components/EntryRow';
import { QuickAddForm } from '@/components/QuickAddForm';
import { EmptyState } from '@/components/EmptyState';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const { todayEntries, todayTotal, addEntry, deleteEntry, refreshToday, loading } = useEntries();
  const { dailyTarget, remaining, isOverBudget, progress, progressColor, isTargetSet } = useDailySummary();
  const { refreshSettings } = useSettings();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshToday();
      refreshSettings();
    }, [refreshToday, refreshSettings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshToday();
    setRefreshing(false);
  }, [refreshToday]);

  const handleAddEntry = useCallback(async (amount: number, label: string) => {
    try {
      await addEntry(amount, label);
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry');
    }
  }, [addEntry]);

  const handleDeleteEntry = useCallback(async (id: number) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry');
    }
  }, [deleteEntry]);

  const handleResetDay = useCallback(() => {
    Alert.alert(
      'Reset Today',
      'Are you sure you want to delete all entries for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Today', 
          style: 'destructive',
          onPress: async () => {
            for (const entry of todayEntries) {
              await deleteEntry(entry.id);
            }
          },
        },
      ]
    );
  }, [todayEntries, deleteEntry]);

  const openSettings = () => {
    Linking.openURL('track-bud://settings');
  };

  const todayDate = format(new Date(), 'EEEE, MMMM d');

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
        {/* Date Header */}
        <Text style={styles.dateHeader}>{todayDate}</Text>

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
            <BudgetRing
              spent={todayTotal}
              remaining={remaining ?? 0}
              target={dailyTarget ?? 50}
              isOverBudget={isOverBudget}
              progress={progress}
              progressColor={progressColor}
            />
          )}
        </View>

        {/* Quick Add Form */}
        <View style={styles.section}>
          <QuickAddForm onAdd={handleAddEntry} />
        </View>

        {/* Today's Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Entries</Text>
          {todayEntries.length === 0 ? (
            <EmptyState message="No expenses yet today" />
          ) : (
            todayEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                id={entry.id}
                amount={entry.amount}
                label={entry.label}
                createdAt={entry.created_at}
                onDelete={handleDeleteEntry}
              />
            ))
          )}
        </View>

        {/* Reset Day Button */}
        {todayEntries.length > 0 && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetDay}
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
    marginBottom: theme.spacing.xl,
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
});