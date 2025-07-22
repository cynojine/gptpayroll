
import dayjs from 'dayjs';
import { CompanyHoliday } from '../types';

/**
 * Calculates the number of business days between two dates, excluding weekends and a list of public holidays.
 * @param start The start date string.
 * @param end The end date string.
 * @param holidays An array of CompanyHoliday objects.
 * @returns The number of business days.
 */
export const calculateBusinessDays = (start: string, end: string, holidays: CompanyHoliday[]): number => {
    if (!start || !end) return 0;

    let count = 0;
    let current = dayjs(start);
    const endDate = dayjs(end);
    
    const holidayDates = new Set(holidays.map(h => h.holidayDate));

    if (endDate.isBefore(current)) return 0;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        const dayOfWeek = current.day(); // Sunday = 0, Saturday = 6
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayDates.has(current.format('YYYY-MM-DD'));

        if (!isWeekend && !isHoliday) {
            count++;
        }
        
        current = current.add(1, 'day');
    }
    return count;
};
