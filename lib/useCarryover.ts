import { useCallback, useEffect, useMemo } from 'react';
import { useSettings } from './useSettings';
import { getEffectiveToday, getTodayTotal } from './db';

const MAX_CARRYOVER_DAYS = 3;

const getYesterday = (dayStartHour: number): string => {
  const effectiveToday = getEffectiveToday(dayStartHour);
  const date = new Date(effectiveToday + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useCarryover = () => {
  const { dailyTarget, dayStartHour, carryoverEnabled, carryoverBalance, carryoverDays, setCarryoverBalance, setCarryoverDays, refreshSettings } = useSettings();

  const effectiveToday = useMemo(() => getEffectiveToday(dayStartHour), [dayStartHour]);
  const yesterday = useMemo(() => getYesterday(dayStartHour), [dayStartHour]);

  const initializeCarryover = useCallback(async () => {
    if (!carryoverEnabled || dailyTarget === null) return;

    try {
      const yesterdayTotal = await getTodayTotal();
      const unusedAmount = dailyTarget - yesterdayTotal;

      if (unusedAmount > 0) {
        const newBalance = carryoverBalance + unusedAmount;
        await setCarryoverBalance(newBalance);

        const newDays = carryoverDays + 1;
        await setCarryoverDays(Math.min(newDays, MAX_CARRYOVER_DAYS));
      } else {
        await setCarryoverDays(0);
      }
    } catch (error) {
      console.error('Error initializing carryover:', error);
    }
  }, [carryoverEnabled, dailyTarget, carryoverBalance, carryoverDays, setCarryoverBalance, setCarryoverDays]);

  const consumeCarryover = useCallback(async (spentToday: number) => {
    if (!carryoverEnabled || dailyTarget === null) return;

    try {
      const effectiveTodayStr = getEffectiveToday(dayStartHour);
      const carryoverToUse = Math.min(carryoverBalance, dailyTarget - spentToday);

      if (carryoverToUse > 0 && spentToday < dailyTarget) {
        const remainingFromDaily = dailyTarget - spentToday;
        const usedCarryover = Math.min(carryoverBalance, remainingFromDaily);

        if (usedCarryover > 0) {
          const newBalance = Math.max(0, carryoverBalance - usedCarryover);
          await setCarryoverBalance(newBalance);
        }
      }
    } catch (error) {
      console.error('Error consuming carryover:', error);
    }
  }, [carryoverEnabled, dailyTarget, carryoverBalance, dayStartHour, setCarryoverBalance]);

  const effectiveRemaining = useMemo(() => {
    if (!carryoverEnabled || dailyTarget === null) return null;
    return dailyTarget + carryoverBalance;
  }, [carryoverEnabled, dailyTarget, carryoverBalance]);

  const daysRemaining = useMemo(() => {
    return Math.max(0, MAX_CARRYOVER_DAYS - carryoverDays);
  }, [carryoverDays]);

  return {
    carryoverEnabled,
    carryoverBalance,
    carryoverDays,
    effectiveRemaining,
    daysRemaining,
    effectiveToday,
    initializeCarryover,
    consumeCarryover,
    refreshSettings,
  };
};