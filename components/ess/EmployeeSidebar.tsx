


import React from 'react';
import { DashboardIcon, EmployeeIcon, PayrollIcon, LeaveIcon, DocumentIcon } from '../icons/IconComponents';
import { ZambianFlag } from '../icons/IconComponents';
import { useAuth } from '../../contexts/AuthContext';
import { EssView } from '../../types';

interface SidebarProps {
  activeView: EssView;
  setActiveView: (view: EssView) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: EssView;
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

export const EmployeeSidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { profile } = useAuth();
  
  const navItems: { label: EssView; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" /> },
    { label: 'My Profile', icon: <EmployeeIcon className="w-6 h-6" /> },
    { label: 'My Payslips', icon: <PayrollIcon className="w-6 h-6" /> },
    { label: 'My Leave', icon: <LeaveIcon className="w-6 h-6" /> },
    { label: 'My Documents', icon: <DocumentIcon className="w-6 h-6" /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 p-4 flex flex-col shadow-2xl">
      <div className="flex items-center justify-center h-16 mb-6">
        <ZambianFlag />
      </div>
      <nav className="flex-1">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.label}
              onClick={() => setActiveView(item.label)}
            />
          ))}
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