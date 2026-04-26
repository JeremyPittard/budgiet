import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, startOfWeek, endOfWeek, isSameWeek, subWeeks } from 'date-fns';

import { theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntries } from '@/lib/useEntries';
import { useSettings } from '@/lib/useSettings';
import { formatCurrency, formatDayName } from '@/lib/formatters';
import { DayAccordion } from '@/components/DayAccordion';
import { EmptyState } from '@/components/EmptyState';

interface DayGroup {
  title: string;
  data: Array<{
    date: string;
    total: number;
    entries: Array<{
      id: number;
      amount: number;
      label: string;
      created_at: string;
    }>;
  }>;
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { history, deleteEntry, refreshHistory, refreshToday, addEntry: addEntryToContext, loading } = useEntries();
  const { dailyTarget, hardCap } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  }, [refreshHistory]);

  const toggleExpand = useCallback((date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  const handleDeleteEntry = useCallback(async (id: number) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(id);
            await refreshHistory();
          },
        },
      ]
    );
  }, [deleteEntry, refreshHistory]);

  const handleOverspendRollover = useCallback(async (type: 'soft' | 'hard', dayTotal: number, dayDate: string) => {
    const softTarget = dailyTarget ?? 50;
    const amount = type === 'soft' 
      ? dayTotal - softTarget 
      : (hardCap ? dayTotal - hardCap : 0);
    
    const typeLabel = type === 'soft' ? 'Soft' : 'Hard';
    Alert.alert(
      `Rollover ${typeLabel} Overspend`,
      `Add $${amount.toFixed(2)} to today as overspend from ${formatDayName(dayDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: async () => {
            await addEntryToContext(amount, '', 'overspend - ' + type);
            await refreshToday();
            await refreshHistory();
          },
        },
      ]
    );
  }, [dailyTarget, hardCap, refreshToday, refreshHistory, addEntryToContext]);

  // Group history by week
  const groupedHistory = React.useMemo(() => {
    const groups: DayGroup[] = [];
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    let thisWeekData: DayGroup['data'] = [];
    let lastWeekData: DayGroup['data'] = [];
    let olderData: DayGroup['data'] = [];

    history.forEach(day => {
      const dayDate = parseISO(day.date);
      if (dayDate >= currentWeekStart && dayDate <= currentWeekEnd) {
        thisWeekData.push(day);
      } else if (dayDate >= lastWeekStart && dayDate <= lastWeekEnd) {
        lastWeekData.push(day);
      } else {
        olderData.push(day);
      }
    });

    if (thisWeekData.length > 0) {
      groups.push({ title: 'This Week', data: thisWeekData });
    }
    if (lastWeekData.length > 0) {
      groups.push({ title: 'Last Week', data: lastWeekData });
    }
    if (olderData.length > 0) {
      groups.push({ title: 'Older', data: olderData });
    }

    return groups;
  }, [history]);

  const renderDayItem = ({ item }: { item: { 
    date: string;
    total: number;
    entries: Array<{ id: number; amount: number; label: string; created_at: string }>;
  }}) => {
    const isExpanded = expandedDates.has(item.date);
    const isOverBudget = item.total > (dailyTarget ?? 50);
    const isOverHard = hardCap ? item.total > hardCap : false;
    const softAmount = item.total - (dailyTarget ?? 50);
    const hardAmount = hardCap ? item.total - hardCap : 0;

    return (
      <View style={styles.dayContainer}>
        <TouchableOpacity 
          style={styles.dayHeader}
          onPress={() => toggleExpand(item.date)}
          activeOpacity={0.7}
        >
          <View style={styles.dayHeaderLeft}>
            <Text style={styles.dayDate}>{formatDayName(item.date)}</Text>
            <Text style={[styles.dayTotal, isOverBudget && styles.dayTotalOver]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={[styles.dayStatus, isOverBudget ? styles.statusOver : styles.statusUnder]}>
              {isOverBudget ? 'Over' : 'On Target'}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.entriesContainer}>
            {item.entries.map(entry => (
              <View key={entry.id} style={styles.entryRow}>
                <Text style={styles.entryLabel} numberOfLines={1}>
                  {entry.label || 'Expense'}
                </Text>
                <View style={styles.entryRight}>
                  <Text style={styles.entryAmount}>
                    {formatCurrency(entry.amount)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => handleDeleteEntry(entry.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {(isOverBudget || isOverHard) && (
              <View style={styles.rolloverContainer}>
                <Text style={styles.rolloverTitle}>Make up overspend</Text>
                <View style={styles.rolloverButtons}>
                  {isOverBudget && (
                    <TouchableOpacity 
                      style={styles.rolloverButton}
                      onPress={() => handleOverspendRollover('soft', item.total, item.date)}
                    >
                      <Text style={styles.rolloverButtonText}>
                        Soft ${softAmount.toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {isOverHard && (
                    <TouchableOpacity 
                      style={styles.rolloverButton}
                      onPress={() => handleOverspendRollover('hard', item.total, item.date)}
                    >
                      <Text style={styles.rolloverButtonText}>
                        Hard ${hardAmount.toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSection = ({ item }: { item: DayGroup }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      <FlatList
        data={item.data}
        renderItem={renderDayItem}
        keyExtractor={item => item.date}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      {history.length === 0 ? (
        <EmptyState message="No history yet" />
      ) : (
        <FlatList
          data={groupedHistory}
          renderItem={renderSection}
          keyExtractor={item => item.title}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  dayContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDate: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  dayTotal: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  dayTotalOver: {
    color: theme.colors.progress.overTarget,
  },
  dayStatus: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusUnder: {
    color: theme.colors.progress.underTarget,
  },
  statusOver: {
    color: theme.colors.progress.overTarget,
  },
  entriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
  },
  entryLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.md,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  entryAmount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  deleteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
  },
  rolloverContainer: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rolloverTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  rolloverButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rolloverButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  rolloverButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
  },
});