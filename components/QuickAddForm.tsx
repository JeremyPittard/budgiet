import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { theme } from '@/constants/theme';
import { getTodayTotal } from '@/lib/db';

interface QuickAddFormProps {
  onAdd: (amount: number, label: string, note?: string) => void;
  dailyTarget: number;
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({ onAdd, dailyTarget }) => {
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [currentTotal, setCurrentTotal] = useState(0);
  const [noteRequired, setNoteRequired] = useState(false);

  useEffect(() => {
    const loadTodayTotal = async () => {
      const total = await getTodayTotal();
      setCurrentTotal(total);
    };
    loadTodayTotal();
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    
    if (value) {
      const numAmount = parseFloat(value);
      const newTotal = currentTotal + (isNaN(numAmount) ? 0 : numAmount);
      if (newTotal > dailyTarget) {
        setNoteRequired(true);
      } else {
        setNoteRequired(false);
        setNote('');
      }
    } else {
      setNoteRequired(false);
      setNote('');
    }
  }, [currentTotal, dailyTarget]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    const newTotal = currentTotal + numAmount;

    if (newTotal > dailyTarget && !note.trim()) {
      Alert.alert('Note Required', 'Please add a note explaining this expense over your daily target.');
      return;
    }

    const noteToSave = newTotal > dailyTarget ? note.trim() : undefined;
    onAdd(numAmount, label.trim(), noteToSave);
    setAmount('');
    setLabel('');
    setNote('');
    setNoteRequired(false);
    setCurrentTotal(newTotal);
  };

  const showNoteError = noteRequired && !note.trim();
  const showAmountError = amount !== '' && parseFloat(amount) <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputsRow}>
        <Text style={styles.currencyPrefix}>$</Text>
        <TextInput
          style={[styles.input, showAmountError && styles.inputError]}
          placeholder="0.00"
          placeholderTextColor={theme.colors.text.muted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={handleAmountChange}
          returnKeyType="next"
        />
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.7}>
            <Text style={styles.buttonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {showAmountError && (
        <Text style={styles.errorText}>Enter a valid amount</Text>
      )}
      
      {noteRequired && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Required: Why over budget?</Text>
          <TextInput
            style={[styles.noteInput, showNoteError && styles.inputError]}
            placeholder="Enter note..."
            placeholderTextColor={theme.colors.text.muted}
            maxLength={100}
            value={note}
            onChangeText={setNote}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {showNoteError && (
            <Text style={styles.errorText}>Note is required when over budget</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  currencyPrefix: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    minWidth: 60,
    maxWidth: 80,
    textAlign: 'center',
    minHeight: 42,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  currencyPrefix: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  noteContainer: {
    marginTop: theme.spacing.sm,
  },
  noteLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.progress.overTarget,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  noteInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
});