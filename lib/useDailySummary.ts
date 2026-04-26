import { useMemo } from 'react';
import { useEntries } from './useEntries';
import { useSettings } from './useSettings';
import { calculateProgress, getProgressColor } from './formatters';

export const useDailySummary = () => {
  const { todayTotal, todayEntries } = useEntries();
  const { dailyTarget } = useSettings();

  const effectiveTarget = useMemo(() => {
    if (!dailyTarget) return null;
    return dailyTarget;
  }, [dailyTarget]);

  const remaining = useMemo(() => {
    if (!dailyTarget) return null;
    return dailyTarget - todayTotal;
  }, [dailyTarget, todayTotal]);

  const isOverBudget = useMemo(() => {
    if (!dailyTarget) return false;
    return todayTotal > dailyTarget;
  }, [dailyTarget, todayTotal]);

  const progress = useMemo(() => {
    if (!dailyTarget || dailyTarget <= 0) return 0;
    return calculateProgress(todayTotal, dailyTarget);
  }, [dailyTarget, todayTotal]);

  const progressColor = useMemo(() => {
    if (!dailyTarget) return '#6b7280';
    return getProgressColor(todayTotal, dailyTarget);
  }, [dailyTarget, todayTotal]);

  const isTargetSet = dailyTarget !== null && dailyTarget > 0;

  return useMemo(() => ({
    todayTotal,
    remaining,
    isOverBudget,
    progress,
    progressColor,
    dailyTarget,
    effectiveTarget,
    isTargetSet,
  }), [todayTotal, remaining, isOverBudget, progress, progressColor, dailyTarget, effectiveTarget, isTargetSet]);
};