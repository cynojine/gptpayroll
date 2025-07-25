import * as React from 'react';
import { Card } from './common/Card';
import { Employee, LeaveRequest, PayrollData, PayrollCalculationSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculatePayrollForEmployee } from '../services/payrollCalculations';

interface DashboardProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  payrollSettings: PayrollCalculationSettings | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ employees, leaveRequests, payrollSettings }) => {

  const totalEmployees = employees.length;
  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'Pending').length;
  
  const activeEmployees = employees.filter(e => e.status !== 'Terminated');
  
  const payrollCalculations = payrollSettings 
    ? activeEmployees.map(emp => calculatePayrollForEmployee(emp, payrollSettings))
    : [];
  
  const totalPayrollCost = payrollCalculations.reduce((sum, data) => sum + data.grossPay, 0);

  const departmentData = employees.reduce((acc, employee) => {
    const dept = employee.department || 'Unknown';
    const existing = acc.find(item => item.name === dept);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: dept, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const payrollSummary: PayrollData[] = payrollCalculations.slice(0, 5);
  
  const COLORS = ['#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#F59E0B'];

  if (!payrollSettings) {
    return (
      <Card>
        <div className="text-center text-yellow-400 p-8">
          Payroll settings have not been loaded. Please configure them on the Settings page to see dashboard analytics.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-slate-400 font-semibold">Total Employees</h3>
          <p className="text-4xl font-bold text-white mt-2">{totalEmployees}</p>
        </Card>
        <Card>
          <h3 className="text-slate-400 font-semibold">Pending Leave Requests</h3>
          <p className="text-4xl font-bold text-white mt-2">{pendingLeaves}</p>
        </Card>
        <Card>
          <h3 className="text-slate-400 font-semibold">Est. Monthly Payroll (Gross)</h3>
          <p className="text-4xl font-bold text-white mt-2">ZMW {totalPayrollCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-bold text-white mb-4">Payroll Summary (Sample)</h3>
           <ResponsiveContainer width="100%" height={300}>
                <BarChart data={payrollSummary} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="employeeName" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94A3B8" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} formatter={(value) => `ZMW ${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="grossPay" name="Gross Pay" fill="#3B82F6" />
                    <Bar dataKey="netPay" name="Net Pay" fill="#10B981" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Employees by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}/>
                </PieChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};