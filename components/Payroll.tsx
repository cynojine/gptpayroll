import * as React from 'react';
import { Card } from './common/Card';
import { Table, Column } from './common/Table';
import { getEmployees, getPayrollRun, savePayrollRun, getTaxBands, getPayrollSettings, getFinalizedPayrollDetailsForYear, getBrandingSettings, getLeaveBalances } from '../services/api';
import { Employee, PayrollData, PayslipDisplayData, PayrollCalculationSettings } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { calculatePayrollForEmployee } from '../services/payrollCalculations';
import { PayslipModal } from './payroll/PayslipModal';
import { useToast } from '../contexts/ToastContext';

export const Payroll: React.FC = () => {
  const { addToast } = useToast();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [payrollData, setPayrollData] = React.useState<PayrollData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPayslipData, setSelectedPayslipData] = React.useState<PayslipDisplayData | null>(null);
  const [runStatus, setRunStatus] = React.useState<'Draft' | 'Finalized'>('Draft');
  const [payrollSettings, setPayrollSettings] = React.useState<PayrollCalculationSettings | null>(null);

  const currentDate = new Date();
  const [month, setMonth] = React.useState(currentDate.getMonth() + 1);
  const [year, setYear] = React.useState(currentDate.getFullYear());

  const fetchPayrollPrerequisites = React.useCallback(async () => {
    try {
        const [taxBands, settings, emps] = await Promise.all([
            getTaxBands(),
            getPayrollSettings(),
            getEmployees(true) // Fetch employees with payroll items
        ]);
        setEmployees(emps);

        const settingsMap = settings.reduce((acc, s) => {
            const parsedValue = parseFloat(s.settingValue);
            acc[s.settingKey] = isNaN(parsedValue) ? 0 : parsedValue;
            return acc;
        }, {} as Record<string, number>);

        setPayrollSettings({
            taxBands,
            napsaRate: settingsMap.napsa_rate || 0,
            napsaCeiling: settingsMap.napsa_ceiling || 0,
            nhimaRate: settingsMap.nhima_rate || 0,
            nhimaMaxContribution: settingsMap.nhima_max_contribution || 0
        });

    } catch (err) {
        setError('Failed to load critical payroll settings. Please configure them first.');
        console.error(err);
    }
  }, []);

  const fetchAndProcessPayroll = React.useCallback(async () => {
    if (!payrollSettings || employees.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const existingRun = await getPayrollRun(month, year);
      
      if (existingRun && existingRun.payrollData.length > 0) {
        setPayrollData(existingRun.payrollData);
        setRunStatus(existingRun.status as 'Draft' | 'Finalized');
        setLoading(false);
      } else {
        // No existing run, calculate directly on the main thread
        setRunStatus('Draft');
        const activeEmployees = employees.filter(emp => emp.status === 'Active');
        const processedData = activeEmployees.map(emp => 
          calculatePayrollForEmployee(emp, payrollSettings)
        );
        setPayrollData(processedData);
        setLoading(false);
      }

    } catch (err) {
      setError('Failed to load payroll data.');
      console.error(err);
      setLoading(false);
    }
  }, [month, year, payrollSettings, employees]);
  
  React.useEffect(() => {
    fetchPayrollPrerequisites();
  }, [fetchPayrollPrerequisites]);

  React.useEffect(() => {
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

    // Fetch branding, YTD data, and leave balances in parallel
    const [branding, ytdHistory, leaveBalances] = await Promise.all([
        getBrandingSettings(),
        getFinalizedPayrollDetailsForYear(employee.id, year),
        getLeaveBalances(employee.id)
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

    // Find the annual leave balance, or the first available balance
    const annualLeaveBalance = leaveBalances.find(b => b.leaveTypeName?.toLowerCase().includes('annual'))?.balanceDays || leaveBalances[0]?.balanceDays || 0;
    const leaveValue = (employee.salary / 22) * annualLeaveBalance; // Assuming 22 working days/month

    const displayData: PayslipDisplayData = {
        employee,
        monthlyData,
        ytdData,
        branding,
        currency: 'ZMW',
        period: `${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        leaveData: {
            balance: annualLeaveBalance,
            leaveValue: leaveValue,
            leaveDaysTaken: 1.00 // Placeholder
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

      {loading && <LoadingSpinner text="Calculating Payroll..." />}
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