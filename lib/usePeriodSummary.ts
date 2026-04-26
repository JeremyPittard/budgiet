import { useMemo, useState, useEffect } from 'react';
import { useSettings } from './useSettings';
import { calculateProgress, getProgressColor } from './formatters';
import { getEntriesByDateRange, getPeriodStartDate, getDaysInPeriod, Period } from './db';

export const usePeriodSummary = (period: Period) => {
  const { dailyTarget, dayStartHour, hardCap } = useSettings();
  const [entries, setEntries] = useState<Array<{ id: number; amount: number; label: string; date: string; created_at: string; note?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const startDate = getPeriodStartDate(period, dayStartHour);
        
        const days = getDaysInPeriod(period);
        const now = new Date();
        const end = new Date(now);
        end.setDate(end.getDate() - (days - 1));
        const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
        
        const fetchedEntries = await getEntriesByDateRange(startDate, endDateStr);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error('Error loading period entries:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [period, dayStartHour]);

  const total = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const periodTarget = useMemo(() => {
    if (!dailyTarget) return null;
    const days = getDaysInPeriod(period);
    return dailyTarget * days;
  }, [dailyTarget, period]);

  const hardCapAmount = useMemo(() => {
    if (!hardCap) return null;
    const days = getDaysInPeriod(period);
    return hardCap * days;
  }, [hardCap, period]);

  const remaining = useMemo(() => {
    if (periodTarget === null) return null;
    return periodTarget - total;
  }, [periodTarget, total]);

  const isOverBudget = useMemo(() => {
    if (periodTarget === null) return false;
    return total > periodTarget;
  }, [periodTarget, total]);

  const progress = useMemo(() => {
    if (!periodTarget || periodTarget <= 0) return 0;
    return calculateProgress(total, periodTarget);
  }, [periodTarget, total]);

  const progressColor = useMemo(() => {
    if (!periodTarget) return '#6b7280';
    return getProgressColor(total, periodTarget);
  }, [periodTarget, total]);

  const isTargetSet = periodTarget !== null && periodTarget > 0;

  const periodLabel = period === 'today' ? 'day' : period;

  return useMemo(() => ({
    entries,
    total,
    periodTarget,
    hardCapAmount,
    remaining,
    isOverBudget,
    progress,
    progressColor,
    periodLabel,
    isTargetSet,
    loading,
  }), [entries, total, periodTarget, hardCapAmount, remaining, isOverBudget, progress, progressColor, periodLabel, isTargetSet, loading]);
};