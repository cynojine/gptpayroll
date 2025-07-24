import * as React from 'react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getMyLeaveRequests, getMyPayslips } from '../../services/api';
import { LeaveRequest, PayrollData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const EmployeeDashboard: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [pendingLeaves, setPendingLeaves] = React.useState<LeaveRequest[]>([]);
    const [latestPayslip, setLatestPayslip] = React.useState<(PayrollData & { period: string }) | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [leaves, payslips] = await Promise.all([
                    getMyLeaveRequests(),
                    getMyPayslips()
                ]);
                setPendingLeaves(leaves.filter(l => l.status === 'Pending'));
                setLatestPayslip(payslips.length > 0 ? payslips[0] : null);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <LoadingSpinner text="Loading your dashboard..." />;
    if (error) return <p className="text-center text-red-400 p-8">{error}</p>;

    const formatCurrency = (value: number) => `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">
                Welcome back, {profile?.firstName || profile?.lastName || 'Employee'}!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-slate-400 font-semibold">Pending Leave Requests</h3>
                    <p className="text-4xl font-bold text-white mt-2">{pendingLeaves.length}</p>
                </Card>
                <Card className="lg:col-span-2">
                    <h3 className="text-slate-400 font-semibold">Latest Payslip Summary ({latestPayslip?.period || 'N/A'})</h3>
                    {latestPayslip ? (
                        <div className="grid grid-cols-3 gap-4 mt-2 text-center">
                            <div>
                                <p className="text-sm text-slate-500">Gross Pay</p>
                                <p className="text-2xl font-bold text-blue-400">{formatCurrency(latestPayslip.grossPay)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Deductions</p>
                                <p className="text-2xl font-bold text-red-400">{formatCurrency(latestPayslip.breakdown.statutory.paye + latestPayslip.breakdown.statutory.napsa + latestPayslip.breakdown.statutory.nhima)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Net Pay</p>
                                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(latestPayslip.netPay)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 mt-6">No payslip data available yet.</p>
                    )}
                </Card>
            </div>
             <Card>
                <h3 className="text-lg font-bold text-white mb-4">Your Pending Leave Requests</h3>
                {pendingLeaves.length > 0 ? (
                <ul className="divide-y divide-slate-700">
                    {pendingLeaves.map(leave => (
                    <li key={leave.id} className="py-3 flex justify-between items-center">
                        <div>
                        <p className="font-medium text-white">{leave.leaveType}</p>
                        <p className="text-sm text-slate-400">{leave.startDate} to {leave.endDate} ({leave.days} days)</p>
                        </div>
                        <span className="font-semibold text-yellow-400">{leave.status}</span>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-slate-400 text-center py-4">You have no pending leave requests.</p>
                )}
            </Card>
        </div>
    );
};