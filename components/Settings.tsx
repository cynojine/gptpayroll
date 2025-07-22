


import React, { useState } from 'react';
import { Card } from './common/Card';
import { SettingsCategoryManager } from './settings/SettingsCategoryManager';
import * as api from '../services/api';
import { Department, JobTitle, ContractType, LeaveType } from '../types';
import { PayrollItemManager } from './settings/PayrollItemManager';
import { TaxBandManager } from './settings/TaxBandManager';
import { StatutorySettingsManager } from './settings/StatutorySettingsManager';
import { BrandingManager } from './settings/BrandingManager';
import { HolidayManager } from './settings/HolidayManager';

type Tab = 'Branding' | 'Departments' | 'Job Titles' | 'Contract Types' | 'Leave Types' | 'Payroll Items' | 'Statutory & Tax' | 'Holidays';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Branding');

  const tabs: Tab[] = ['Branding', 'Holidays', 'Departments', 'Job Titles', 'Contract Types', 'Leave Types', 'Payroll Items', 'Statutory & Tax'];

  const renderContent = () => {
    switch(activeTab) {
      case 'Branding':
        return <BrandingManager />;
      case 'Holidays':
        return <HolidayManager />;
      case 'Departments':
        return <SettingsCategoryManager<Department> 
                    categoryName="Department"
                    fetchItems={api.getDepartments}
                    createItem={api.createDepartment}
                    updateItem={api.updateDepartment}
                    deleteItem={api.deleteDepartment}
                />;
      case 'Job Titles':
        return <SettingsCategoryManager<JobTitle>
                    categoryName="Job Title"
                    fetchItems={api.getJobTitles}
                    createItem={api.createJobTitle}
                    updateItem={api.updateJobTitle}
                    deleteItem={api.deleteJobTitle}
                />;
      case 'Contract Types':
        return <SettingsCategoryManager<ContractType>
                    categoryName="Contract Type"
                    fetchItems={api.getContractTypes}
                    createItem={api.createContractType}
                    updateItem={api.updateContractType}
                    deleteItem={api.deleteContractType}
                />;
      case 'Leave Types':
        return <SettingsCategoryManager<LeaveType>
                    categoryName="Leave Type"
                    fetchItems={api.getLeaveTypes}
                    createItem={api.createLeaveType}
                    updateItem={api.updateLeaveType}
                    deleteItem={api.deleteLeaveType}
                />;
      case 'Payroll Items':
        return <PayrollItemManager />;
      case 'Statutory & Tax':
        return (
          <div className="space-y-8">
            <TaxBandManager />
            <StatutorySettingsManager />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Application Settings</h2>
      <Card>
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-6">
          {activeTab === 'Branding' && <BrandingManager />}
          {activeTab === 'Holidays' && <HolidayManager />}
          {activeTab === 'Departments' && <SettingsCategoryManager<Department> 
                    categoryName="Department"
                    fetchItems={api.getDepartments}
                    createItem={api.createDepartment}
                    updateItem={api.updateDepartment}
                    deleteItem={api.deleteDepartment}
                />}
          {activeTab === 'Job Titles' && <SettingsCategoryManager<JobTitle>
                    categoryName="Job Title"
                    fetchItems={api.getJobTitles}
                    createItem={api.createJobTitle}
                    updateItem={api.updateJobTitle}
                    deleteItem={api.deleteJobTitle}
                />}
          {activeTab === 'Contract Types' && <SettingsCategoryManager<ContractType>
                    categoryName="Contract Type"
                    fetchItems={api.getContractTypes}
                    createItem={api.createContractType}
                    updateItem={api.updateContractType}
                    deleteItem={api.deleteContractType}
                />}
          {activeTab === 'Leave Types' && <SettingsCategoryManager<LeaveType>
                    categoryName="Leave Type"
                    fetchItems={api.getLeaveTypes}
                    createItem={api.createLeaveType}
                    updateItem={api.updateLeaveType}
                    deleteItem={api.deleteLeaveType}
                />}
          {activeTab === 'Payroll Items' && <PayrollItemManager />}
          {activeTab === 'Statutory & Tax' && (
            <div className="space-y-8">
              <TaxBandManager />
              <StatutorySettingsManager />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};