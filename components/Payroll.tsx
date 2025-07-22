


import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './common/Card';
import { Table, Column } from './common/Table';
import { getEmployees, getPayrollRun, savePayrollRun, getTaxBands, getPayrollSettings, getFinalizedPayrollDetailsForYear, getBrandingSettings } from '../services/api';
import { Employee, PayrollData, PayslipDisplayData } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { calculatePayrollForEmployee, PayrollCalculationSettings } from '../services/payrollCalculations';
import { PayslipModal } from './payroll/PayslipModal';
import { useToast } from '../contexts/ToastContext';

export const Payroll: React.FC = () => {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslipData, setSelectedPayslipData] = useState<PayslipDisplayData | null>(null);
  const [runStatus, setRunStatus] = useState<'Draft' | 'Finalized'>('Draft');
  const [payrollSettings, setPayrollSettings] = useState<PayrollCalculationSettings | null>(null);

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const fetchPayrollPrerequisites = useCallback(async () => {
    try {
        const [taxBands, settings, emps] = await Promise.all([
            getTaxBands(),
            getPayrollSettings(),
            getEmployees(true) // Fetch employees with payroll items
        ]);
        setEmployees(emps);

        const settingsMap = settings.reduce((acc, s) => ({...acc, [s.settingKey]: parseFloat(s.settingValue)}), {} as Record<string, number>);

        setPayrollSettings({
            taxBands,
            napsaRate: settingsMap.napsa_rate,
            napsaCeiling: settingsMap.napsa_ceiling,
            nhimaRate: settingsMap.nhima_rate,
            nhimaMaxContribution: settingsMap.nhima_max_contribution
        });

    } catch (err) {
        setError('Failed to load critical payroll settings. Please configure them first.');
        console.error(err);
    }
  }, []);

  const fetchAndProcessPayroll = useCallback(async () => {
    if (!payrollSettings || employees.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const existingRun = await getPayrollRun(month, year);
      
      if (existingRun && existingRun.payrollData.length > 0) {
        setPayrollData(existingRun.payrollData);
        setRunStatus(existingRun.status as 'Draft' | 'Finalized');
      } else {
        const processedData = employees
          .filter(e => e.status === 'Active')
          .map(emp => calculatePayrollForEmployee(emp, payrollSettings));
        setPayrollData(processedData);
        setRunStatus('Draft');
      }

    } catch (err) {
      setError('Failed to load payroll data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, payrollSettings, employees]);
  
  useEffect(() => {
    fetchPayrollPrerequisites();
  }, [fetchPayrollPrerequisites]);

  useEffect(() => {
    if (payrollSettings && employees.length > 0) {
        fetchAndProcessPayroll();
    }
  }, [fetchAndProcessPayroll, payrollSettings, employees]);

  const handleSave = async (status: 'Draft' | 'Finalized') => {
    if (status === 'Finalized' && !window.confirm('Are you sure you want to finalize this payroll run? This action cannot be easily undone.')) {
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
        await savePayrollRun(month, year, payrollData, status);
        setRunStatus(status);
        addToast(`Payroll successfully saved as ${status}.`, 'success');
    } catch(err) {
        const errorMessage = 'Failed to save payroll run.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handlePreviewPayslip = async (monthlyData: PayrollData) => {
    const employee = employees.find(e => e.id === monthlyData.employeeId);
    if (!employee) {
        addToast("Could not find employee details for this payslip.", "error");
        return;
    }

    // Fetch branding and YTD data in parallel
    const [branding, ytdHistory] = await Promise.all([
        getBrandingSettings(),
        getFinalizedPayrollDetailsForYear(employee.id, year)
    ]);

    const ytdData = ytdHistory.reduce((acc, item) => {
        acc.grossYTD += item.gross_pay;
        acc.taxablePayYTD += item.taxable_income;
        acc.taxYTD += item.paye;
        acc.napsaYTD += item.napsa;
        return acc;
    }, { taxablePayYTD: 0, taxYTD: 0, napsaYTD: 0, grossYTD: 0 });
    
    // Add current month's data to YTD totals for the preview
    ytdData.grossYTD += monthlyData.grossPay;
    ytdData.taxablePayYTD += monthlyData.taxableIncome;
    ytdData.taxYTD += monthlyData.breakdown.statutory.paye;
    ytdData.napsaYTD += monthlyData.breakdown.statutory.napsa;

    const displayData: PayslipDisplayData = {
        employee,
        monthlyData,
        ytdData,
        branding,
        currency: 'ZMW',
        period: `${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        leaveData: { // Mock data as leave balance isn't tracked yet
            leaveDays: 19.00,
            leaveValue: 2046.15,
            leaveDaysTaken: 1.00
        }
    };
    setSelectedPayslipData(displayData);
  };

  const formatCurrency = (value: number) => `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns: Column<PayrollData>[] = [
    { header: 'Employee', accessor: 'employeeName' },
    { 
        header: 'Gross Pay', 
        accessor: 'grossPay', 
        render: (item) => formatCurrency(item.grossPay)
    },
    { 
        header: 'PAYE', 
        accessor: 'id', 
        render: (item) => formatCurrency(item.breakdown.statutory.paye)
    },
     { 
        header: 'NAPSA', 
        accessor: 'id', 
        render: (item) => formatCurrency(item.breakdown.statutory.napsa)
    },
    { 
        header: 'Net Pay', 
        accessor: 'netPay', 
        render: (item) => formatCurrency(item.netPay)
    },
    { header: 'Actions', accessor: 'id', render: (item) => (
        <div className="flex items-center space-x-2">
            <button onClick={() => handlePreviewPayslip(item)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Preview</button>
        </div>
    )}
  ];

  const totals = payrollData.reduce((acc, item) => {
      const totalDeductions = item.breakdown.statutory.paye + item.breakdown.statutory.napsa + item.breakdown.statutory.nhima + item.breakdown.deductions.reduce((a,b)=> a+b.amount,0)
      return {
          grossPay: acc.grossPay + item.grossPay,
          deductions: acc.deductions + totalDeductions,
          netPay: acc.netPay + item.netPay,
      }
  }, { grossPay: 0, deductions: 0, netPay: 0 });

  return (
    <>
    <Card>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-white">Monthly Payroll - {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            {runStatus === 'Finalized' && <span className="text-xs font-bold bg-green-500 text-white py-1 px-2 rounded-full ml-2">FINALIZED</span>}
        </div>
        <div className="space-x-3">
            <button onClick={() => handleSave('Draft')} disabled={isSubmitting || runStatus === 'Finalized'} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave('Finalized')} disabled={isSubmitting || runStatus === 'Finalized'} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Finalizing...' : 'Finalize & Run Payroll'}
            </button>
        </div>
      </div>
      
      {!loading && !error && payrollData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div><h4 className="text-sm text-slate-400">Total Gross Pay</h4><p className="text-lg font-bold text-blue-400">{formatCurrency(totals.grossPay)}</p></div>
              <div><h4 className="text-sm text-slate-400">Total Deductions</h4><p className="text-lg font-bold text-red-400">{formatCurrency(totals.deductions)}</p></div>
              <div><h4 className="text-sm text-slate-400">Total Net Pay</h4><p className="text-lg font-bold text-emerald-400">{formatCurrency(totals.netPay)}</p></div>
              <div><h4 className="text-sm text-slate-400">Employees Paid</h4><p className="text-lg font-bold text-white">{payrollData.length}</p></div>
          </div>
      )}

      {loading && <LoadingSpinner text="Loading Payroll Data..." />}
      {error && <p className="text-center text-red-400 py-4">{error}</p>}
      {!loading && !error && !payrollSettings && <p className="text-center text-yellow-400 py-4">Payroll settings are not loaded. Please configure them in the Settings page.</p>}
      {!loading && !error && payrollSettings && <Table columns={columns} data={payrollData} />}
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