

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface BrandingSettings {
  id: number;
  companyName: string | null;
  companyAddress: string | null;
  logoUrl: string | null;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface LeaveRequestFormData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
}

export interface TaxBand {
  id: string;
  bandOrder: number;
  chargeableAmount: number | null; // null for the top band
  rate: number;
}

export interface PayrollSetting {
  id: string;
  settingKey: string;
  settingValue: string;
}

export interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'employee';
}

export interface Department {
  id:string;
  name: string;
}
export interface JobTitle {
  id: string;
  name: string;
}
export interface ContractType {
  id: string;
  name: string;
}
export interface LeaveType {
  id: string;
  name: string;
}

export type SettingsCategory = Department | JobTitle | ContractType | LeaveType | PayrollItem;

export interface PayrollItem {
  id: string;
  name: string;
  type: 'Addition' | 'Deduction';
  calculationType: 'Fixed' | 'Percentage';
  isTaxable: boolean;
}

export interface EmployeePayrollItem {
  id: string;
  employeeId: string;
  payrollItemId: string;
  value: number;
  // Joined data for display
  item_name?: string;
  item_type?: 'Addition' | 'Deduction';
  item_calculationType?: 'Fixed' | 'Percentage';
  isTaxable?: boolean;
}


export interface Employee {
  id:string;
  profileId: string | null;
  fullName: string;
  nrc: string;
  tpin: string | null;
  napsa_number: string | null;
  employee_number: string | null;
  social_security_number: string | null;
  nhis_id: string | null;
  grade: string | null;
  pay_point: string | null;
  bank_name: string | null;
  account_number: string | null;
  division: string | null;
  jobTitle: string | null;
  department: string | null;
  contractType: string | null;
  status: 'Active' | 'On Leave' | 'Terminated';
  hireDate: string | null;
  salary: number;
  email: string;
  phone: string | null;
  profilePicUrl: string | null;
  payrollItems?: EmployeePayrollItem[];
  // IDs for edit modal
  departmentId?: string | null;
  jobTitleId?: string | null;
  contractTypeId?: string | null;
}

export interface EmployeeFormData {
  fullName: string;
  nrc: string;
  tpin: string;
  napsaNumber: string;
  email: string;
  phone: string;
  salary: number;
  hireDate: string;
  departmentId: string;
  jobTitleId: string;
  contractTypeId: string;
  employeeNumber: string;
  socialSecurityNumber: string;
  nhisId: string;
  grade: string;
  payPoint: string;
  bankName: string;
  accountNumber: string;
  division: string;
}

export interface UpdateEmployeeFormData extends Omit<EmployeeFormData, 'password'> {
    status: 'Active' | 'On Leave' | 'Terminated';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string; // This will be joined from the employees table
  leaveTypeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  days: number;
}

export interface PayeBandCalculation {
  bandDescription: string;
  chargeableIncomeInBand: number;
  rate: number;
  taxDue: number;
}

export interface PayrollBreakdown {
    additions: { name: string; amount: number; isTaxable?: boolean }[];
    deductions: { name: string; amount: number }[];
    statutory: { napsa: number; nhima: number; paye: number };
    payeBreakdown: PayeBandCalculation[];
}

export interface PayrollData {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  grossPay: number;
  taxableIncome: number;
  netPay: number;
  breakdown: PayrollBreakdown;
}

export interface PayrollCalculationSettings {
    taxBands: TaxBand[];
    napsaRate: number;
    napsaCeiling: number;
    nhimaRate: number;
    nhimaMaxContribution: number;
}

export interface PayslipDisplayData {
    employee: Employee;
    period: string;
    branding: BrandingSettings;
    currency: string;
    monthlyData: PayrollData;
    ytdData: {
        taxablePayYTD: number;
        taxYTD: number;
        napsaYTD: number;
        grossYTD: number;
    };
    leaveData: {
        balance: number;
        leaveValue: number;
        leaveDaysTaken: number;
    };
}


export interface PayeReturnRow {
  id: string;
  employeeName: string;
  nrc: string;
  tpin: string;
  grossPay: number;
  paye: number;
}
export interface NapsaReturnRow {
  id: string;
  employeeName: string;
  nrc: string;
  napsaNumber: string;
  contributionBase: number;
  employeeContribution: number;
}

export interface NhimaReturnRow {
  id: string;
  employeeName: string;
  nrc: string;
  nhisId: string;
  nhimaContribution: number;
}

