
import React from 'react';
import { DashboardIcon, EmployeeIcon, PayrollIcon, ReportsIcon, LeaveIcon, PolicyIcon, ZambianFlag, SettingsIcon } from './icons/IconComponents';
import { useAuth } from '../contexts/AuthContext';

export type View = 'Dashboard' | 'Employees' | 'Payroll' | 'Leave' | 'Reports' | 'SQL Generator' | 'Settings';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: View;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 rounded-lg text-slate-300 transition-colors duration-200 ${
        isActive ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { profile } = useAuth();

  const navItems: { label: View; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" /> },
    { label: 'Employees', icon: <EmployeeIcon className="w-6 h-6" /> },
    { label: 'Payroll', icon: <PayrollIcon className="w-6 h-6" /> },
    { label: 'Leave', icon: <LeaveIcon className="w-6 h-6" /> },
    { label: 'Reports', icon: <ReportsIcon className="w-6 h-6" /> },
    { label: 'SQL Generator', icon: <PolicyIcon className="w-6 h-6" /> },
    { label: 'Settings', icon: <SettingsIcon className="w-6 h-6" />, adminOnly: true },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 p-4 flex flex-col shadow-2xl">
      <div className="flex items-center justify-center h-16 mb-6">
        <ZambianFlag />
      </div>
      <nav className="flex-1">
        <ul className="space-y-3">
          {navItems.map((item) => {
            if (item.adminOnly && profile?.role !== 'admin') {
              return null;
            }
            return (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={activeView === item.label}
                onClick={() => setActiveView(item.label)}
              />
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-700 text-center text-xs text-slate-500">
        {profile && (
          <p className="mb-2">
            Role: <span className="font-bold capitalize text-slate-400">{profile.role}</span>
          </p>
        )}
        <p>&copy; {new Date().getFullYear()} GPTPayroll Inc.</p>
        <p>Made for Zambia</p>
      </div>
    </aside>
  );
};
