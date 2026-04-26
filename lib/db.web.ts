// Web fallback - uses localStorage
const STORAGE_KEY = 'budget_tracker_data';

export type Period = 'today' | 'fortnight' | 'month' | 'year';

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

let cache: StorageData = {
  settings: { daily_target: '50.00', day_start_hour: 4 },
  entries: [],
  rollovers: [],
};

const getEffectiveToday = (dayStartHour: number): string => {
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
    case 'fortnight':
      return 14;
    case 'month':
      return 30;
    case 'year':
      return isLeapYear(year) ? 366 : 365;
  }
};

export const getPeriodStartDate = (period: Period, dayStartHour: number): string => {
  const now = new Date();
  const days = getDaysInPeriod(period);
  now.setDate(now.getDate() - (days - 1));
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getEntriesByDateRange = async (startDate: string, endDate: string): Promise<Entry[]> => {
  cache = loadData();
  return cache.entries
    .filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const loadData = (): StorageData => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return { settings: { daily_target: '50.00', day_start_hour: 4 }, entries: [], rollovers: [] };
};

const saveData = (data: StorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    cache = data;
  } catch (e) {
    console.error('Error saving data:', e);
  }
};

export const db = null;

export const initDatabase = async (): Promise<void> => {
  cache = loadData();
  console.log('Web database initialized');
};

export const getSetting = async (key: string): Promise<string | null> => {
  cache = loadData();
  return cache.settings[key as keyof Settings] ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  cache = loadData();
  cache.settings = { ...cache.settings, [key]: value };
  saveData(cache);
};

export const addEntry = async (amount: number, label: string = '', note?: string): Promise<number> => {
  cache = loadData();
  const id = Date.now();
  const today = getEffectiveToday(cache.settings.day_start_hour ?? 4);
  const now = new Date().toISOString();
  cache.entries.push({ id, amount, label, date: today, created_at: now, note });
  saveData(cache);
  return id;
};

export const getEntriesByDate = async (date: string) => {
  cache = loadData();
  return cache.entries
    .filter(e => e.date === date)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const deleteEntry = async (id: number): Promise<void> => {
  cache = loadData();
  cache.entries = cache.entries.filter(e => e.id !== id);
  saveData(cache);
};

export const getTodayTotal = async (): Promise<number> => {
  cache = loadData();
  const today = getEffectiveToday(cache.settings.day_start_hour ?? 4);
  return cache.entries
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
};

export const getHistory = async () => {
  cache = loadData();
  const grouped = cache.entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
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

export const addRollover = async (fromDate: string, toDate: string, amount: number) => {
  cache = loadData();
  const id = Date.now();
  const now = new Date().toISOString();
  cache.rollovers.push({ id, from_date: fromDate, to_date: toDate, amount, confirmed_at: now, prompted_next_day: 0 });
  saveData(cache);
  return id;
};

export const getRolloverByFromDate = async (fromDate: string) => {
  cache = loadData();
  return cache.rollovers.find(r => r.from_date === fromDate) ?? null;
};

export const getRolloverByToDate = async (toDate: string) => {
  cache = loadData();
  return cache.rollovers.filter(r => r.to_date === toDate).reduce((sum, r) => sum + r.amount, 0);
};

export const markRolloverPrompted = async (fromDate: string) => {
  cache = loadData();
  const rollover = cache.rollovers.find(r => r.from_date === fromDate);
  if (rollover) {
    rollover.prompted_next_day = 1;
    saveData(cache);
  }
};

export const resetAllData = async (): Promise<void> => {
  cache = { settings: { daily_target: '50.00', day_start_hour: 4 }, entries: [], rollovers: [] };
  saveData(cache);
};