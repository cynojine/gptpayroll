

import * as React from 'react';
import { CompanyHoliday } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

export const HolidayManager: React.FC = () => {
    const { addToast } = useToast();
    const [holidays, setHolidays] = React.useState<CompanyHoliday[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const currentYear = new Date().getFullYear();
    const [year, setYear] = React.useState(currentYear);

    const [newHoliday, setNewHoliday] = React.useState({ name: '', date: '' });

    const loadHolidays = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getCompanyHolidays(year);
            setHolidays(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load holidays.');
        } finally {
            setLoading(false);
        }
    }, [year]);

    React.useEffect(() => {
        loadHolidays();
    }, [loadHolidays]);

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.name || !newHoliday.date || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await api.createCompanyHoliday(newHoliday.name, newHoliday.date);
            addToast('Holiday added successfully!', 'success');
            setNewHoliday({ name: '', date: '' });
            await loadHolidays();
        } catch (err: any) {
            setError(err.message || 'Failed to add holiday. Date may already exist.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this holiday?')) {
            try {
                await api.deleteCompanyHoliday(id);
                addToast('Holiday deleted.', 'success');
                await loadHolidays();
            } catch (err: any) {
                setError(err.message || 'Failed to delete holiday.');
            }
        }
    };

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
            <h3 className="text-lg font-bold mb-4">Company Holiday Management</h3>
            
            <div className="mb-6 flex items-center space-x-4">
                <label htmlFor="year-select" className="font-medium">Select Year:</label>
                <select 
                    id="year-select"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white"
                >
                    {Array.from({ length: 10 }, (_, i) => currentYear + 2 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <form onSubmit={handleAddHoliday} className="mb-6 flex items-end space-x-3">
                <div className="flex-grow">
                    <label htmlFor="holiday-name" className="block text-sm font-medium text-slate-300">Holiday Name</label>
                    <input
                        id="holiday-name"
                        type="text"
                        value={newHoliday.name}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white"
                        placeholder="e.g., Independence Day"
                        required
                    />
                </div>
                 <div className="flex-grow">
                    <label htmlFor="holiday-date" className="block text-sm font-medium text-slate-300">Date</label>
                    <input
                        id="holiday-date"
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500"
                >
                    {isSubmitting ? 'Adding...' : 'Add Holiday'}
                </button>
            </form>

            {error && <p className="text-red-400 mb-4">{error}</p>}
            
            {loading ? <LoadingSpinner /> : (
                <div className="flow-root">
                    <ul role="list" className="divide-y divide-slate-700">
                        {holidays.length > 0 ? holidays.map((holiday) => (
                            <li key={holiday.id} className="py-3 sm:py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-200 truncate">{holiday.name}</p>
                                    <p className="text-sm text-slate-400">{new Date(holiday.holidayDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <button onClick={() => handleDeleteHoliday(holiday.id)} className="text-red-500 hover:text-red-400 font-medium text-sm">Delete</button>
                            </li>
                        )) : <p className="text-center text-slate-500 py-4">No holidays defined for {year}.</p>}
                    </ul>
                </div>
            )}
        </div>
    );
};