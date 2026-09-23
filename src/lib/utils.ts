import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount);
  if (isNaN(val)) return 'BDT 0';
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch (e) {
    return '-';
  }
}

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export function isWithinTimeRange(dateString: string, range: TimeRange): boolean {
  if (range === 'all') return true;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Reset times to start of day for accurate comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (range === 'today') {
    return dateDay.getTime() === nowDay.getTime();
  }
  
  if (range === 'week') {
    const startOfWeek = new Date(nowDay);
    startOfWeek.setDate(nowDay.getDate() - nowDay.getDay()); // Sunday as start
    return dateDay >= startOfWeek;
  }
  
  if (range === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  
  if (range === 'year') {
    return date.getFullYear() === now.getFullYear();
  }
  
  return true;
}
