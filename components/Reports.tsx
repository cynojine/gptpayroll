import * as React from 'react';
import { Card } from './common/Card';
import { PayeReturnReport } from './reports/PayeReturnReport';
import { NapsaReturnReport } from './reports/NapsaReturnReport';
import { NhimaReturnReport } from './reports/NhimaReturnReport';

interface ReportCardProps {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, onClick, disabled = false }) => (
  <Card 
    className={`
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 hover:border-emerald-500 cursor-pointer'}
      border-2 border-transparent transition-all duration-200
    `}
    onClick={!disabled ? onClick : undefined}
  >
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-slate-400 mt-2 h-16">{description}</p>
    <button 
      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-slate-600"
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
    >
      {disabled ? 'Coming Soon' : 'Generate Report'}
    </button>
  </Card>
);

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = React.useState<'menu' | 'paye' | 'napsa' | 'nhima'>('menu');

  const handleBackToMenu = () => setActiveReport('menu');

  if (activeReport === 'paye') {
    return <PayeReturnReport onBack={handleBackToMenu} />;
  }
  
  if (activeReport === 'napsa') {
      return <NapsaReturnReport onBack={handleBackToMenu} />;
  }

  if (activeReport === 'nhima') {
    return <NhimaReturnReport onBack={handleBackToMenu} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Reporting & Auditing</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="PAYE Returns"
          description="Generate monthly Pay As You Earn (PAYE) reports for ZRA e-filing."
          onClick={() => setActiveReport('paye')}
        />
        <ReportCard
          title="NAPSA Contributions"
          description="Generate reports for National Pension Scheme Authority (NAPSA) contributions."
          onClick={() => setActiveReport('napsa')}
        />
        <ReportCard
          title="NHIMA Deductions"
          description="Generate reports for National Health Insurance (NHIMA) deductions."
          onClick={() => setActiveReport('nhima')}
          disabled={false}
        />
        <ReportCard
          title="Employee Earnings Summary"
          description="Detailed report of all employee earnings and deductions for a selected period."
          onClick={() => {}}
          disabled
        />
        <ReportCard
          title="Payroll History Audit"
          description="View a complete log of all payroll activities and changes for auditing."
          onClick={() => {}}
          disabled
        />
        <ReportCard
          title="Custom Report Builder"
          description="Create your own custom reports by selecting fields and filters."
          onClick={() => {}}
          disabled
        />
      </div>
    </div>
  );
};