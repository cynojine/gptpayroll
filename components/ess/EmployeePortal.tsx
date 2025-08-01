import * as React from 'react';
import { EmployeeSidebar } from './EmployeeSidebar';
import { Header } from '../Header';
import { EmployeeDashboard } from './EmployeeDashboard';
import { MyProfile } from './MyProfile';
import { MyPayslips } from './MyPayslips';
import { MyLeave } from './MyLeave';
import { EssView } from '../../types';
import { MyDocuments } from './MyDocuments';

export const EmployeePortal: React.FC = () => {
    const [activeView, setActiveView] = React.useState<EssView>('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    
    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            {/* Overlay for mobile */}
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 lg:hidden" />}
            
            <EmployeeSidebar 
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
                    {activeView === 'Dashboard' && <EmployeeDashboard />}
                    {activeView === 'My Profile' && <MyProfile />}
                    {activeView === 'My Payslips' && <MyPayslips />}
                    {activeView === 'My Leave' && <MyLeave />}
                    {activeView === 'My Documents' && <MyDocuments />}
                </main>
            </div>
        </div>
    );
};