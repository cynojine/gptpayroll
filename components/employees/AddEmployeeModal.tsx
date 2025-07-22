

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { EmployeeFormData, Department, JobTitle, ContractType } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
}

const initialFormData: EmployeeFormData = {
  fullName: '',
  nrc: '',
  tpin: '',
  napsaNumber: '',
  email: '',
  phone: '',
  salary: 0,
  hireDate: '',
  departmentId: '',
  jobTitleId: '',
  contractTypeId: '',
  employeeNumber: '',
  socialSecurityNumber: '',
  nhisId: '',
  grade: '',
  payPoint: '',
  bankName: '',
  accountNumber: '',
  division: '',
  password: '',
};

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onEmployeeAdded }) => {
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        } catch (err) {
          setSettings(prev => ({ ...prev, loading: false, error: 'Failed to load required data.' }));
        }
      };
      fetchSettings();
      // Reset form on open
      setFormData(initialFormData);
      setConfirmPassword('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (!formData.departmentId || !formData.jobTitleId || !formData.contractTypeId) {
        setError('Please select a department, job title, and contract type.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createEmployee(formData);
      onEmployeeAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to create employee. The email or NRC may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Employee"
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
            form="add-employee-form"
            disabled={isSubmitting || settings.loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Add Employee'}
          </button>
        </>
      }
    >
      {settings.loading ? (
        <LoadingSpinner text="Loading form data..." />
      ) : settings.error ? (
        <p className="text-center text-red-400">{settings.error}</p>
      ) : (
        <form id="add-employee-form" onSubmit={handleSubmit}>
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
            <div className="lg:col-span-3">
              <label htmlFor="contractTypeId" className="block text-sm font-medium">Contract Type</label>
              <select name="contractTypeId" id="contractTypeId" value={formData.contractTypeId} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.contractTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
             <div className="lg:col-span-3 border-t border-slate-700 my-4"></div>
             <div className="lg:col-span-3">
                <h4 className="text-lg font-semibold text-slate-200 mb-2">Login Credentials</h4>
             </div>
             <div>
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
             </div>
             <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm Password</label>
                <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
             </div>
          </div>
          {error && <p className="text-center text-red-400 mt-4">{error}</p>}
        </form>
      )}
    </Modal>
  );
};