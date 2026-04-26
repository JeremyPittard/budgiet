import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { formatCurrency, formatTime } from '@/lib/formatters';

interface EntryRowProps {
  id: number;
  amount: number;
  label: string;
  createdAt: string;
  onDelete: (id: number) => void;
}

export const EntryRow: React.FC<EntryRowProps> = ({
  id,
  amount,
  label,
  createdAt,
  onDelete,
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete this ${formatCurrency(amount)} entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={styles.label} numberOfLines={1}>
          {label || 'Expense'}
        </Text>
        <Text style={styles.time}>
          {formatTime(createdAt)}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        <TouchableOpacity 
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  leftContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  time: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  amount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
});