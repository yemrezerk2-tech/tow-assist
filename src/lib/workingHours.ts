import { Driver } from '@/types'

export interface WorkingHours {
  [key: string]: string[] | '24/7'
}

export type WorkingHoursInput = WorkingHours | '24/7';

function is24_7(workingHours: WorkingHoursInput): workingHours is '24/7' {
  return workingHours === '24/7';
}

/**
 * Check if driver is within their working hours 
 * Can still be manually turned offline.
 */
export function isWithinWorkingHours(workingHours: WorkingHoursInput): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString('de-DE', { weekday: 'short' }).toLowerCase().slice(0, 3);
  const currentTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (is24_7(workingHours)) return true;
  const todayHours = workingHours[currentDay];
  if (!todayHours) return false;
  if (todayHours === '24/7') return true;
  const [start, end] = todayHours;
  return currentTime >= start && currentTime <= end;
}

/**
 * Get driver status  
 * manual offline overrides working hours.
 */
export function getDriverStatus(driver: Driver): { isOnline: boolean; reason: string } {
  if (!driver.manuallyOnline) {
    return { isOnline: false, reason: 'Manually offline' };
  }

  const withinHours = isWithinWorkingHours(driver.workingHours);
  if (!withinHours) {
    return { isOnline: false, reason: 'Outside working hours' };
  }
  
  return { isOnline: true, reason: 'Online and available' };
}

export function formatWorkingHours(workingHours: WorkingHoursInput): string {
  if (is24_7(workingHours)) return '24/7 verfügbar';

  const days = {
    mon: 'Mo',
    tue: 'Di', 
    wed: 'Mi',
    thu: 'Do',
    fri: 'Fr',
    sat: 'Sa',
    sun: 'So'
  };
  
  const formatted = Object.entries(workingHours)
    .map(([day, hours]) => {
      const dayName = days[day as keyof typeof days] || day;
      if (hours === '24/7') return `${dayName}: 24/7`;
      return `${dayName}: ${hours[0]} - ${hours[1]}`;
    })
    .join(', ');
  
  return formatted;
}

export function getNextAvailableTime(workingHours: WorkingHoursInput): string | null {
  const now = new Date();
  const currentDay = now.toLocaleDateString('de-DE', { weekday: 'short' }).toLowerCase().slice(0, 3);
  const currentTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (is24_7(workingHours)) return null;
  
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const currentDayIndex = days.indexOf(currentDay);
  for (let i = 0; i < 7; i++) {
    const checkDayIndex = (currentDayIndex + i) % 7;
    const checkDay = days[checkDayIndex];
    const dayHours = workingHours[checkDay];
    
    if (!dayHours) continue;
    
    if (dayHours === '24/7') {
      return i === 0 ? 'Heute: 24/7' : `Am ${getGermanDayName(checkDay)}: 24/7`;
    }
    
    const [start] = dayHours;
    
    if (i === 0) {
      if (currentTime < start) {
        return `Heute ab ${start} Uhr`;
      }
    } else {
      return `Am ${getGermanDayName(checkDay)} ab ${start} Uhr`;
    }
  }
  
  return null;
}

function getGermanDayName(day: string): string {
  const days: { [key: string]: string } = {
    mon: 'Montag',
    tue: 'Dienstag',
    wed: 'Mittwoch', 
    thu: 'Donnerstag',
    fri: 'Freitag',
    sat: 'Samstag',
    sun: 'Sonntag'
  };
  return days[day] || day;
}