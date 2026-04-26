import { format, parseISO } from 'date-fns';

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date formatting
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const formatDayName = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEEE MMM d');
  } catch (error) {
    console.error('Error formatting day name:', error);
    return dateString;
  }
};

// Time formatting
export const formatTime = (dateTimeString: string): string => {
  try {
    const date = parseISO(dateTimeString);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return dateTimeString;
  }
};

// Amount truncation for large values
export const truncateAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}m`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount);
};

// Progress calculation
export const calculateProgress = (spent: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min(spent / target, 1.0);
};

// Get progress ring color based on spent vs target
export const getProgressColor = (spent: number, target: number): string => {
  if (target <= 0) return '#6b7280'; // gray
  
  const ratio = spent / target;
  if (ratio >= 1.0) return '#ef4444'; // red (over budget)
  if (ratio >= 0.8) return '#f59e0b'; // amber (over 80%)
  return '#22c55e'; // green (under target)
};