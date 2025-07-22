

import React, { useState } from 'react';
import { EmployeeSidebar } from './EmployeeSidebar';
import { Header } from '../Header';
import { EmployeeDashboard } from './EmployeeDashboard';
import { MyProfile } from './MyProfile';
import { MyPayslips } from './MyPayslips';
import { MyLeave } from './MyLeave';
import { EssView } from '../../types';
import { MyDocuments } from './MyDocuments';

export const EmployeePortal: React.FC = () => {
    const [activeView, setActiveView] = useState<EssView>('Dashboard');
    
    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            <EmployeeSidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header currentView={activeView} />
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