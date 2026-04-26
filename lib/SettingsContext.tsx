import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import { getSetting, setSetting } from './db';

interface SettingsContextType {
  dailyTarget: number | null;
  setDailyTarget: (target: number) => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const targetStr = await getSetting('daily_target');
      const target = targetStr ? parseFloat(targetStr) : 50.00;
      setDailyTarget(target);
    } catch (error) {
      console.error('Error loading settings:', error);
      setDailyTarget(50.00);
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

  const value = useMemo<SettingsContextType>(() => ({
    dailyTarget,
    setDailyTarget: updateDailyTarget,
    refreshSettings: loadSettings,
    loading,
  }), [dailyTarget, loading, updateDailyTarget, loadSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};