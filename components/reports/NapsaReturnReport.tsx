

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Table, Column } from '../common/Table';
import { NapsaReturnRow, BrandingSettings } from '../../types';
import { getNapsaReturnReportData, getBrandingSettings } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DownloadIcon } from '../icons/IconComponents';

interface NapsaReturnReportProps {
  onBack: () => void;
}

const formatCurrency = (value: number) => `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const NapsaReturnReport: React.FC<NapsaReturnReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<NapsaReturnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [period, setPeriod] = useState('');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const settings = await getBrandingSettings();
        setBranding(settings);
      } catch (e) {
        console.error("Failed to fetch branding for report", e);
      }
    };
    fetchBranding();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReportData([]);
    try {
      const data = await getNapsaReturnReportData(month, year);
      if (data.length === 0) {
        setError('No finalized payroll run found for the selected period.');
      } else {
        setReportData(data);
        setPeriod(`${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating the report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleExportCsv = () => {
    const headers = ['Employee Name', 'NRC', 'NAPSA Number', 'Contribution Base (ZMW)', 'Employee Contribution (ZMW)', 'Employer Contribution (ZMW)', 'Total Contribution (ZMW)'];
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => {
        const employerContribution = row.employeeContribution; // Assuming 5% for both
        const totalContribution = row.employeeContribution + employerContribution;
        return [
            `"${row.employeeName.replace(/"/g, '""')}"`,
            row.nrc,
            row.napsaNumber,
            row.contributionBase.toFixed(2),
            row.employeeContribution.toFixed(2),
            employerContribution.toFixed(2),
            totalContribution.toFixed(2)
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `NAPSA_Return_${period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const columns: Column<NapsaReturnRow>[] = [
    { header: 'Employee Name', accessor: 'employeeName' },
    { header: 'NRC', accessor: 'nrc' },
    { header: 'NAPSA Number', accessor: 'napsaNumber' },
    { header: 'Contribution Base', accessor: 'contributionBase', render: item => formatCurrency(item.contributionBase) },
    { header: 'Employee (5%)', accessor: 'employeeContribution', render: item => formatCurrency(item.employeeContribution) },
    { header: 'Employer (5%)', accessor: 'id', render: item => formatCurrency(item.employeeContribution) }, // Employer matches employee
    { header: 'Total (10%)', accessor: 'id', render: item => formatCurrency(item.employeeContribution * 2) },
  ];

  const totals = reportData.reduce((acc, row) => ({
    contributionBase: acc.contributionBase + row.contributionBase,
    employee: acc.employee + row.employeeContribution,
  }), { contributionBase: 0, employee: 0 });
  const totalContribution = totals.employee * 2;

  return (
    <>
    <Card className="print-container">
      <div className="flex justify-between items-start mb-6 no-print">
        <div>
          <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 mb-2">&larr; Back to Reports Menu</button>
          <h2 className="text-xl font-bold text-white">NAPSA Contribution Return</h2>
        </div>
        <div className="flex items-end space-x-3">
            <div className="flex-grow">
                <label htmlFor="month" className="block text-sm font-medium text-slate-300">Month</label>
                <select id="month" value={month} onChange={e => setMonth(Number(e.target.value))} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white">
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
            </div>
            <div className="flex-grow">
                <label htmlFor="year" className="block text-sm font-medium text-slate-300">Year</label>
                <select id="year" value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white">
                    {Array.from({length: 5}, (_, i) => <option key={currentYear - i} value={currentYear - i}>{currentYear - i}</option>)}
                </select>
            </div>
            <button onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate'}
            </button>
        </div>
      </div>

      <div className="print-only mb-4" style={{ display: 'none' }}>
        <h1 className="text-2xl font-bold">NAPSA Return</h1>
        <p className="text-lg">Period: {period}</p>
        <p>Company: {branding?.companyName || 'N/A'}</p>
      </div>

      {error && <p className="text-center text-red-400 py-4">{error}</p>}
      
      {reportData.length > 0 && (
          <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">NAPSA Return for {period}</h3>
            <div className="flex items-center space-x-2 no-print">
                <button onClick={handleExportCsv} className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg" title="Export to CSV">
                    <DownloadIcon className="w-5 h-5" />
                </button>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm">Print</button>
            </div>
          </div>
          <Table columns={columns} data={reportData} />
          <div className="flex justify-end mt-4">
              <div className="w-full md:w-1/2">
                  <div className="flex justify-between p-2 bg-slate-700 rounded-t-lg font-semibold">
                      <span>Total Contribution Base:</span>
                      <span>{formatCurrency(totals.contributionBase)}</span>
                  </div>
                   <div className="flex justify-between p-2 bg-slate-700 font-semibold">
                      <span>Total Employee Contribution:</span>
                      <span>{formatCurrency(totals.employee)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-700 font-semibold">
                      <span>Total Employer Contribution:</span>
                      <span>{formatCurrency(totals.employee)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-900 font-bold text-lg">
                      <span>Total NAPSA Contribution Due:</span>
                      <span>{formatCurrency(totalContribution)}</span>
                  </div>
              </div>
          </div>
          </>
      )}

    </Card>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
          .print-only { display: block !important; color: black; }
          .print-container .text-white { color: black !important; }
          .print-container .bg-slate-800, .print-container .bg-slate-700, .print-container .bg-slate-900 { background: white !important; }
          .print-container .text-slate-300, .print-container .text-slate-400 { color: #4a5568 !important; }
          .print-container table { border-collapse: collapse !important; }
          .print-container th, .print-container td { border: 1px solid #ccc !important; padding: 8px !important; }
        }
      `}</style>
    </>
  );
};