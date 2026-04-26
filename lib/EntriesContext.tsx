import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  addEntry,
  deleteEntry,
  getEntriesByDate,
  getTodayTotal,
  getHistory
} from './db';
import { format } from 'date-fns';

interface EntriesContextType {
  todayEntries: Array<{ id: number; amount: number; label: string; created_at: string }>;
  history: Array<{
    date: string;
    total: number;
    entries: Array<{ id: number; amount: number; label: string; created_at: string }>;
  }>;
  todayTotal: number;
  loading: boolean;
  addEntry: (amount: number, label?: string, note?: string) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  refreshToday: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType | null>(null);

export const useEntriesContext = () => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntriesContext must be used within EntriesProvider');
  }
  return context;
};

interface EntriesProviderProps {
  children: ReactNode;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children }) => {
  const [todayEntries, setTodayEntries] = useState<Array<any>>([]);
  const [history, setHistory] = useState<Array<any>>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTodayData = useCallback(async () => {
    try {
      setLoading(true);
      const [entries, total] = await Promise.all([
        getEntriesByDate(format(new Date(), 'yyyy-MM-dd')),
        getTodayTotal()
      ]);
      setTodayEntries(entries);
      setTodayTotal(total);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistoryData = useCallback(async () => {
    try {
      const historyData = await getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  useEffect(() => {
    loadTodayData();
    loadHistoryData();
  }, [loadTodayData, loadHistoryData]);

  const addEntryHandler = useCallback(async (amount: number, label: string = '', note?: string) => {
    try {
      await addEntry(amount, label, note);
      await loadTodayData();
      await loadHistoryData();
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }, [loadTodayData, loadHistoryData]);

  const deleteEntryHandler = useCallback(async (id: number) => {
    try {
      await deleteEntry(id);
      await loadTodayData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }, [loadTodayData]);

  const value = useMemo<EntriesContextType>(() => ({
    todayEntries,
    history,
    todayTotal,
    loading,
    addEntry: addEntryHandler,
    deleteEntry: deleteEntryHandler,
    refreshToday: loadTodayData,
    refreshHistory: loadHistoryData,
  }), [todayEntries, history, todayTotal, loading, addEntryHandler, deleteEntryHandler, loadTodayData, loadHistoryData]);

  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
};