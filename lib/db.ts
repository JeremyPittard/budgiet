// Unified database entry point - selects implementation based on platform
// Use static imports - Metro will bundle the correct file based on extension

import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

// Re-export from platform-specific module
// Note: For development, we use try-catch to handle the case where 
// the module isn't loaded yet
let _db: any = null;

// Simple sync initialization - actual init happens lazily
export const initDatabase = async (): Promise<void> => {
  if (isNative) {
    try {
      const { initDatabase: nativeInit } = await import('./db.native');
      return nativeInit();
    } catch (e) {
      console.log('Native DB not available:', e);
    }
  } else {
    try {
      const { initDatabase: webInit } = await import('./db.web');
      return webInit();
    } catch (e) {
      console.log('Web DB not available:', e);
    }
  }
};

export const getSetting = async (key: string) => {
  if (isNative) {
    const { getSetting } = await import('./db.native');
    return getSetting(key);
  } else {
    const { getSetting } = await import('./db.web');
    return getSetting(key);
  }
};

export const setSetting = async (key: string, value: string) => {
  if (isNative) {
    const { setSetting } = await import('./db.native');
    return setSetting(key, value);
  } else {
    const { setSetting } = await import('./db.web');
    return setSetting(key, value);
  }
};

export const addEntry = async (amount: number, label: string = '', note?: string) => {
  if (isNative) {
    const { addEntry } = await import('./db.native');
    return addEntry(amount, label, note);
  } else {
    const { addEntry } = await import('./db.web');
    return addEntry(amount, label, note);
  }
};

export const getEntriesByDate = async (date: string) => {
  if (isNative) {
    const { getEntriesByDate } = await import('./db.native');
    return getEntriesByDate(date);
  } else {
    const { getEntriesByDate } = await import('./db.web');
    return getEntriesByDate(date);
  }
};

export const deleteEntry = async (id: number) => {
  if (isNative) {
    const { deleteEntry } = await import('./db.native');
    return deleteEntry(id);
  } else {
    const { deleteEntry } = await import('./db.web');
    return deleteEntry(id);
  }
};

export const getTodayTotal = async () => {
  if (isNative) {
    const { getTodayTotal } = await import('./db.native');
    return getTodayTotal();
  } else {
    const { getTodayTotal } = await import('./db.web');
    return getTodayTotal();
  }
};

export const getHistory = async () => {
  if (isNative) {
    const { getHistory } = await import('./db.native');
    return getHistory();
  } else {
    const { getHistory } = await import('./db.web');
    return getHistory();
  }
};

export const addRollover = async (fromDate: string, toDate: string, amount: number) => {
  if (isNative) {
    const { addRollover } = await import('./db.native');
    return addRollover(fromDate, toDate, amount);
  } else {
    const { addRollover } = await import('./db.web');
    return addRollover(fromDate, toDate, amount);
  }
};

export const getRolloverByFromDate = async (fromDate: string) => {
  if (isNative) {
    const { getRolloverByFromDate } = await import('./db.native');
    return getRolloverByFromDate(fromDate);
  } else {
    const { getRolloverByFromDate } = await import('./db.web');
    return getRolloverByFromDate(fromDate);
  }
};

export const getRolloverByToDate = async (toDate: string) => {
  if (isNative) {
    const { getRolloverByToDate } = await import('./db.native');
    return getRolloverByToDate(toDate);
  } else {
    const { getRolloverByToDate } = await import('./db.web');
    return getRolloverByToDate(toDate);
  }
};

export const markRolloverPrompted = async (fromDate: string) => {
  if (isNative) {
    const { markRolloverPrompted } = await import('./db.native');
    return markRolloverPrompted(fromDate);
  } else {
    const { markRolloverPrompted } = await import('./db.web');
    return markRolloverPrompted(fromDate);
  }
};

export const resetAllData = async () => {
  if (isNative) {
    const { resetAllData } = await import('./db.native');
    return resetAllData();
  } else {
    const { resetAllData } = await import('./db.web');
    return resetAllData();
  }
};

export const db = null;

export { getDaysInPeriod, getPeriodStartDate, getEntriesByDateRange, Period } from './db.native';