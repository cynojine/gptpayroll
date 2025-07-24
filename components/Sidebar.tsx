
import React from 'react';
import { DashboardIcon, EmployeeIcon, PayrollIcon, ReportsIcon, LeaveIcon, PolicyIcon, SettingsIcon, CloseIcon } from './icons/IconComponents';
import { useAuth } from '../contexts/AuthContext';
import { View, BrandingSettings } from '../types';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
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

const BrandHeader: React.FC<{ branding: BrandingSettings | null }> = ({ branding }) => (
    <div className="flex items-center justify-center h-16 mb-6">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={`${branding.companyName || 'Company'} Logo`} className="max-h-14 object-contain" />
      ) : (
        <span className="font-bold text-xl text-slate-100">{branding?.companyName || 'GPTPayroll'}</span>
      )}
    </div>
  );

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {
  const { profile, branding } = useAuth();

  const handleNavClick = (view: View) => {
    setActiveView(view);
    onClose(); // Close sidebar on mobile after navigation
  };

  const navItems: { label: View; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" /> },
    { label: 'Employees', icon: <EmployeeIcon className="w-6 h-6" /> },
    { label: 'Payroll', icon: <PayrollIcon className="w-6 h-6" /> },
    { label: 'Leave', icon: <LeaveIcon className="w-6 h-6" /> },
    { label: 'Reports', icon: <ReportsIcon className="w-6 h-6" /> },
    { label: 'Policy Assistant', icon: <PolicyIcon className="w-6 h-6" /> },
    { label: 'Settings', icon: <SettingsIcon className="w-6 h-6" />, adminOnly: true },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 bg-slate-800 p-4 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex`}>
      <div className="flex items-center justify-between">
        <BrandHeader branding={branding} />
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
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
                onClick={() => handleNavClick(item.label)}
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
        <p>&copy; {new Date().getFullYear()} {branding?.companyName || 'GPTPayroll Inc.'}</p>
        <p>Made for Zambia 🇿🇲</p>
      </div>
    </aside>
  );
};
