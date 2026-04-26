import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@budget_tracker_settings';
const ENTRIES_KEY = '@budget_tracker_entries';
const ROLLOVERS_KEY = '@budget_tracker_rollovers';

// Types
export type Period = 'today' | 'week' | 'fortnight' | 'month' | 'year';

interface Entry {
  id: number;
  amount: number;
  label: string;
  date: string;
  created_at: string;
  note?: string;
}

interface Rollover {
  id: number;
  from_date: string;
  to_date: string;
  amount: number;
  confirmed_at: string;
  prompted_next_day: number;
}

interface Settings {
  daily_target: string;
  day_start_hour: number;
  hard_cap?: string;
}

interface StorageData {
  settings: Settings;
  entries: Entry[];
  rollovers: Rollover[];
}

// In-memory cache
let cache: StorageData = {
  settings: { daily_target: '50.00', day_start_hour: 4 },
  entries: [],
  rollovers: [],
};

let initialized = false;

// Get today's date based on local time + day_start_hour
export const getEffectiveToday = (dayStartHour: number): string => {
  const now = new Date();
  const localHour = now.getHours();
  if (localHour < dayStartHour) {
    now.setDate(now.getDate() - 1);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getDaysInPeriod = (period: Period): number => {
  const year = new Date().getFullYear();
  switch (period) {
    case 'today':
      return 1;
    case 'week':
      return 7;
    case 'fortnight':
      return 14;
    case 'month':
      return 30;
    case 'year':
      return isLeapYear(year) ? 366 : 365;
  }
};

export const getPeriodStartDate = (period: Period, dayStartHour: number): string => {
  const effectiveToday = getEffectiveToday(dayStartHour);
  const effectiveTodayDate = new Date(effectiveToday + 'T00:00:00');
  const days = getDaysInPeriod(period);
  effectiveTodayDate.setDate(effectiveTodayDate.getDate() - (days - 1));
  
  const year = effectiveTodayDate.getFullYear();
  const month = String(effectiveTodayDate.getMonth() + 1).padStart(2, '0');
  const day = String(effectiveTodayDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getEntriesByDateRange = async (startDate: string, endDate: string): Promise<Entry[]> => {
  await initDatabase();
  return cache.entries
    .filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// Helper to load all data from storage
const loadData = async (): Promise<StorageData> => {
  try {
    const json = await AsyncStorage.getItem('budget_tracker_data');
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return { settings: { daily_target: '50.00', day_start_hour: 4 }, entries: [], rollovers: [] };
};

// Helper to save all data
const saveData = async (data: StorageData): Promise<void> => {
  try {
    await AsyncStorage.setItem('budget_tracker_data', JSON.stringify(data));
    cache = data;
  } catch (e) {
    console.error('Error saving data:', e);
    throw e;
  }
};

// Database initialization
export const initDatabase = async (): Promise<void> => {
  if (initialized) return;
  
  const data = await loadData();
  cache = data;
  initialized = true;
  console.log('Database initialized');
};

// Settings CRUD
export const getSetting = async (key: string): Promise<string | null> => {
  await initDatabase();
  const value = cache.settings[key as keyof Settings];
  return value ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  await initDatabase();
  cache.settings = { ...cache.settings, [key]: value };
  await saveData(cache);
};

// Entries CRUD
export const addEntry = async (amount: number, label: string = '', note?: string): Promise<number> => {
  await initDatabase();
  const id = Date.now();
  const today = getEffectiveToday(cache.settings.day_start_hour ?? 4);
  const now = new Date().toISOString();
  
  const entry: Entry = { id, amount, label, date: today, created_at: now, note };
  cache.entries.push(entry);
  await saveData(cache);
  return id;
};

export const getEntriesByDate = async (date: string): Promise<Entry[]> => {
  await initDatabase();
  return cache.entries
    .filter(e => e.date === date)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const deleteEntry = async (id: number): Promise<void> => {
  await initDatabase();
  cache.entries = cache.entries.filter(e => e.id !== id);
  await saveData(cache);
};

export const getTodayTotal = async (): Promise<number> => {
  await initDatabase();
  const today = getEffectiveToday(cache.settings.day_start_hour ?? 4);
  const total = cache.entries
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  return total;
};

export const getHistory = async (): Promise<Array<{ date: string; total: number; entries: Entry[] }>> => {
  await initDatabase();
  
  // Group by date
  const grouped = cache.entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);
  
  return Object.entries(grouped)
    .map(([date, entries]) => ({
      date,
      total: entries.reduce((sum, e) => sum + e.amount, 0),
      entries: entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

// Rollovers CRUD
export const addRollover = async (
  fromDate: string,
  toDate: string,
  amount: number
): Promise<number> => {
  await initDatabase();
  const id = Date.now();
  const now = new Date().toISOString();
  
  const rollover: Rollover = {
    id,
    from_date: fromDate,
    to_date: toDate,
    amount,
    confirmed_at: now,
    prompted_next_day: 0,
  };
  cache.rollovers.push(rollover);
  await saveData(cache);
  return id;
};

export const getRolloverByFromDate = async (fromDate: string): Promise<Rollover | null> => {
  await initDatabase();
  return cache.rollovers.find(r => r.from_date === fromDate) ?? null;
};

export const getRolloverByToDate = async (toDate: string): Promise<number> => {
  await initDatabase();
  return cache.rollovers
    .filter(r => r.to_date === toDate)
    .reduce((sum, r) => sum + r.amount, 0);
};

export const markRolloverPrompted = async (fromDate: string): Promise<void> => {
  await initDatabase();
  const rollover = cache.rollovers.find(r => r.from_date === fromDate);
  if (rollover) {
    rollover.prompted_next_day = 1;
    await saveData(cache);
  }
};

export const resetAllData = async (): Promise<void> => {
  cache = {
    settings: { daily_target: '50.00', day_start_hour: 4 },
    entries: [],
    rollovers: [],
  };
  await saveData(cache);
};

export const addEntryWithDate = async (amount: number, date: string, label: string = '', note?: string): Promise<number> => {
  await initDatabase();
  const id = Date.now();
  const now = new Date().toISOString();
  
  const entry: Entry = { id, amount, label, date, created_at: now, note };
  cache.entries.push(entry);
  await saveData(cache);
  return id;
};

export const deleteAllEntries = async (): Promise<void> => {
  await initDatabase();
  cache.entries = [];
  await saveData(cache);
};

// Export db as null (not using expo-sqlite)
export const db = null;