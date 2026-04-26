import { useCallback, useEffect, useMemo } from 'react';
import { useSettings } from './useSettings';
import { getEffectiveToday, getTodayTotal } from './db';

const getYesterday = (dayStartHour: number): string => {
  const effectiveToday = getEffectiveToday(dayStartHour);
  const date = new Date(effectiveToday + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useCarryover = () => {
  const { dailyTarget, dayStartHour, hardCap, carryoverEnabled, carryoverBalance, carryoverDays, carryoverDebt, carryoverAppliesTo, setCarryoverBalance, setCarryoverDays, setCarryoverDebt, setCarryoverAppliesTo, refreshSettings } = useSettings();

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
        await setCarryoverDays(newDays);
      } else if (unusedAmount < 0) {
        const newDebt = carryoverDebt + Math.abs(unusedAmount);
        await setCarryoverDebt(newDebt);
      } else {
        await setCarryoverDays(0);
      }
    } catch (error) {
      console.error('Error initializing carryover:', error);
    }
  }, [carryoverEnabled, dailyTarget, carryoverBalance, carryoverDays, carryoverDebt, setCarryoverBalance, setCarryoverDays, setCarryoverDebt]);

  const consumeCarryover = useCallback(async (spentToday: number) => {
    if (!carryoverEnabled || dailyTarget === null) return;

    try {
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

  const effectiveHardCap = useMemo(() => {
    if (!carryoverEnabled || hardCap === null || carryoverAppliesTo !== 'hard') return hardCap;
    return hardCap - carryoverDebt;
  }, [carryoverEnabled, hardCap, carryoverDebt, carryoverAppliesTo]);

  const effectiveTarget = useMemo(() => {
    if (!carryoverEnabled || dailyTarget === null || carryoverAppliesTo !== 'soft') return dailyTarget;
    return dailyTarget - carryoverDebt;
  }, [carryoverEnabled, dailyTarget, carryoverDebt, carryoverAppliesTo]);

  const daysRemaining = useMemo(() => {
    return carryoverDays;
  }, [carryoverDays]);

  return {
    carryoverEnabled,
    carryoverBalance,
    carryoverDays,
    carryoverDebt,
    carryoverAppliesTo,
    effectiveRemaining,
    effectiveHardCap,
    effectiveTarget,
    daysRemaining,
    effectiveToday,
    initializeCarryover,
    consumeCarryover,
    refreshSettings,
  };
};