import * as React from 'react';
import { getEmployeeById, deleteEmployee } from '../../services/api';
import { Employee } from '../../types';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EditEmployeeModal } from './EditEmployeeModal';
import { Modal } from '../common/Modal';
import { EmployeePayrollItems } from './EmployeePayrollItems';
import { useToast } from '../../contexts/ToastContext';
import { EmployeeDocuments } from '../documents/EmployeeDocuments';
import { EmployeeLeaveBalances } from './EmployeeLeaveBalances';

interface EmployeeDetailProps {
  employeeId: string;
  onBack: () => void;
  onEmployeeDeleted: () => void;
}

type EmployeeDetailTab = 'details' | 'payroll' | 'documents' | 'leave';

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-base text-white">{value || 'N/A'}</dd>
    </div>
);

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employeeId, onBack, onEmployeeDeleted }) => {
  const { addToast } = useToast();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<EmployeeDetailTab>('details');

  const fetchEmployee = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmployeeById(employeeId);
      setEmployee(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch employee details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);
  
  const handleEmployeeUpdated = () => {
      setIsEditModalOpen(false);
      fetchEmployee(); // Refresh details
  }

  const handleConfirmDelete = async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id);
      addToast(`Successfully deleted ${employee.fullName}.`, 'success');
      setIsDeleteModalOpen(false);
      onEmployeeDeleted();
    } catch(err) {
        addToast("Failed to delete employee. It may be linked to payroll history.", 'error');
        console.error(err);
    } finally {
        setIsDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading Employee Details..." />;
  if (error || !employee) return <div className="text-center text-red-400 p-8">{error || 'Employee not found.'}</div>;

  const { fullName, email, phone, nrc, tpin, napsa_number, jobTitle, department, hireDate, salary, status, profilePicUrl } = employee;

  const statusColor = status === 'Active' ? 'bg-green-500' : status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500';

  const tabButtonClasses = (tabName: EmployeeDetailTab) => 
    `whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tabName ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`;

  return (
    <>
    <div className="space-y-6">
        <Card>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 mb-4">&larr; Back to Employee List</button>
                    <div className="flex items-center">
                        <img src={profilePicUrl || `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=14B8A6&color=fff&size=128`} alt={fullName} className="w-24 h-24 rounded-full mr-6 border-4 border-slate-700"/>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{fullName}</h2>
                            <p className="text-lg text-slate-300">{jobTitle || 'No title specified'}</p>
                            <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold leading-5 text-white rounded-full ${statusColor}`}>
                            {status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Edit
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Delete
                    </button>
                </div>
            </div>
            
             <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={tabButtonClasses('details')}>Personal Details</button>
                    <button onClick={() => setActiveTab('payroll')} className={tabButtonClasses('payroll')}>Payroll Items</button>
                    <button onClick={() => setActiveTab('leave')} className={tabButtonClasses('leave')}>Leave Balances</button>
                    <button onClick={() => setActiveTab('documents')} className={tabButtonClasses('documents')}>Documents</button>
                </nav>
            </div>
        </Card>

        {activeTab === 'details' && (
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Personal & Employment Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <DetailItem label="Employee Number" value={employee.employee_number} />
                    <DetailItem label="Email Address" value={email} />
                    <DetailItem label="Phone Number" value={phone} />
                    <DetailItem label="NRC Number" value={nrc} />
                    <DetailItem label="TPIN (Tax ID)" value={tpin} />
                    <DetailItem label="NAPSA Number" value={napsa_number} />
                    <DetailItem label="Social Security No." value={employee.social_security_number} />
                    <DetailItem label="NHIS ID" value={employee.nhis_id} />
                    <DetailItem label="Engagement Date" value={hireDate} />
                    <DetailItem label="Department" value={department} />
                    <DetailItem label="Division" value={employee.division} />
                    <DetailItem label="Job Title" value={jobTitle} />
                    <DetailItem label="Grade" value={employee.grade} />
                    <DetailItem label="Pay Point" value={employee.pay_point} />
                    <DetailItem label="Basic Salary" value={`ZMW ${salary.toLocaleString()}`} />
                    <DetailItem label="Bank Name" value={employee.bank_name} />
                    <DetailItem label="Account Number" value={employee.account_number} />
                </dl>
            </Card>
        )}

        {activeTab === 'payroll' && (
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Payroll Additions & Deductions</h3>
                <EmployeePayrollItems employeeId={employee.id} />
            </Card>
        )}

        {activeTab === 'leave' && (
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Leave Balances</h3>
                <EmployeeLeaveBalances employeeId={employee.id} />
            </Card>
        )}

        {activeTab === 'documents' && (
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Employee Documents</h3>
                <EmployeeDocuments employeeId={employee.id} isAdminView={true} />
            </Card>
        )}
    </div>
    
    {isEditModalOpen && (
        <EditEmployeeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onEmployeeUpdated={handleEmployeeUpdated}
            employee={employee}
        />
    )}

    <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
            <>
                <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
            </>
        }
    >
        <p>Are you sure you want to delete <span className="font-bold">{employee.fullName}</span>? This action is permanent and cannot be undone. All associated documents will also be permanently deleted.</p>
    </Modal>
    </>
  );
};