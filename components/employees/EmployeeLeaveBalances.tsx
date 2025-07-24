

import * as React from 'react';
import { LeaveBalance, LeaveType } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';

interface EmployeeLeaveBalancesProps {
    employeeId: string;
}

interface AdjustmentState {
    leaveTypeId: string;
    leaveTypeName: string;
    currentBalance: number;
}

export const EmployeeLeaveBalances: React.FC<EmployeeLeaveBalancesProps> = ({ employeeId }) => {
    const { addToast } = useToast();
    const [balances, setBalances] = React.useState<LeaveBalance[]>([]);
    const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [adjustment, setAdjustment] = React.useState<AdjustmentState | null>(null);
    const [newBalance, setNewBalance] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const [fetchedBalances, fetchedLeaveTypes] = await Promise.all([
                api.getLeaveBalances(employeeId),
                api.getLeaveTypes(),
            ]);
            setBalances(fetchedBalances);
            setLeaveTypes(fetchedLeaveTypes);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load leave balance data.');
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenAdjustModal = (leaveTypeId: string, leaveTypeName: string) => {
        const current = balances.find(b => b.leaveTypeId === leaveTypeId)?.balanceDays || 0;
        setAdjustment({ leaveTypeId, leaveTypeName, currentBalance: current });
        setNewBalance(current);
    };

    const handleCloseModal = () => {
        setAdjustment(null);
        setNewBalance(0);
        setError(null);
    };

    const handleAdjustBalance = async () => {
        if (!adjustment || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await api.adjustLeaveBalance(employeeId, adjustment.leaveTypeId, newBalance);
            addToast(`${adjustment.leaveTypeName} balance updated successfully!`, 'success');
            handleCloseModal();
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to adjust balance.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <LoadingSpinner text="Loading leave balances..." />;

    const getBalanceForType = (leaveTypeId: string): number => {
        return balances.find(b => b.leaveTypeId === leaveTypeId)?.balanceDays || 0;
    };

    return (
        <div>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <p className="text-sm text-slate-400 mb-4">
                View and adjust leave day balances for this employee. Use this for initial setup, annual rollovers, or corrections. Approved leave requests will automatically debit these balances.
            </p>
            <ul className="divide-y divide-slate-700">
                {leaveTypes.map(lt => (
                    <li key={lt.id} className="py-3 flex items-center justify-between">
                        <span className="font-medium text-slate-200">{lt.name}</span>
                        <div className="flex items-center space-x-4">
                            <span className="text-lg font-bold text-white">{getBalanceForType(lt.id).toFixed(2)} days</span>
                            <button
                                onClick={() => handleOpenAdjustModal(lt.id, lt.name)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                            >
                                Adjust
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {adjustment && (
                <Modal
                    isOpen={!!adjustment}
                    onClose={handleCloseModal}
                    title={`Adjust ${adjustment.leaveTypeName} Balance`}
                    maxWidth="max-w-md"
                    footer={
                        <>
                            <button onClick={handleCloseModal} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                            <button onClick={handleAdjustBalance} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">
                                {isSubmitting ? 'Saving...' : 'Save New Balance'}
                            </button>
                        </>
                    }
                >
                    <p className="mb-2">Current Balance: <span className="font-bold">{adjustment.currentBalance.toFixed(2)} days</span></p>
                    <div>
                        <label htmlFor="newBalance" className="block text-sm font-medium text-slate-300">New Balance (days)</label>
                        <input
                            type="number"
                            id="newBalance"
                            value={newBalance}
                            onChange={(e) => setNewBalance(parseFloat(e.target.value))}
                            step="0.01"
                            className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                     {error && <p className="text-red-400 mt-4">{error}</p>}
                </Modal>
            )}
        </div>
    );
};