export enum ChatRole {
    USER = 'user',
    MODEL = 'model',
    SYSTEM = 'system',
    ERROR = 'error'
}

export interface ChatMessage {
    role: ChatRole;
    text: string;
}

export interface CompanyHoliday {
    id: string;
    name: string;
    holidayDate: string;
}

export interface LeaveBalance {
    id: string;
    employeeId: string;
    leaveTypeId: string;
    balanceDays: number;
    leaveTypeName?: string; // For display purposes
}

export interface PolicyDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}


export interface Database {
  public: {
    Tables: {
      branding_settings: {
        Row: { id: number; company_name: string | null; company_address: string | null; logo_url: string | null; created_at: string | null; };
        Insert: { id?: number; company_name?: string | null; company_address?: string | null; logo_url?: string | null; created_at?: string | null; };
        Update: { id?: number; company_name?: string | null; company_address?: string | null; logo_url?: string | null; created_at?: string | null; };
        Relationships: [];
      },
      departments: {
        Row: { id: string; name: string; };
        Insert: { id?: string; name: string; };
        Update: { id?: string; name?: string; };
        Relationships: [];
      },
      job_titles: {
        Row: { id: string; name: string; };
        Insert: { id?: string; name: string; };
        Update: { id?: string; name?: string; };
        Relationships: [];
      },
      contract_types: {
        Row: { id: string; name: string; };
        Insert: { id?: string; name: string; };
        Update: { id?: string; name?: string; };
        Relationships: [];
      },
      leave_types: {
        Row: { id: string; name: string; };
        Insert: { id?: string; name: string; };
        Update: { id?: string; name?: string; };
        Relationships: [];
      },
      tax_bands: {
        Row: { id: string; band_order: number; chargeable_amount: number | null; rate: number; };
        Insert: { id?: string; band_order: number; chargeable_amount?: number | null; rate: number; };
        Update: { id?: string; band_order?: number; chargeable_amount?: number | null; rate?: number; };
        Relationships: [];
      },
      payroll_settings: {
        Row: { id: string; setting_key: string; setting_value: string; };
        Insert: { id?: string; setting_key: string; setting_value: string; };
        Update: { id?: string; setting_key?: string; setting_value?: string; };
        Relationships: [];
      },
      payroll_items: {
        Row: { id: string; name: string; type: 'Addition' | 'Deduction'; calculation_type: 'Fixed' | 'Percentage'; is_taxable: boolean; };
        Insert: { id?: string; name: string; type?: 'Addition' | 'Deduction'; calculation_type?: 'Fixed' | 'Percentage'; is_taxable?: boolean; };
        Update: { id?: string; name?: string; type?: 'Addition' | 'Deduction'; calculation_type?: 'Fixed' | 'Percentage'; is_taxable?: boolean; };
        Relationships: [];
      },
      employee_payroll_items: {
        Row: { id: string; employee_id: string; payroll_item_id: string; value: number; };
        Insert: { id?: string; employee_id: string; payroll_item_id: string; value: number; };
        Update: { id?: string; employee_id?: string; payroll_item_id?: string; value?: number; };
        Relationships: [];
      },
      profiles: {
        Row: { id: string; first_name: string | null; last_name: string | null; role: "admin" | "employee"; };
        Insert: { id: string; first_name?: string | null; last_name?: string | null; role?: "admin" | "employee"; };
        Update: { id?: string; first_name?: string | null; last_name?: string | null; role?: "admin" | "employee"; };
        Relationships: [];
      },
      employees: { 
          Row: { id: string; profile_id: string | null; full_name: string; nrc: string; tpin: string | null; napsa_number: string | null; job_title_id: string | null; department_id: string | null; contract_type_id: string | null; status: "Active" | "On Leave" | "Terminated"; hire_date: string | null; salary: number; email: string; phone: string | null; profile_pic_url: string | null; employee_number: string | null; social_security_number: string | null; nhis_id: string | null; grade: string | null; pay_point: string | null; bank_name: string | null; account_number: string | null; division: string | null; }; 
          Insert: { id?: string; profile_id?: string | null; full_name: string; nrc: string; tpin?: string | null; napsa_number?: string | null; job_title_id?: string | null; department_id?: string | null; contract_type_id?: string | null; status?: "Active" | "On Leave" | "Terminated"; hire_date?: string | null; salary: number; email: string; phone?: string | null; profile_pic_url?: string | null; employee_number?: string | null; social_security_number?: string | null; nhis_id?: string | null; grade?: string | null; pay_point?: string | null; bank_name?: string | null; account_number?: string | null; division?: string | null; }; 
          Update: { id?: string; profile_id?: string | null; full_name?: string; nrc?: string; tpin?: string | null; napsa_number?: string | null; job_title_id?: string | null; department_id?: string | null; contract_type_id?: string | null; status?: "Active" | "On Leave" | "Terminated"; hire_date?: string | null; salary?: number; email?: string; phone?: string | null; profile_pic_url?: string | null; employee_number?: string | null; social_security_number?: string | null; nhis_id?: string | null; grade?: string | null; pay_point?: string | null; bank_name?: string | null; account_number?: string | null; division?: string | null; }; 
          Relationships: [];
      },
      leave_requests: {
        Row: { id: string; employee_id: string; leave_type_id: string; start_date: string; end_date: string; status: "Pending" | "Approved" | "Rejected"; days: number; created_at: string; reviewed_by: string | null; reviewed_at: string | null; };
        Insert: { id?: string; employee_id: string; leave_type_id: string; start_date: string; end_date: string; status?: "Pending" | "Approved" | "Rejected"; days: number; created_at?: string; reviewed_by?: string | null; reviewed_at?: string | null; };
        Update: { id?: string; employee_id?: string; leave_type_id?: string; start_date?: string; end_date?: string; status?: "Pending" | "Approved" | "Rejected"; days?: number; created_at?: string; reviewed_by?: string | null; reviewed_at?: string | null; };
        Relationships: [];
      },
      payroll_runs: {
        Row: { id: string; run_date: string; month: number; year: number; status: string; processed_by: string | null; created_at: string };
        Insert: { id?: string; run_date?: string; month: number; year: number; status?: string; processed_by?: string | null; created_at?: string };
        Update: { id?: string; run_date?: string; month?: number; year?: number; status?: string; processed_by?: string | null; created_at?: string };
        Relationships: [];
      },
      payroll_details: {
        Row: { id: string; payroll_run_id: string; employee_id: string; basic_salary: number; gross_pay: number; paye: number; napsa: number; nhima: number; net_pay: number; breakdown: Json; taxable_income: number };
        Insert: { id?: string; payroll_run_id: string; employee_id: string; basic_salary: number; gross_pay: number; paye: number; napsa: number; nhima: number; net_pay: number; breakdown: Json; taxable_income: number };
        Update: { id?: string; payroll_run_id?: string; employee_id?: string; basic_salary?: number; gross_pay?: number; paye?: number; napsa?: number; nhima?: number; net_pay?: number; breakdown?: Json; taxable_income?: number };
        Relationships: [];
      },
      employee_documents: {
        Row: { id: string; employee_id: string; file_name: string; file_path: string; file_type: string; file_size: number; uploaded_at: string; };
        Insert: { id?: string; employee_id: string; file_name: string; file_path: string; file_type: string; file_size: number; uploaded_at?: string; };
        Update: { id?: string; employee_id?: string; file_name?: string; file_path?: string; file_type?: string; file_size?: number; uploaded_at?: string; };
        Relationships: [];
      },
       policy_documents: {
        Row: { id: string; file_name: string; file_path: string; file_type: string; file_size: number; uploaded_at: string; };
        Insert: { id?: string; file_name: string; file_path: string; file_type: string; file_size: number; uploaded_at?: string; };
        Update: { id?: string; file_name?: string; file_path?: string; file_type?: string; file_size?: number; uploaded_at?: string; };
        Relationships: [];
      },
      company_holidays: {
        Row: { id: string; name: string; holiday_date: string; };
        Insert: { id?: string; name: string; holiday_date: string; };
        Update: { id?: string; name?: string; holiday_date?: string; };
        Relationships: [];
      },
      leave_balances: {
        Row: { id: string; employee_id: string; leave_type_id: string; balance_days: number; };
        Insert: { id?: string; employee_id: string; leave_type_id: string; balance_days?: number; };
        Update: { id?: string; employee_id?: string; leave_type_id?: string; balance_days?: number; };
        Relationships: [];
      }
    },
    Views: {},
    Functions: {},
  }
}

export type SettingsTableName = 'departments' | 'job_titles' | 'contract_types' | 'leave_types';
export type EssView = 'Dashboard' | 'My Profile' | 'My Payslips' | 'My Leave' | 'My Documents';
export type View = 'Dashboard' | 'Employees' | 'Payroll' | 'Leave' | 'Reports' | 'Policy Assistant' | 'Settings';