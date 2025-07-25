import * as React from 'react';
import { Sidebar } from './components/Sidebar';
import { View, ApplicationData, PayrollCalculationSettings } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EmployeeList } from './components/EmployeeList';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { LeaveManagement } from './components/LeaveManagement';
import { PolicyAssistant } from './components/PolicyAssistant';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/auth/Auth';
import { Settings } from './components/Settings';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { EmployeePortal } from './components/ess/EmployeePortal';
import * as api from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<View>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { session, profile, loading: authLoading } = useAuth();
  
  const [appData, setAppData] = React.useState<ApplicationData | null>(null);
  const [appDataLoading, setAppDataLoading] = React.useState(true);
  const [appDataError, setAppDataError] = React.useState<string | null>(null);

  const loadApplicationData = React.useCallback(async () => {
    setAppDataLoading(true);
    setAppDataError(null);
    try {
      const [
        employees,
        leaveRequests,
        departments,
        jobTitles,
        contractTypes,
        leaveTypes,
        payrollItems,
        taxBands,
        settings,
        holidays,
        policyDocuments
      ] = await Promise.all([
        api.getEmployees(true),
        api.getLeaveRequests(),
        api.getDepartments(),
        api.getJobTitles(),
        api.getContractTypes(),
        api.getLeaveTypes(),
        api.getPayrollItems(),
        api.getTaxBands(),
        api.getPayrollSettings(),
        api.getCompanyHolidays(new Date().getFullYear()),
        api.listPolicyDocuments()
      ]);

      const settingsMap = settings.reduce((acc, s) => {
        const parsedValue = parseFloat(s.settingValue);
        acc[s.settingKey] = isNaN(parsedValue) ? 0 : parsedValue;
        return acc;
      }, {} as Record<string, number>);

      const calcSettings: PayrollCalculationSettings = {
          taxBands,
          napsaRate: settingsMap.napsa_rate || 0,
          napsaCeiling: settingsMap.napsa_ceiling || 0,
          nhimaRate: settingsMap.nhima_rate || 0,
          nhimaMaxContribution: settingsMap.nhima_max_contribution || 0
      };

      setAppData({
        employees,
        leaveRequests,
        departments,
        jobTitles,
        contractTypes,
        leaveTypes,
        payrollItems,
        payrollSettings: calcSettings,
        holidays,
        policyDocuments,
      });

    } catch (err) {
      console.error("Failed to load application data:", err);
      setAppDataError("Failed to load critical application data. Please try refreshing.");
    } finally {
      setAppDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Only load admin data if the user is an admin
    if (session && profile?.role === 'admin') {
      loadApplicationData();
    } else if (session && profile?.role === 'employee') {
      // For employees, we don't need the heavy admin data load.
      setAppDataLoading(false);
    }
  }, [session, profile, loadApplicationData]);

  if (authLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <LoadingSpinner text="Authenticating..." />
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }
  
  if (profile?.role === 'employee') {
      return <EmployeePortal />;
  }
  
  // Admin View Loading State
  if (appDataLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <LoadingSpinner text="Loading Application Data..." />
        </div>
    );
  }
  
  if (appDataError) {
      return (
         <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-center">
            <p className="text-red-400 text-lg mb-4">{appDataError}</p>
            <button onClick={loadApplicationData} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg">
                Retry
            </button>
        </div>
      );
  }

  if (!appData) {
      return <div className="text-center text-yellow-400 p-8">Could not initialize application data.</div>
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 lg:hidden" />}

      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={activeView} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 p-6 lg:p-8">
          {activeView === 'Dashboard' && <Dashboard employees={appData.employees} leaveRequests={appData.leaveRequests} payrollSettings={appData.payrollSettings} />}
          {activeView === 'Employees' && <EmployeeList employees={appData.employees} onDataChange={loadApplicationData} />}
          {activeView === 'Payroll' && <Payroll employees={appData.employees} payrollSettings={appData.payrollSettings} onDataChange={loadApplicationData} />}
          {activeView === 'Leave' && <LeaveManagement leaveRequests={appData.leaveRequests} onDataChange={loadApplicationData} />}
          {activeView === 'Reports' && <Reports />}
          {activeView === 'Policy Assistant' && <PolicyAssistant />}
          {activeView === 'Settings' && (
            <Settings
                appData={appData}
                onDataChange={loadApplicationData}
            />
           )}
        </main>
      </div>
    </div>
  );
};

export default App;