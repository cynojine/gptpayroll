import * as React from 'react';
import { Modal } from '../common/Modal';
import { EmployeeFormData, Department, JobTitle, ContractType } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onEmployeeAdded }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
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
  
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setError(null);
      setLoading(false);
      formRef.current?.reset();
      
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const formData = new FormData(e.currentTarget);
      
      const employeeData: EmployeeFormData = {
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
        await api.createEmployee(employeeData);
        addToast('Employee created successfully!', 'success');
        onEmployeeAdded(); // This closes modal and refreshes list
      } catch (err: any) {
        setError(err.message || 'Failed to create employee. The email or NRC may already exist.');
      } finally {
        setLoading(false);
      }
  };

  const renderForm = () => (
     <form id="add-employee-form" onSubmit={handleSubmit} ref={formRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
              <input type="text" name="fullName" id="fullName" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium">Employee No.</label>
              <input type="text" name="employeeNumber" id="employeeNumber" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
              <input type="email" name="email" id="email" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
              <input type="tel" name="phone" id="phone" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium">Engagement Date</label>
              <input type="date" name="hireDate" id="hireDate" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nrc" className="block text-sm font-medium">NRC Number</label>
              <input type="text" name="nrc" id="nrc" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="tpin" className="block text-sm font-medium">TPIN</label>
              <input type="text" name="tpin" id="tpin" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="napsaNumber" className="block text-sm font-medium">NAPSA Number</label>
              <input type="text" name="napsaNumber" id="napsaNumber" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="socialSecurityNumber" className="block text-sm font-medium">Social Security No.</label>
              <input type="text" name="socialSecurityNumber" id="socialSecurityNumber" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="nhisId" className="block text-sm font-medium">NHIS ID</label>
              <input type="text" name="nhisId" id="nhisId" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium">Basic Salary (ZMW)</label>
              <input type="number" name="salary" id="salary" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
             <div>
              <label htmlFor="departmentId" className="block text-sm font-medium">Department</label>
              <select name="departmentId" id="departmentId" defaultValue="" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="jobTitleId" className="block text-sm font-medium">Job Title</label>
              <select name="jobTitleId" id="jobTitleId" defaultValue="" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="division" className="block text-sm font-medium">Division</label>
              <input type="text" name="division" id="division" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium">Grade</label>
              <input type="text" name="grade" id="grade" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div>
              <label htmlFor="payPoint" className="block text-sm font-medium">Pay Point</label>
              <input type="text" name="payPoint" id="payPoint" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="contractTypeId" className="block text-sm font-medium">Contract Type</label>
              <select name="contractTypeId" id="contractTypeId" defaultValue="" required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select...</option>
                {settings.contractTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
             <div className="lg:col-span-3 border-t border-slate-700 my-2"></div>
            <div>
                <label htmlFor="bankName" className="block text-sm font-medium">Bank Name</label>
                <input type="text" name="bankName" id="bankName" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
            <div className="lg:col-span-2">
                <label htmlFor="accountNumber" className="block text-sm font-medium">Account No.</label>
                <input type="text" name="accountNumber" id="accountNumber" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
            </div>
          </div>
          {error && <p className="text-center text-red-400 mt-4">{error}</p>}
        </form>
  );

  const Footer = () => {
    return (
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
          disabled={loading || settings.loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Add Employee'}
        </button>
      </>
    );
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={'Add New Employee'}
      footer={<Footer />}
    >
      {settings.loading ? <LoadingSpinner text="Loading form data..." /> : 
       settings.error ? <p className="text-center text-red-400">{settings.error}</p> :
       renderForm()
      }
    </Modal>
  );
};