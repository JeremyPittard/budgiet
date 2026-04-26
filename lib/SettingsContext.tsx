import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import { getSetting, setSetting } from './db';

interface SettingsContextType {
  dailyTarget: number | null;
  setDailyTarget: (target: number) => Promise<void>;
  dayStartHour: number;
  setDayStartHour: (hour: number) => Promise<void>;
  hardCap: number | null;
  setHardCap: (cap: number) => Promise<void>;
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
    } catch (error) {
      console.error('Error loading settings:', error);
      setDailyTarget(50.00);
      setDayStartHour(4);
      setHardCapState(75.00);
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

  const value = useMemo<SettingsContextType>(() => ({
    dailyTarget,
    setDailyTarget: updateDailyTarget,
    dayStartHour,
    setDayStartHour: updateDayStartHour,
    hardCap,
    setHardCap: updateHardCap,
    refreshSettings: loadSettings,
    loading,
  }), [dailyTarget, dayStartHour, hardCap, loading, updateDailyTarget, updateDayStartHour, updateHardCap, loadSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};