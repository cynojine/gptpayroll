import * as React from 'react';
import { Card } from './common/Card';
import { SettingsCategoryManager } from './settings/SettingsCategoryManager';
import * as api from '../services/api';
import { Department, JobTitle, ContractType, LeaveType, PayrollItem, ApplicationData } from '../types';
import { PayrollItemManager } from './settings/PayrollItemManager';
import { TaxBandManager } from './settings/TaxBandManager';
import { StatutorySettingsManager } from './settings/StatutorySettingsManager';
import { BrandingManager } from './settings/BrandingManager';
import { HolidayManager } from './settings/HolidayManager';
import { PolicyDocumentManager } from './settings/PolicyDocumentManager';

type Tab = 'Branding' | 'Company Policies' | 'Holidays' | 'Departments' | 'Job Titles' | 'Contract Types' | 'Leave Types' | 'Payroll Items' | 'Statutory & Tax';

interface SettingsProps {
    appData: ApplicationData;
    onDataChange: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ appData, onDataChange }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('Branding');

  const tabs: Tab[] = ['Branding', 'Company Policies', 'Holidays', 'Departments', 'Job Titles', 'Contract Types', 'Leave Types', 'Payroll Items', 'Statutory & Tax'];

  const renderContent = () => {
    switch(activeTab) {
      case 'Branding':
        return <BrandingManager onDataChange={onDataChange} />;
      case 'Company Policies':
        return <PolicyDocumentManager documents={appData.policyDocuments} onDataChange={onDataChange} />;
      case 'Holidays':
        return <HolidayManager holidays={appData.holidays} onDataChange={onDataChange} />;
      case 'Departments':
        return <SettingsCategoryManager<Department> 
                    categoryName="Department"
                    items={appData.departments}
                    createItem={api.createDepartment}
                    updateItem={api.updateDepartment}
                    deleteItem={api.deleteDepartment}
                    onDataChange={onDataChange}
                />;
      case 'Job Titles':
        return <SettingsCategoryManager<JobTitle>
                    categoryName="Job Title"
                    items={appData.jobTitles}
                    createItem={api.createJobTitle}
                    updateItem={api.updateJobTitle}
                    deleteItem={api.deleteJobTitle}
                    onDataChange={onDataChange}
                />;
      case 'Contract Types':
        return <SettingsCategoryManager<ContractType>
                    categoryName="Contract Type"
                    items={appData.contractTypes}
                    createItem={api.createContractType}
                    updateItem={api.updateContractType}
                    deleteItem={api.deleteContractType}
                    onDataChange={onDataChange}
                />;
      case 'Leave Types':
        return <SettingsCategoryManager<LeaveType>
                    categoryName="Leave Type"
                    items={appData.leaveTypes}
                    createItem={api.createLeaveType}
                    updateItem={api.updateLeaveType}
                    deleteItem={api.deleteLeaveType}
                    onDataChange={onDataChange}
                />;
      case 'Payroll Items':
        return <PayrollItemManager items={appData.payrollItems} onDataChange={onDataChange} />;
      case 'Statutory & Tax':
        return (
          <div className="space-y-8">
            <TaxBandManager bands={appData.payrollSettings?.taxBands || []} onDataChange={onDataChange} />
            <StatutorySettingsManager settings={appData.payrollSettings} onDataChange={onDataChange} />
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
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};