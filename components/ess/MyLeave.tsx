

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LeaveRequest, LeaveType, LeaveRequestFormData, LeaveBalance, CompanyHoliday } from '../../types';
import * as api from '../../services/api';
import { Table, Column } from '../common/Table';
import { calculateBusinessDays } from '../../services/leaveCalculations';

export const MyLeave: React.FC = () => {
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
    });
    const [calculatedDays, setCalculatedDays] = useState(0);
    
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const currentYear = new Date().getFullYear();
            const [fetchedHistory, fetchedLeaveTypes, fetchedBalances, fetchedHolidays] = await Promise.all([
                api.getMyLeaveRequests(),
                api.getLeaveTypes(),
                api.getMyLeaveBalances(),
                api.getCompanyHolidays(currentYear)
            ]);
            setHistory(fetchedHistory);
            setLeaveTypes(fetchedLeaveTypes);
            setLeaveBalances(fetchedBalances);
            setHolidays(fetchedHolidays);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load your leave information.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const days = calculateBusinessDays(formData.startDate, formData.endDate, holidays);
        setCalculatedDays(days);
    }, [formData.startDate, formData.endDate, holidays]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentBalance = leaveBalances.find(b => b.leaveTypeId === formData.leaveTypeId)?.balanceDays || 0;

        if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || calculatedDays <= 0) {
            setError("Please fill all fields correctly. Number of days must be greater than zero.");
            return;
        }
        if (calculatedDays > currentBalance) {
            setError("Your leave request exceeds your available balance for this leave type.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        
        try {
            const submissionData: LeaveRequestFormData = {
                ...formData,
                days: calculatedDays,
            };
            await api.createLeaveRequest(submissionData);
            setFormData({ leaveTypeId: '', startDate: '', endDate: '' });
            await loadData(); // Refresh history
        } catch (err) {
            console.error(err);
            setError("An error occurred while submitting your request.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const columns: Column<LeaveRequest>[] = [
        { header: 'Leave Type', accessor: 'leaveType' },
        { header: 'Start Date', accessor: 'startDate' },
        { header: 'End Date', accessor: 'endDate' },
        { header: 'Days', accessor: 'days' },
        {
          header: 'Status',
          accessor: 'status',
          render: (item) => {
            const color = item.status === 'Approved' ? 'text-green-400' : item.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400';
            return <span className={`font-semibold ${color}`}>{item.status}</span>;
          },
        },
    ];

    const currentBalance = leaveBalances.find(b => b.leaveTypeId === formData.leaveTypeId)?.balanceDays;

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-2xl font-bold text-white mb-4">Apply for Leave</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="leaveTypeId" className="block text-sm font-medium">Leave Type</label>
                        <select id="leaveTypeId" name="leaveTypeId" value={formData.leaveTypeId} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="" disabled>Select a type...</option>
                            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                        </select>
                        {formData.leaveTypeId && (
                            <p className="text-xs text-slate-400 mt-1">
                                Balance: <span className="font-bold text-white">{currentBalance !== undefined ? `${currentBalance.toFixed(2)} days` : 'N/A'}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium">End Date</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div className="flex flex-col items-start space-y-2">
                        <p className="text-sm text-slate-400">Calculated Days: <span className="font-bold text-lg text-white">{calculatedDays}</span></p>
                        <button type="submit" disabled={isSubmitting || calculatedDays <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </Card>
            <Card>
                <h2 className="text-2xl font-bold text-white mb-6">Your Leave History</h2>
                {loading ? (
                    <LoadingSpinner />
                ) : history.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">You have no leave history.</p>
                ) : (
                    <Table columns={columns} data={history} />
                )}
            </Card>
        </div>
    );
};