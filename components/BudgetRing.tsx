import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';
import { formatCurrency } from '@/lib/formatters';

interface BudgetRingProps {
  spent: number;
  remaining: number;
  target: number;
  isOverBudget: boolean;
  progress: number;
  progressColor: string;
}

const SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const BudgetRing: React.FC<BudgetRingProps> = ({
  spent,
  remaining,
  target,
  isOverBudget,
  progress,
  progressColor,
}) => {
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.card}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={progressColor}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      
      <View style={styles.textContainer}>
        <Text style={[styles.spentAmount, { color: progressColor }]}>
          {formatCurrency(spent)}
        </Text>
        <Text style={styles.remainingText}>
          {isOverBudget 
            ? `${formatCurrency(Math.abs(remaining))} over budget`
            : `${formatCurrency(remaining)} remaining`
          }
        </Text>
        <Text style={styles.targetText}>
          of {formatCurrency(target)} target
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    transform: [{ rotateZ: '-90deg' }],
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spentAmount: {
    fontSize: theme.typography.fontSize.huge,
    fontWeight: theme.typography.fontWeight.bold,
  },
  remainingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  targetText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
});