
import React, { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState<UpdateEmployeeFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<{
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

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          setSettings(prev => ({ ...prev, loading: true }));
          const [departments, jobTitles, contractTypes] = await Promise.all([
            api.getDepartments(),
            api.getJobTitles(),
            api.getContractTypes(),
          ]);
          setSettings({ departments, jobTitles, contractTypes, loading: false, error: null });
          
          setFormData({
            fullName: employee.fullName,
            nrc: employee.nrc,
            tpin: employee.tpin || '',
            napsaNumber: employee.napsa_number || '',
            email: employee.email,
            phone: employee.phone || '',
            salary: employee.salary,
            hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
            departmentId: employee.departmentId || '',
            jobTitleId: employee.jobTitleId || '',
            contractTypeId: employee.contractTypeId || '',
            status: employee.status,
            employeeNumber: employee.employee_number || '',
            socialSecurityNumber: employee.social_security_number || '',
            nhisId: employee.nhis_id || '',
            grade: employee.grade || '',
            payPoint: employee.pay_point || '',
            bankName: employee.bank_name || '',
            accountNumber: employee.account_number || '',
            division: employee.division || ''
          });

        } catch (err) {
          setSettings(prev => ({ ...prev, loading: false, error: 'Failed to load required data.' }));
        }
      };
      fetchSettings();
      setError(null);
      setIsSubmitting(false);
      setIsResettingPassword(false);
    }
  }, [isOpen, employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => prev ? ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }) : null);
  };

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData) return;

    if (!formData.departmentId || !formData.jobTitleId || !formData.contractTypeId) {
        setError('Please select a department, job title, and contract type.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.updateEmployee(employee.id, formData);
      onEmployeeUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee. The email or NRC may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formContent = () => {
    if (settings.loading || !formData) return <LoadingSpinner text="Loading form data..." />;
    if (settings.error) return <p className="text-center text-red-400">{settings.error}</p>;
    
    return (
       <form id="edit-employee-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium">Employee No.</label>
              <input type="text" name="employeeNumber" id="employeeNumber" value={formData.employeeNumber} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
              <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium">Engagement Date</label>
              <input type="date" name="hireDate" id="hireDate" value={formData.hireDate} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nrc" className="block text-sm font-medium">NRC Number</label>
              <input type="text" name="nrc" id="nrc" value={formData.nrc} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="tpin" className="block text-sm font-medium">TPIN</label>
              <input type="text" name="tpin" id="tpin" value={formData.tpin} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="napsaNumber" className="block text-sm font-medium">NAPSA Number</label>
              <input type="text" name="napsaNumber" id="napsaNumber" value={formData.napsaNumber} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="socialSecurityNumber" className="block text-sm font-medium">Social Security No.</label>
              <input type="text" name="socialSecurityNumber" id="socialSecurityNumber" value={formData.socialSecurityNumber} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nhisId" className="block text-sm font-medium">NHIS ID</label>
              <input type="text" name="nhisId" id="nhisId" value={formData.nhisId} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium">Basic Salary (ZMW)</label>
              <input type="number" name="salary" id="salary" value={formData.salary} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="departmentId" className="block text-sm font-medium">Department</label>
              <select name="departmentId" id="departmentId" value={formData.departmentId} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="jobTitleId" className="block text-sm font-medium">Job Title</label>
              <select name="jobTitleId" id="jobTitleId" value={formData.jobTitleId} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="division" className="block text-sm font-medium">Division</label>
              <input type="text" name="division" id="division" value={formData.division} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium">Grade</label>
              <input type="text" name="grade" id="grade" value={formData.grade} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="payPoint" className="block text-sm font-medium">Pay Point</label>
              <input type="text" name="payPoint" id="payPoint" value={formData.payPoint} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="contractTypeId" className="block text-sm font-medium">Contract Type</label>
              <select name="contractTypeId" id="contractTypeId" value={formData.contractTypeId} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.contractTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
             <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
                <label htmlFor="bankName" className="block text-sm font-medium">Bank Name</label>
                <input type="text" name="bankName" id="bankName" value={formData.bankName} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div className="lg:col-span-2">
                <label htmlFor="accountNumber" className="block text-sm font-medium">Account No.</label>
                <input type="text" name="accountNumber" id="accountNumber" value={formData.accountNumber} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
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
            disabled={isSubmitting || settings.loading || !formData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
