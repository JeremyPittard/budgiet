import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface QuickAddFormProps {
  onAdd: (amount: number, label: string) => void;
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    onAdd(numAmount, label.trim());
    setAmount('');
    setLabel('');
  };

  const isValid = amount !== '' && parseFloat(amount) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputsRow}>
        <TextInput
          style={[styles.input, styles.amountInput]}
          placeholder="0.00"
          placeholderTextColor={theme.colors.text.muted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          returnKeyType="next"
        />
        <TextInput
          style={[styles.input, styles.labelInput]}
          placeholder="Note..."
          placeholderTextColor={theme.colors.text.muted}
          maxLength={40}
          value={label}
          onChangeText={setLabel}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
          + Add
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  inputsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  amountInput: {
    width: 80,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  labelInput: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  buttonTextDisabled: {
    color: theme.colors.text.muted,
  },
});