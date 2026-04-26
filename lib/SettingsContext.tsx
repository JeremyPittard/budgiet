import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import { getSetting, setSetting } from './db';

interface SettingsContextType {
  dailyTarget: number | null;
  setDailyTarget: (target: number) => Promise<void>;
  dayStartHour: number;
  setDayStartHour: (hour: number) => Promise<void>;
  hardCap: number | null;
  setHardCap: (cap: number) => Promise<void>;
  carryoverEnabled: boolean;
  setCarryoverEnabled: (enabled: boolean) => Promise<void>;
  carryoverBalance: number;
  setCarryoverBalance: (balance: number) => Promise<void>;
  carryoverDays: number;
  setCarryoverDays: (days: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);
  const [dayStartHour, setDayStartHour] = useState<number>(4);
  const [hardCap, setHardCapState] = useState<number | null>(null);
  const [carryoverEnabled, setCarryoverEnabledState] = useState<boolean>(true);
  const [carryoverBalance, setCarryoverBalance] = useState<number>(0);
  const [carryoverDays, setCarryoverDays] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const targetStr = await getSetting('daily_target');
      const target = targetStr ? parseFloat(targetStr) : 50.00;
      setDailyTarget(target);

      const hourStr = await getSetting('day_start_hour');
      const hour = hourStr ? parseInt(hourStr, 10) : 4;
      setDayStartHour(hour);

      const hardCapStr = await getSetting('hard_cap');
      const defaultHardCap = target * 1.5;
      const hardCap = hardCapStr ? parseFloat(hardCapStr) : defaultHardCap;
      setHardCapState(hardCap);

      const carryoverEnabledStr = await getSetting('carryover_enabled');
      const carryoverEnabled = carryoverEnabledStr === '0' ? false : true;
      setCarryoverEnabledState(carryoverEnabled);

      const carryoverBalanceStr = await getSetting('carryover_balance');
      const carryoverBalance = carryoverBalanceStr ? parseFloat(carryoverBalanceStr) : 0;
      setCarryoverBalance(carryoverBalance);

      const carryoverDaysStr = await getSetting('carryover_days');
      const carryoverDays = carryoverDaysStr ? parseInt(carryoverDaysStr, 10) : 0;
      setCarryoverDays(carryoverDays);
    } catch (error) {
      console.error('Error loading settings:', error);
      setDailyTarget(50.00);
      setDayStartHour(4);
      setHardCapState(75.00);
      setCarryoverEnabledState(true);
      setCarryoverBalance(0);
      setCarryoverDays(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateDailyTarget = useCallback(async (target: number) => {
    try {
      await setSetting('daily_target', target.toFixed(2));
      setDailyTarget(target);
    } catch (error) {
      console.error('Error updating daily target:', error);
      throw error;
    }
  }, []);

  const updateDayStartHour = useCallback(async (hour: number) => {
    try {
      await setSetting('day_start_hour', hour.toString());
      setDayStartHour(hour);
    } catch (error) {
      console.error('Error updating day start hour:', error);
      throw error;
    }
  }, []);

  const updateHardCap = useCallback(async (cap: number) => {
    try {
      await setSetting('hard_cap', cap.toFixed(2));
      setHardCapState(cap);
    } catch (error) {
      console.error('Error updating hard cap:', error);
      throw error;
    }
  }, []);

  const updateCarryoverEnabled = useCallback(async (enabled: boolean) => {
    try {
      await setSetting('carryover_enabled', enabled ? '1' : '0');
      setCarryoverEnabledState(enabled);
    } catch (error) {
      console.error('Error updating carryover enabled:', error);
      throw error;
    }
  }, []);

  const updateCarryoverBalance = useCallback(async (balance: number) => {
    try {
      await setSetting('carryover_balance', balance.toFixed(2));
      setCarryoverBalance(balance);
    } catch (error) {
      console.error('Error updating carryover balance:', error);
      throw error;
    }
  }, []);

  const updateCarryoverDays = useCallback(async (days: number) => {
    try {
      await setSetting('carryover_days', days.toString());
      setCarryoverDays(days);
    } catch (error) {
      console.error('Error updating carryover days:', error);
      throw error;
    }
  }, []);

  const value = useMemo<SettingsContextType>(() => ({
    dailyTarget,
    setDailyTarget: updateDailyTarget,
    dayStartHour,
    setDayStartHour: updateDayStartHour,
    hardCap,
    setHardCap: updateHardCap,
    carryoverEnabled,
    setCarryoverEnabled: updateCarryoverEnabled,
    carryoverBalance,
    setCarryoverBalance: updateCarryoverBalance,
    carryoverDays,
    setCarryoverDays: updateCarryoverDays,
    refreshSettings: loadSettings,
    loading,
  }), [dailyTarget, dayStartHour, hardCap, carryoverEnabled, carryoverBalance, carryoverDays, loading, updateDailyTarget, updateDayStartHour, updateHardCap, updateCarryoverEnabled, updateCarryoverBalance, updateCarryoverDays, loadSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};