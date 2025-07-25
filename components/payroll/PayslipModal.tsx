import * as React from 'react';
import { Modal } from '../common/Modal';
import { PayslipDisplayData } from '../../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PayslipDisplayData;
}

const formatNumber = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined') return '0.00';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PayslipField: React.FC<{ label: string; value: string | number | null | undefined, className?: string }> = ({ label, value, className }) => (
    <div className={`border-slate-400 ${className}`}>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold text-sm">{value || ''}</div>
    </div>
);

export const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, data }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const { employee, period, branding, currency, monthlyData, ytdData, leaveData } = data;
  const { breakdown, netPay } = monthlyData;

  const totalDeductions = breakdown.statutory.paye + breakdown.statutory.napsa + breakdown.statutory.nhima + breakdown.deductions.reduce((a, b) => a + b.amount, 0);

  const allDeductions = [
    { name: 'PAYE', amount: breakdown.statutory.paye },
    { name: 'NAPSA', amount: breakdown.statutory.napsa },
    { name: 'NATIONAL HEALTH SCHEME', amount: breakdown.statutory.nhima },
    ...breakdown.deductions,
  ];

  const allIncomes = [
      { name: "BASIC PAY", amount: monthlyData.basicSalary },
      ...breakdown.additions.map(a => ({ name: a.name.toUpperCase(), amount: a.amount }))
  ];
  
  const handleDownloadPdf = async () => {
    const payslipElement = document.getElementById('payslip-content');
    if (!payslipElement || isDownloading) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(payslipElement, {
        scale: 2, // Use a higher scale for better resolution
        useCORS: true, // Important for external images like logos
        backgroundColor: '#ffffff', // Explicitly set background to white
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Using 'p' for portrait, 'mm' for millimeters, and 'a4' for page size.
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      // Calculate the ratio to fit the image in the PDF page.
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      // Center the image on the PDF page
      const x = (pdfWidth - finalWidth) / 2;
      const y = 0;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`payslip_${data.employee.fullName.replace(/\s/g, '_')}_${data.period.replace(/\s/g, '_')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Payslip Preview for ${period}`}
        maxWidth="max-w-5xl"
        footer={
            <>
                <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait">
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
            </>
        }
    >
      <div id="payslip-content" className="bg-white text-black p-4 payslip-print-area">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
            <div className="text-left">
                <h1 className="font-bold text-lg">{branding.companyName}</h1>
                <p>{branding.companyAddress}</p>
            </div>
            <div className="text-center">
                <h2 className="font-semibold">Pay Statement for {period.replace(/\d{4}$/, '')} {new Date(period).getFullYear()}.</h2>
            </div>
            {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Company Logo" className="h-16 object-contain"/>
            ): <div className="w-24 h-16"></div>}
        </div>
        
        {/* Top Info Grid */}
        <div className="grid grid-cols-12 border-y-2 border-black">
            <PayslipField label="Currency:" value={`(${currency})`} className="col-span-3 p-1 border-r border-slate-400" />
            <PayslipField label="Employee No." value={employee.employee_number} className="col-span-2 p-1 border-r border-slate-400" />
            <PayslipField label="NRC. No." value={employee.nrc} className="col-span-2 p-1 border-r border-slate-400" />
            <PayslipField label="Engagement Date" value={employee.hireDate} className="col-span-2 p-1 border-r border-slate-400" />
            <PayslipField label={`BASIC PAY (${currency})`} value={formatNumber(monthlyData.basicSalary)} className="col-span-3 p-1 text-right" />
        </div>
        <div className="grid grid-cols-12 border-b-2 border-black">
            <PayslipField label="Exchange Rate:" value="1.000000" className="col-span-3 p-1 border-r border-slate-400" />
             <div className="col-span-9 p-1">
                 <div className="text-xs text-slate-500">Employee Name</div>
                 <div className="font-bold text-sm">{employee.fullName}</div>
             </div>
        </div>
        <div className="grid grid-cols-12 border-b-2 border-black">
            <PayslipField label="Taxable Pay YTD" value={formatNumber(ytdData.taxablePayYTD)} className="col-span-3 p-1 border-r border-slate-400 text-right" />
            <PayslipField label="Tax YTD" value={formatNumber(ytdData.taxYTD)} className="col-span-3 p-1 border-r border-slate-400 text-right" />
            <PayslipField label="NAPSA YTD" value={formatNumber(ytdData.napsaYTD)} className="col-span-2 p-1 border-r border-slate-400 text-right" />
            <PayslipField label="Social Security No." value={employee.social_security_number} className="col-span-2 p-1 border-r border-slate-400" />
            <div className="col-span-2 p-1 grid grid-cols-2">
                <PayslipField label="Leave Days" value={formatNumber(leaveData.balance)} className="text-right"/>
                <PayslipField label="Leave Value" value={formatNumber(leaveData.leaveValue)} className="text-right"/>
            </div>
        </div>
         <div className="grid grid-cols-12 border-b-2 border-black">
            <div className="col-span-8 p-1 border-r border-slate-400 flex">
                <PayslipField label="TPIN:" value={employee.tpin} className="flex-1" />
                <PayslipField label="NHIS ID:" value={employee.nhis_id} className="flex-1" />
            </div>
            <div className="col-span-4 p-1"></div>
        </div>

        {/* Main Content Table */}
        <div className="border-b-2 border-black">
             <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-400 text-xs text-slate-500">
                        <th className="font-semibold text-left p-1 w-[30%]">Deductions</th>
                        <th className="font-semibold text-right p-1 w-[10%]">Amount</th>
                        <th className="font-semibold text-right p-1 w-[10%]">Balance</th>
                        <th className="font-semibold text-left p-1 w-[30%] border-l border-slate-400">Incomes/Payments</th>
                        <th className="font-semibold text-right p-1 w-[20%]">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: Math.max(allDeductions.length, allIncomes.length) }).map((_, index) => (
                        <tr key={index} className="text-sm align-top">
                            <td className="px-1 py-0.5 uppercase">{allDeductions[index]?.name || ''}</td>
                            <td className="px-1 py-0.5 text-right">{allDeductions[index] ? formatNumber(allDeductions[index].amount) : ''}</td>
                            <td className="px-1 py-0.5"></td>
                            <td className="px-1 py-0.5 border-l border-slate-400 uppercase">{allIncomes[index]?.name || ''}</td>
                            <td className="px-1 py-0.5 text-right font-semibold">{allIncomes[index] ? formatNumber(allIncomes[index].amount) : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Footer Summary */}
        <div className="grid grid-cols-12 border-b-2 border-black">
            <PayslipField label="Grade" value={employee.grade} className="col-span-1 p-1" />
            <PayslipField label="Pay Point" value={employee.pay_point} className="col-span-2 p-1" />
            <PayslipField label="Total Deductions" value={formatNumber(totalDeductions)} className="col-span-3 p-1 text-right" />
            <PayslipField label="Christmas" value="0.00" className="col-span-2 p-1 text-right" />
            <PayslipField label="Leave Days Taken" value={formatNumber(leaveData.leaveDaysTaken)} className="col-span-2 p-1 text-right" />
            <PayslipField label="Total Incomes" value={formatNumber(monthlyData.grossPay)} className="col-span-2 p-1 text-right font-bold" />
        </div>
         <div className="grid grid-cols-12 border-b-2 border-black">
            <PayslipField label="Bank Name" value={employee.bank_name} className="col-span-3 p-1" />
            <PayslipField label="Taxable This Month" value={formatNumber(monthlyData.taxableIncome)} className="col-span-3 p-1 text-right" />
            <PayslipField label="Gross YTD" value={formatNumber(ytdData.grossYTD)} className="col-span-3 p-1 text-right" />
            <PayslipField label={`Net Pay (BANK) ${currency}`} value={formatNumber(netPay)} className="col-span-3 p-1 text-right font-bold text-base" />
        </div>
         <div className="grid grid-cols-12 border-b-2 border-black">
            <PayslipField label="Account No" value={employee.account_number} className="col-span-3 p-1" />
            <PayslipField label="Department" value={employee.department} className="col-span-3 p-1" />
            <PayslipField label="Division" value={employee.division} className="col-span-3 p-1" />
            <PayslipField label="Job Title" value={employee.jobTitle} className="col-span-3 p-1" />
        </div>
      </div>
    </Modal>
  );
};