import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { formatCurrency, formatDayName, formatTime } from '@/lib/formatters';
import { EntryRow } from './EntryRow';

interface DayAccordionProps {
  date: string;
  total: number;
  target: number;
  entries: Array<{
    id: number;
    amount: number;
    label: string;
    created_at: string;
  }>;
  onDeleteEntry: (id: number) => void;
}

export const DayAccordion: React.FC<DayAccordionProps> = ({
  date,
  total,
  target,
  entries,
  onDeleteEntry,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isOverBudget = total > target;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.dateText}>{formatDayName(date)}</Text>
          <Text style={[styles.totalText, isOverBudget && styles.overBudgetText]}>
            {formatCurrency(total)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={isOverBudget ? 'warning' : 'checkmark-circle'}
            size={24}
            color={isOverBudget 
              ? theme.colors.progress.overTarget 
              : theme.colors.progress.underTarget
            }
          />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.text.muted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.entriesContainer}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryItem}>
              <Text style={styles.entryLabel} numberOfLines={1}>
                {entry.label || 'Expense'}
              </Text>
              <Text style={styles.entryAmount}>
                {formatCurrency(entry.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  totalText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  overBudgetText: {
    color: theme.colors.progress.overTarget,
  },
  entriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  entryItem: {
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
  entryAmount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
});