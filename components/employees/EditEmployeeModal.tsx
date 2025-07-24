import * as React from 'react';
import { Modal } from '../common/Modal';
import { UpdateEmployeeFormData, Department, JobTitle, ContractType, Employee } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeUpdated: () => void;
  employee: Employee;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onEmployeeUpdated, employee }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  
  const [settings, setSettings] = React.useState<{
    departments: Department[];
    jobTitles: JobTitle[];
    contractTypes: ContractType[];
    loading: boolean;
    error: string | null;
  }>({
    departments: [],
    jobTitles: [],
    contractTypes: [],
    loading: true,
    error: null,
  });
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const employeeData: UpdateEmployeeFormData = {
        fullName: formData.get('fullName') as string,
        nrc: formData.get('nrc') as string,
        tpin: formData.get('tpin') as string,
        napsaNumber: formData.get('napsaNumber') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        salary: Number(formData.get('salary')),
        hireDate: formData.get('hireDate') as string,
        departmentId: formData.get('departmentId') as string,
        jobTitleId: formData.get('jobTitleId') as string,
        contractTypeId: formData.get('contractTypeId') as string,
        status: formData.get('status') as 'Active' | 'On Leave' | 'Terminated',
        employeeNumber: formData.get('employeeNumber') as string,
        socialSecurityNumber: formData.get('socialSecurityNumber') as string,
        nhisId: formData.get('nhisId') as string,
        grade: formData.get('grade') as string,
        payPoint: formData.get('payPoint') as string,
        bankName: formData.get('bankName') as string,
        accountNumber: formData.get('accountNumber') as string,
        division: formData.get('division') as string,
    };
    
    if (!employeeData.departmentId || !employeeData.jobTitleId || !employeeData.contractTypeId) {
        setError('Please select a department, job title, and contract type.');
        setLoading(false);
        return;
    }

    try {
      await api.updateEmployee(employee.id, employeeData);
      addToast('Employee updated successfully!', 'success');
      onEmployeeUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee.');
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      const fetchSettings = async () => {
        try {
          setSettings(prev => ({ ...prev, loading: true, error: null }));
          const [departments, jobTitles, contractTypes] = await Promise.all([
            api.getDepartments(),
            api.getJobTitles(),
            api.getContractTypes(),
          ]);
          setSettings({ departments, jobTitles, contractTypes, loading: false, error: null });
        } catch (err) {
          setSettings(prev => ({ ...prev, loading: false, error: 'Failed to load required data.' }));
        }
      };
      fetchSettings();
      setIsResettingPassword(false);
    }
  }, [isOpen, employee]);

  const handleSendResetLink = async () => {
    if (!employee || !employee.email) {
      addToast('Employee email address is not available.', 'error');
      return;
    }
    
    setIsResettingPassword(true);
    try {
      await api.resetEmployeePassword(employee.email);
      addToast(`Password reset link sent to ${employee.email}.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to send reset link.', 'error');
      console.error(err);
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  const formContent = () => {
    if (settings.loading) return <LoadingSpinner text="Loading form data..." />;
    if (settings.error) return <p className="text-center text-red-400">{settings.error}</p>;
    
    return (
       <form id="edit-employee-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
              <input type="text" name="fullName" id="fullName" defaultValue={employee.fullName} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium">Employee No.</label>
              <input type="text" name="employeeNumber" id="employeeNumber" defaultValue={employee.employee_number || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
              <input type="email" name="email" id="email" defaultValue={employee.email} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
              <input type="tel" name="phone" id="phone" defaultValue={employee.phone || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium">Engagement Date</label>
              <input type="date" name="hireDate" id="hireDate" defaultValue={employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : ''} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nrc" className="block text-sm font-medium">NRC Number</label>
              <input type="text" name="nrc" id="nrc" defaultValue={employee.nrc} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="tpin" className="block text-sm font-medium">TPIN</label>
              <input type="text" name="tpin" id="tpin" defaultValue={employee.tpin || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="napsaNumber" className="block text-sm font-medium">NAPSA Number</label>
              <input type="text" name="napsaNumber" id="napsaNumber" defaultValue={employee.napsa_number || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="socialSecurityNumber" className="block text-sm font-medium">Social Security No.</label>
              <input type="text" name="socialSecurityNumber" id="socialSecurityNumber" defaultValue={employee.social_security_number || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nhisId" className="block text-sm font-medium">NHIS ID</label>
              <input type="text" name="nhisId" id="nhisId" defaultValue={employee.nhis_id || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium">Basic Salary (ZMW)</label>
              <input type="number" name="salary" id="salary" defaultValue={employee.salary} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="departmentId" className="block text-sm font-medium">Department</label>
              <select name="departmentId" id="departmentId" defaultValue={employee.departmentId || ''} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="jobTitleId" className="block text-sm font-medium">Job Title</label>
              <select name="jobTitleId" id="jobTitleId" defaultValue={employee.jobTitleId || ''} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="division" className="block text-sm font-medium">Division</label>
              <input type="text" name="division" id="division" defaultValue={employee.division || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium">Grade</label>
              <input type="text" name="grade" id="grade" defaultValue={employee.grade || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="payPoint" className="block text-sm font-medium">Pay Point</label>
              <input type="text" name="payPoint" id="payPoint" defaultValue={employee.pay_point || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="contractTypeId" className="block text-sm font-medium">Contract Type</label>
              <select name="contractTypeId" id="contractTypeId" defaultValue={employee.contractTypeId || ''} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.contractTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">Status</label>
              <select name="status" id="status" defaultValue={employee.status} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
             <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
                <label htmlFor="bankName" className="block text-sm font-medium">Bank Name</label>
                <input type="text" name="bankName" id="bankName" defaultValue={employee.bank_name || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div className="lg:col-span-2">
                <label htmlFor="accountNumber" className="block text-sm font-medium">Account No.</label>
                <input type="text" name="accountNumber" id="accountNumber" defaultValue={employee.account_number || ''} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
             {error && <p className="text-center text-red-400 mt-4 col-span-full">{error}</p>}
          </div>
        </form>
    );
  }

  const securityContent = () => {
    if (!employee.profileId) {
      return (
        <div className="p-4 bg-slate-900/50 rounded-lg text-center text-slate-400">
          This employee does not have a login account.
        </div>
      );
    }
    return (
       <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
           <p className="text-sm text-slate-400 max-w-md">
               This will send a secure link to the employee's email address ({employee.email}) allowing them to reset their own password.
           </p>
            <button 
                type="button"
                onClick={handleSendResetLink}
                disabled={isResettingPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 whitespace-nowrap"
            >
                {isResettingPassword ? 'Sending...' : 'Send Password Reset Link'}
            </button>
        </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Employee: ${employee.fullName}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={loading || settings.loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      {formContent()}
      <div className="lg:col-span-3 border-t border-slate-700 my-6"></div>
      <div className="space-y-2">
         <h4 className="text-lg font-semibold text-slate-200">Security</h4>
         {securityContent()}
      </div>
    </Modal>
  );
};