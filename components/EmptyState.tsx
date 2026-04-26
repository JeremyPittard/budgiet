import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = 'No expenses yet today' }) => {
  return (
    <View style={styles.container}>
      <Ionicons 
        name="receipt-outline" 
        size={48} 
        color={theme.colors.text.muted} 
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.md,
  },
});