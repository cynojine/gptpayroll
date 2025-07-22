


import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getMyPayslips, getEmployeeDataForUser, getFinalizedPayrollDetailsForYear, getBrandingSettings } from '../../services/api';
import { PayrollData, PayslipDisplayData } from '../../types';
import { PayslipModal } from '../payroll/PayslipModal';
import { PayrollIcon } from '../icons/IconComponents';
import { useToast } from '../../contexts/ToastContext';

export const MyPayslips: React.FC = () => {
    const [payslips, setPayslips] = useState<(PayrollData & { period: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayslipData, setSelectedPayslipData] = useState<PayslipDisplayData | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getMyPayslips();
                setPayslips(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load your payslip history.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [addToast]);

    const handleViewDetails = async (monthlyData: PayrollData & { period: string }) => {
        setIsModalLoading(true);
        try {
            const [employee, branding] = await Promise.all([
                getEmployeeDataForUser(),
                getBrandingSettings()
            ]);

            if (!employee) {
                addToast("Could not find your employee details.", "error");
                setIsModalLoading(false);
                return;
            }

            const year = parseInt(monthlyData.period.split(' ')[1], 10);
            const monthName = monthlyData.period.split(' ')[0];
            const monthIndex = new Date(Date.parse(monthName +" 1, 2012")).getMonth();
            const currentPayslipMonth = monthIndex + 1;
            
            const ytdHistory = await getFinalizedPayrollDetailsForYear(employee.id, year);
            
            const ytdData = ytdHistory.reduce((acc, item) => {
                if ((item as any).payroll_run.month <= currentPayslipMonth) {
                    acc.grossYTD += item.gross_pay;
                    acc.taxablePayYTD += item.taxable_income;
                    acc.taxYTD += item.paye;
                    acc.napsaYTD += item.napsa;
                }
                return acc;
            }, { taxablePayYTD: 0, taxYTD: 0, napsaYTD: 0, grossYTD: 0 });


            const displayData: PayslipDisplayData = {
                employee,
                monthlyData,
                ytdData,
                branding,
                currency: 'ZMW',
                period: monthlyData.period,
                leaveData: { // Mock data as in Payroll.tsx
                    leaveDays: 19.00,
                    leaveValue: 2046.15,
                    leaveDaysTaken: 1.00
                }
            };

            setSelectedPayslipData(displayData);

        } catch (err) {
            console.error(err);
            addToast("Failed to prepare payslip details.", "error");
        } finally {
            setIsModalLoading(false);
        }
    };

    const formatCurrency = (value: number) => `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return <LoadingSpinner text="Loading your payslips..." />;
    if (error) return <p className="text-center text-red-400 p-8">{error}</p>;

    return (
        <>
            <Card>
                <h2 className="text-2xl font-bold text-white mb-6">Your Payslip History</h2>
                {payslips.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <PayrollIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                        <h3 className="text-xl font-semibold">No Payslips Found</h3>
                        <p>Your finalized payslips will appear here once payroll is run.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-700">
                        {payslips.map(payslip => (
                            <li key={payslip.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-semibold text-white">{payslip.period}</p>
                                    <div className="flex space-x-6 text-sm text-slate-400 mt-1">
                                        <span>Gross: <span className="font-mono text-blue-400">{formatCurrency(payslip.grossPay)}</span></span>
                                        <span>Net: <span className="font-mono text-emerald-400">{formatCurrency(payslip.netPay)}</span></span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleViewDetails(payslip)}
                                    disabled={isModalLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isModalLoading ? 'Loading...' : 'View Details'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {selectedPayslipData && (
                <PayslipModal
                    isOpen={!!selectedPayslipData}
                    onClose={() => setSelectedPayslipData(null)}
                    data={selectedPayslipData}
                />
            )}
        </>
    );
};