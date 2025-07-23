

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { View } from './types';
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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <LoadingSpinner text="Loading Application..." />
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }
  
  if (profile?.role === 'employee') {
      return <EmployeePortal />;
  }

  // Admin View
  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {/* Overlay for mobile */}
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
          {activeView === 'Dashboard' && <Dashboard />}
          {activeView === 'Employees' && <EmployeeList />}
          {activeView === 'Payroll' && <Payroll />}
          {activeView === 'Leave' && <LeaveManagement />}
          {activeView === 'Reports' && <Reports />}
          {activeView === 'Policy Assistant' && <PolicyAssistant />}
          {activeView === 'Settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default App;