import { useCallback, useState, useEffect, useMemo } from 'react';
import { getSetting, setSetting } from './db';
import { useSettingsContext } from './SettingsContext';

export const useSettings = () => {
  return useSettingsContext();
};