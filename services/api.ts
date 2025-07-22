


import { supabase } from './supabase';
import { Database, Employee, LeaveRequest, Profile, Department, JobTitle, ContractType, LeaveType, SettingsCategory, SettingsTableName, EmployeeFormData, UpdateEmployeeFormData, PayrollItem, EmployeePayrollItem, PayrollData, TaxBand, PayrollSetting, LeaveRequestFormData, PayrollBreakdown, Json, EmployeeDocument, PayeReturnRow, NapsaReturnRow, BrandingSettings, NhimaReturnRow, CompanyHoliday, LeaveBalance } from '../types';

// A generic function to fetch items from a settings table
const getCategoryItems = async <T extends SettingsCategory>(tableName: SettingsTableName): Promise<T[]> => {
    const { data, error } = await supabase
        .from(tableName)
        .select('id, name')
        .order('name', { ascending: true });
    if (error) {
        console.error(`Error fetching ${tableName}:`, error.message);
        throw error;
    }
    return data as T[];
}

const createCategoryItem = async <T extends SettingsCategory>(tableName: SettingsTableName, name: string): Promise<T> => {
    const { data, error } = await supabase.from(tableName).insert([{ name }]).select('id, name').single();
    if (error) throw error;
    return data as T;
}

const updateCategoryItem = async <T extends SettingsCategory>(tableName: SettingsTableName, id: string, name: string): Promise<T> => {
    const { data, error } = await supabase.from(tableName).update({ name }).eq('id', id).select('id, name').single();
    if (error) throw error;
    return data as T;
}

const deleteCategoryItem = async (tableName: SettingsTableName, id: string): Promise<void> => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
}

export const getDepartments = () => getCategoryItems<Department>('departments');
export const createDepartment = (name: string) => createCategoryItem<Department>('departments', name);
export const updateDepartment = (id: string, name: string) => updateCategoryItem<Department>('departments', id, name);
export const deleteDepartment = (id: string) => deleteCategoryItem('departments', id);

export const getJobTitles = () => getCategoryItems<JobTitle>('job_titles');
export const createJobTitle = (name: string) => createCategoryItem<JobTitle>('job_titles', name);
export const updateJobTitle = (id: string, name: string) => updateCategoryItem<JobTitle>('job_titles', id, name);
export const deleteJobTitle = (id: string) => deleteCategoryItem('job_titles', id);

export const getContractTypes = () => getCategoryItems<ContractType>('contract_types');
export const createContractType = (name: string) => createCategoryItem<ContractType>('contract_types', name);
export const updateContractType = (id: string, name: string) => updateCategoryItem<ContractType>('contract_types', id, name);
export const deleteContractType = (id: string) => deleteCategoryItem('contract_types', id);

export const getLeaveTypes = () => getCategoryItems<LeaveType>('leave_types');
export const createLeaveType = (name: string) => createCategoryItem<LeaveType>('leave_types', name);
export const updateLeaveType = (id: string, name: string) => updateCategoryItem<LeaveType>('leave_types', id, name);
export const deleteLeaveType = (id: string) => deleteCategoryItem('leave_types', id);


export const getProfileForUser = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, role').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') { console.error('Error fetching profile:', error.message); return null; }
    if (!data) return null;
    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role
    };
}

const mapEmployeeData = (e: any): Employee => ({
    id: e.id,
    profileId: e.profile_id,
    fullName: e.full_name,
    nrc: e.nrc,
    tpin: e.tpin,
    napsa_number: e.napsa_number,
    employee_number: e.employee_number,
    social_security_number: e.social_security_number,
    nhis_id: e.nhis_id,
    grade: e.grade,
    pay_point: e.pay_point,
    bank_name: e.bank_name,
    account_number: e.account_number,
    division: e.division,
    jobTitle: e.job_titles?.name || null,
    department: e.departments?.name || null,
    contractType: e.contract_types?.name || null,
    status: e.status,
    hireDate: e.hire_date,
    salary: e.salary,
    email: e.email,
    phone: e.phone,
    profilePicUrl: e.profile_pic_url,
    departmentId: e.department_id,
    jobTitleId: e.job_title_id,
    contractTypeId: e.contract_type_id,
    payrollItems: e.employee_payroll_items ? e.employee_payroll_items.map((pi: any) => ({
        id: pi.id,
        employeeId: pi.employee_id,
        payrollItemId: pi.payroll_item_id,
        value: pi.value,
        item_name: pi.payroll_items.name,
        item_type: pi.payroll_items.type,
        item_calculationType: pi.payroll_items.calculation_type,
        isTaxable: pi.payroll_items.is_taxable,
    })) : [],
});


export const getEmployees = async (includePayrollItems = false): Promise<Employee[]> => {
    let query = supabase
        .from('employees')
        .select(`
            *,
            departments(name),
            job_titles(name),
            contract_types(name)
            ${includePayrollItems ? ', employee_payroll_items(*, payroll_items(*))' : ''}
        `)
        .order('full_name', { ascending: true });

    const { data, error } = await query;
    if (error) { console.error('Error fetching employees:', error.message); throw error; }

    return data.map(mapEmployeeData);
};


export const getEmployeeById = async (id: string): Promise<Employee> => {
    const { data, error } = await supabase
        .from('employees')
        .select(`*, departments(name), job_titles(name), contract_types(name)`)
        .eq('id', id).single();
    if (error) { console.error('Error fetching employee:', error.message); throw error; }

    return mapEmployeeData(data);
}

export const createEmployee = async (employeeData: EmployeeFormData): Promise<any> => {
    // This function requires an admin-authenticated client to create a user,
    // then insert into profiles and employees table. This is complex and insecure client-side.
    // The safest way is using a Supabase Edge Function.
    // However, to keep it client-side as requested:
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
        throw new Error("Admin session not found. Cannot create user.");
    }

    // Temporarily create an admin-authed client to perform all operations
    const supabaseAdmin = createClient<Database>(
        supabase.storage.url.split('/storage/v1')[0], // HACK: get the base URL
        adminSession.access_token
    );

    // Step 1: Create the user in Supabase Auth using the service role key via an edge function would be better
    // Since we are avoiding edge functions, this is the best client-side alternative.
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employeeData.email,
        password: employeeData.password!,
    });

    if (authError) {
        throw authError;
    }
    if (!authData.user) {
        throw new Error("User account was not created successfully.");
    }

    const newUserId = authData.user.id;
    
    // Use the temporary admin client to insert into protected tables
    try {
        const nameParts = employeeData.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({ id: newUserId, role: 'employee', first_name: firstName, last_name: lastName });
        if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);

        const { password, ...restOfEmployeeData } = employeeData;
        const payload: Database['public']['Tables']['employees']['Insert'] = {
            profile_id: newUserId,
            full_name: restOfEmployeeData.fullName, nrc: restOfEmployeeData.nrc, tpin: restOfEmployeeData.tpin,
            napsa_number: restOfEmployeeData.napsaNumber, email: restOfEmployeeData.email, phone: restOfEmployeeData.phone,
            salary: restOfEmployeeData.salary, hire_date: restOfEmployeeData.hireDate, department_id: restOfEmployeeData.departmentId,
            job_title_id: restOfEmployeeData.jobTitleId, contract_type_id: restOfEmployeeData.contractTypeId, status: 'Active',
            employee_number: restOfEmployeeData.employeeNumber, social_security_number: restOfEmployeeData.socialSecurityNumber,
            nhis_id: restOfEmployeeData.nhisId, grade: restOfEmployeeData.grade, pay_point: restOfEmployeeData.payPoint,
            bank_name: restOfEmployeeData.bankName, account_number: restOfEmployeeData.accountNumber, division: restOfEmployeeData.division,
        };
        
        const { data: employee, error: employeeError } = await supabaseAdmin.from('employees').insert(payload).select().single();
        if (employeeError) throw new Error(`Failed to create employee record: ${employeeError.message}`);
        
        return employee;

    } catch (e: any) {
        // If profile or employee insert fails, delete the created auth user to prevent orphans
        await supabase.auth.signOut(); // Sign out the new user
        const { error: deletionError } = await supabase.auth.admin.deleteUser(newUserId);
        if (deletionError) console.error("CRITICAL: Failed to clean up orphaned user", deletionError.message);
        throw e; // re-throw the original error
    } finally {
        // Restore the admin's session
        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
    }
};

export const updateEmployee = async (id: string, employeeData: UpdateEmployeeFormData): Promise<Employee> => {
    const payload: Database['public']['Tables']['employees']['Update'] = {
        full_name: employeeData.fullName,
        nrc: employeeData.nrc,
        tpin: employeeData.tpin,
        napsa_number: employeeData.napsaNumber,
        email: employeeData.email,
        phone: employeeData.phone,
        salary: employeeData.salary,
        hire_date: employeeData.hireDate,
        department_id: employeeData.departmentId,
        job_title_id: employeeData.jobTitleId,
        contract_type_id: employeeData.contractTypeId,
        status: employeeData.status,
        employee_number: employeeData.employeeNumber,
        social_security_number: employeeData.socialSecurityNumber,
        nhis_id: employeeData.nhisId,
        grade: employeeData.grade,
        pay_point: employeeData.payPoint,
        bank_name: employeeData.bankName,
        account_number: employeeData.accountNumber,
        division: employeeData.division,
    };
    const { data, error } = await supabase.from('employees').update(payload).eq('id', id).select().single();
    if (error) { console.error('Error updating employee:', error.message); throw error; }
    return await getEmployeeById(data.id);
}

export const resetEmployeePassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) {
        console.error('Error sending password reset email:', error.message);
        if (error.message.includes('User not found')) {
            throw new Error('No account found for this email address.');
        }
        throw new Error(error.message);
    }
};


export const deleteEmployee = async (id: string): Promise<void> => {
    // First, get all documents for the employee to delete them from storage
    const { data: documents, error: docError } = await supabase
        .from('employee_documents')
        .select('file_path')
        .eq('employee_id', id);

    if (docError) {
        console.error('Could not fetch documents for deletion:', docError.message);
        throw new Error('Failed to fetch employee documents before deletion.');
    }
    
    // Delete files from storage
    if (documents && documents.length > 0) {
        const filePaths = documents.map(doc => doc.file_path);
        const { error: storageError } = await supabase.storage.from('employee-documents').remove(filePaths);
        if (storageError) {
            console.error('Error deleting files from storage:', storageError.message);
            // We can choose to continue or abort. Let's abort to be safe.
            throw new Error('Failed to delete employee files from storage.');
        }
    }

    // After files are deleted, delete the employee record.
    // RLS policies should cascade delete the document metadata records.
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { console.error('Error deleting employee:', error.message); throw error; }
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase.from('leave_requests').select(`*, employee:employees(full_name), leaveType:leave_types(id, name)`).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching leave requests:', error.message); throw error; }
    return data.map((req: any) => ({
        id: req.id,
        employeeId: req.employee_id,
        leaveTypeId: req.leaveType.id,
        employeeName: req.employee.full_name,
        leaveType: req.leaveType.name,
        startDate: req.start_date,
        endDate: req.end_date,
        status: req.status,
        days: req.days,
    }));
};

export const updateLeaveRequestStatus = async (id: string, status: 'Approved' | 'Rejected'): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the leave request details first
    const { data: request, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single();
    
    if (requestError || !request) throw new Error('Could not find leave request to update.');

    const payload: Database['public']['Tables']['leave_requests']['Update'] = {
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString()
    };
    
    // If approving, debit the leave balance
    if (status === 'Approved') {
        const { data: currentBalance, error: balanceError } = await supabase
            .from('leave_balances')
            .select('id, balance_days')
            .eq('employee_id', request.employee_id)
            .eq('leave_type_id', request.leave_type_id)
            .maybeSingle();

        if (balanceError) throw new Error('Could not fetch leave balance.');

        const newBalance = (currentBalance?.balance_days || 0) - request.days;
        
        const { error: updateBalanceError } = await supabase
            .from('leave_balances')
            .upsert({
                id: currentBalance?.id,
                employee_id: request.employee_id,
                leave_type_id: request.leave_type_id,
                balance_days: newBalance
            }, { onConflict: 'employee_id, leave_type_id' });

        if (updateBalanceError) throw new Error('Failed to update leave balance.');
    }
    
    const { error } = await supabase.from('leave_requests').update(payload).eq('id', id);
    if (error) { console.error('Error updating leave request:', error.message); throw error; }
}

// --- PAYROLL ITEMS ---
export const getPayrollItems = async (): Promise<PayrollItem[]> => {
    const { data, error } = await supabase.from('payroll_items').select('*').order('name');
    if (error) { console.error('Error fetching payroll items:', error.message); throw error; }
    return data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        calculationType: item.calculation_type,
        isTaxable: item.is_taxable,
    }));
}
export const createPayrollItem = async (item: Omit<PayrollItem, 'id'>) => {
    const { data, error } = await supabase.from('payroll_items').insert([{
        name: item.name,
        type: item.type,
        calculation_type: item.calculationType,
        is_taxable: item.isTaxable
    }]).select().single();
    if (error) { console.error('Error creating payroll item:', error.message); throw error; }
    return {
        id: data.id,
        name: data.name,
        type: data.type,
        calculationType: data.calculation_type,
        isTaxable: data.is_taxable,
    };
}
export const updatePayrollItem = async (id: string, item: Partial<Omit<PayrollItem, 'id'>>) => {
    const payload: Database['public']['Tables']['payroll_items']['Update'] = {};
    if (item.name) payload.name = item.name;
    if (item.type) payload.type = item.type;
    if (item.calculationType) payload.calculation_type = item.calculationType;
    if (item.isTaxable !== undefined) payload.is_taxable = item.isTaxable;

    const { data, error } = await supabase.from('payroll_items').update(payload).eq('id', id).select().single();
    if (error) { console.error('Error updating payroll item:', error.message); throw error; }
    return {
        id: data.id,
        name: data.name,
        type: data.type,
        calculationType: data.calculation_type,
        isTaxable: data.is_taxable,
    };
}
export const deletePayrollItem = async (id: string) => {
    const { error } = await supabase.from('payroll_items').delete().eq('id', id);
    if (error) { console.error('Error deleting payroll item:', error.message); throw error; }
}

// --- EMPLOYEE PAYROLL ITEMS ---
export const getEmployeePayrollItems = async (employeeId: string): Promise<EmployeePayrollItem[]> => {
    const { data, error } = await supabase.from('employee_payroll_items').select(`*, item:payroll_items(name, type, calculation_type, is_taxable)`).eq('employee_id', employeeId);
    if (error) { console.error('Error fetching employee payroll items:', error.message); throw error; }
    return data.map((pi: any) => ({
        id: pi.id,
        employeeId: pi.employee_id,
        payrollItemId: pi.payroll_item_id,
        value: pi.value,
        item_name: pi.item.name,
        item_type: pi.item.type,
        item_calculationType: pi.item.calculation_type,
        isTaxable: pi.item.is_taxable,
    }));
}
export const addEmployeePayrollItem = async (employeeId: string, payrollItemId: string, value: number) => {
    const { data, error } = await supabase.from('employee_payroll_items').insert([{ employee_id: employeeId, payroll_item_id: payrollItemId, value }]).select().single();
    if (error) { console.error('Error adding employee payroll item:', error.message); throw error; }
    return {
        id: data.id,
        employeeId: data.employee_id,
        payrollItemId: data.payroll_item_id,
        value: data.value,
    };
}
export const removeEmployeePayrollItem = async (id: string) => {
    const { error } = await supabase.from('employee_payroll_items').delete().eq('id', id);
    if (error) { console.error('Error removing employee payroll item:', error.message); throw error; }
}

// --- PAYROLL RUNS ---
export const getPayrollRun = async (month: number, year: number) => {
  const { data: runData, error: runError } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();
  if (runError) throw runError;
  if (!runData) return null;

  const { data: detailsData, error: detailsError } = await supabase
    .from('payroll_details')
    .select('*, employee:employees(full_name)')
    .eq('payroll_run_id', runData.id);
  if (detailsError) throw detailsError;
  
  const payrollData = detailsData.map(d => ({
    id: d.id,
    employeeId: d.employee_id,
    employeeName: (d.employee as any).full_name,
    basicSalary: d.basic_salary,
    grossPay: d.gross_pay,
    taxableIncome: d.taxable_income,
    netPay: d.net_pay,
    breakdown: d.breakdown as PayrollBreakdown,
  }));
  
  return { status: runData.status, payrollData };
}

export const savePayrollRun = async (month: number, year: number, payroll: PayrollData[], status: 'Draft' | 'Finalized') => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: run, error: runUpsertError } = await supabase
    .from('payroll_runs')
    .upsert({
       month, year, status, processed_by: user?.id ?? null, run_date: new Date().toISOString()
    }, { onConflict: 'month, year', ignoreDuplicates: false })
    .select()
    .single();

  if (runUpsertError) throw runUpsertError;
  if (!run) throw new Error("Failed to create or find payroll run.");


  const detailsToUpsert = payroll.map(p => ({
    payroll_run_id: run.id,
    employee_id: p.employeeId,
    basic_salary: p.basicSalary,
    gross_pay: p.grossPay,
    taxable_income: p.taxableIncome,
    paye: p.breakdown.statutory.paye,
    napsa: p.breakdown.statutory.napsa,
    nhima: p.breakdown.statutory.nhima,
    net_pay: p.netPay,
    breakdown: p.breakdown,
  }));
  
  // Clear old details for this run before upserting new ones
  const { error: deleteError } = await supabase.from('payroll_details').delete().eq('payroll_run_id', run.id);
  if(deleteError) throw deleteError;

  const { error: detailsUpsertError } = await supabase
    .from('payroll_details')
    .insert(detailsToUpsert);

  if (detailsUpsertError) throw detailsUpsertError;

  return run;
};

// --- TAX & PAYROLL SETTINGS ---
export const getTaxBands = async (): Promise<TaxBand[]> => {
    const { data, error } = await supabase.from('tax_bands').select('*').order('band_order');
    if (error) { console.error('Error fetching tax bands:', error.message); throw error; }
    return data.map(band => ({
        id: band.id,
        bandOrder: band.band_order,
        chargeableAmount: band.chargeable_amount,
        rate: band.rate
    }));
};

export const upsertTaxBands = async (bands: TaxBand[]) => {
    const payload = bands.map(b => ({
        id: b.id,
        band_order: b.bandOrder,
        chargeable_amount: b.chargeableAmount,
        rate: b.rate,
    }));
    const { error } = await supabase.from('tax_bands').upsert(payload);
    if (error) { console.error('Error upserting tax bands:', error.message); throw error; }
};

export const getPayrollSettings = async (): Promise<PayrollSetting[]> => {
    const { data, error } = await supabase.from('payroll_settings').select('*');
    if (error) { console.error('Error fetching payroll settings:', error.message); throw error; }
    return data.map(s => ({
        id: s.id,
        settingKey: s.setting_key,
        settingValue: s.setting_value,
    }));
};

export const upsertPayrollSettings = async (settings: PayrollSetting[]) => {
    const payload = settings.map(s => ({
        id: s.id,
        setting_key: s.settingKey,
        setting_value: s.settingValue,
    }));
    const { error } = await supabase.from('payroll_settings').upsert(payload);
    if (error) { console.error('Error upserting payroll settings:', error.message); throw error; }
};

// --- EMPLOYEE SELF-SERVICE ---

export const createLeaveRequest = async (formData: LeaveRequestFormData): Promise<void> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) throw new Error("Employee record not found for current user.");

    const payload: Database['public']['Tables']['leave_requests']['Insert'] = {
        employee_id: employee.id,
        leave_type_id: formData.leaveTypeId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days: formData.days,
        status: 'Pending'
    };
    const { error } = await supabase.from('leave_requests').insert([payload]);
    if (error) {
        console.error('Error creating leave request:', error.message);
        throw error;
    }
};

export const getEmployeeDataForUser = async (): Promise<Employee | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('employees')
        .select(`*, departments(name), job_titles(name), contract_types(name)`)
        .eq('profile_id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching employee data for user:', error.message);
        return null;
    }
    if (!data) return null;

    return mapEmployeeData(data);
};

export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];

    const { data, error } = await supabase
        .from('leave_requests')
        .select(`*, employee:employees!inner(full_name), leaveType:leave_types(id, name)`)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user leave requests:', error.message);
        throw error;
    }

    return data.map((req: any) => ({
        id: req.id,
        employeeId: req.employee_id,
        leaveTypeId: req.leaveType.id,
        employeeName: req.employee.full_name,
        leaveType: req.leaveType.name,
        startDate: req.start_date,
        endDate: req.end_date,
        status: req.status,
        days: req.days,
    }));
};

export const getMyPayslips = async (): Promise<(PayrollData & { period: string })[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];

    const { data, error } = await supabase
        .from('payroll_details')
        .select(`*, payroll_run:payroll_runs!inner(month, year, run_date)`)
        .eq('employee_id', employee.id)
        .eq('payroll_run.status', 'Finalized')
        .order('run_date', { referencedTable: 'payroll_runs', ascending: false });

    if (error) {
        console.error("Error fetching payslips:", error.message);
        throw error;
    }
    
    return data.map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: employee.fullName,
        basicSalary: d.basic_salary,
        grossPay: d.gross_pay,
        taxableIncome: d.taxable_income,
        netPay: d.net_pay,
        breakdown: d.breakdown as PayrollBreakdown,
        period: `${new Date(d.payroll_run.year, d.payroll_run.month - 1).toLocaleString('default', { month: 'long' })} ${d.payroll_run.year}`
    }));
};

export const getFinalizedPayrollDetailsForYear = async (employeeId: string, year: number) => {
    const { data, error } = await supabase
        .from('payroll_details')
        .select(`
            gross_pay,
            taxable_income,
            paye,
            napsa,
            payroll_run:payroll_runs!inner(month, year)
        `)
        .eq('employee_id', employeeId)
        .eq('payroll_run.year', year)
        .eq('payroll_run.status', 'Finalized');

    if (error) {
        console.error('Error fetching finalized payroll details for year:', error.message);
        throw error;
    }
    return data.map(item => ({...item, ...item.payroll_run}));
};

// --- DOCUMENT MANAGEMENT ---

const DOCS_BUCKET = 'employee-documents';

export const listEmployeeDocuments = async (employeeId: string): Promise<EmployeeDocument[]> => {
    const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error listing documents:', error.message);
        throw error;
    }
    return data.map(doc => ({
        id: doc.id,
        employeeId: doc.employee_id,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        uploadedAt: doc.uploaded_at
    }));
};

export const uploadEmployeeDocument = async (employeeId: string, file: File): Promise<void> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${employeeId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(filePath, file);
    if (uploadError) {
        console.error('Error uploading file:', uploadError.message);
        throw uploadError;
    }

    const { error: dbError } = await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
    });

    if (dbError) {
        console.error('Error saving document record:', dbError.message);
        // Attempt to clean up orphaned file in storage
        await supabase.storage.from(DOCS_BUCKET).remove([filePath]);
        throw dbError;
    }
};

export const getEmployeeDocumentDownloadUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(filePath, 3600); // URL valid for 1 hour
    if (error) {
        console.error('Error creating signed URL:', error.message);
        throw error;
    }
    return data.signedUrl;
};

export const deleteEmployeeDocument = async (doc: EmployeeDocument): Promise<void> => {
    const { error: storageError } = await supabase.storage.from(DOCS_BUCKET).remove([doc.filePath]);
    if (storageError) {
        console.error('Error deleting from storage:', storageError.message);
        throw storageError;
    }

    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if (dbError) {
        console.error('Error deleting record from DB:', dbError.message);
        // This is problematic, as the file is gone but the record remains.
        // For now, we'll just log it, but a more robust solution might be needed.
        throw dbError;
    }
};

// --- REPORTS ---

export const getPayeReturnReportData = async (month: number, year: number): Promise<PayeReturnRow[]> => {
    const { data: runData, error: runError } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .maybeSingle();
    
    if (runError) throw runError;
    if (!runData) return [];

    const { data: details, error: detailsError } = await supabase
        .from('payroll_details')
        .select('id, gross_pay, paye, employee:employees!inner(full_name, nrc, tpin)')
        .eq('payroll_run_id', runData.id);

    if (detailsError) throw detailsError;
    if (!details) return [];

    return (details as any[]).map((d: any) => ({
        id: d.id,
        employeeName: d.employee.full_name,
        nrc: d.employee.nrc,
        tpin: d.employee.tpin || 'N/A',
        grossPay: d.gross_pay,
        paye: d.paye
    }));
};

export const getNapsaReturnReportData = async (month: number, year: number): Promise<NapsaReturnRow[]> => {
    const { data: runData, error: runError } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .maybeSingle();
    
    if (runError) throw runError;
    if (!runData) return [];

    const { data: settings, error: settingsError } = await supabase
        .from('payroll_settings')
        .select('setting_value')
        .eq('setting_key', 'napsa_ceiling')
        .single();

    if (settingsError) throw settingsError;
    const napsaCeiling = parseFloat(settings.setting_value);

    const { data: details, error: detailsError } = await supabase
        .from('payroll_details')
        .select('id, basic_salary, napsa, employee:employees!inner(full_name, nrc, napsa_number)')
        .eq('payroll_run_id', runData.id);
    
    if (detailsError) throw detailsError;
    if (!details) return [];

    return (details as any[]).map((d: any) => ({
        id: d.id,
        employeeName: d.employee.full_name,
        nrc: d.employee.nrc,
        napsaNumber: d.employee.napsa_number || 'N/A',
        contributionBase: Math.min(d.basic_salary, napsaCeiling),
        employeeContribution: d.napsa
    }));
};

export const getNhimaReturnReportData = async (month: number, year: number): Promise<NhimaReturnRow[]> => {
    const { data: runData, error: runError } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .maybeSingle();
    
    if (runError) throw runError;
    if (!runData) return [];

    const { data: details, error: detailsError } = await supabase
        .from('payroll_details')
        .select('id, nhima, employee:employees!inner(full_name, nrc, nhis_id)')
        .eq('payroll_run_id', runData.id);
    
    if (detailsError) throw detailsError;
    if (!details) return [];

    return (details as any[]).map((d: any) => ({
        id: d.id,
        employeeName: d.employee.full_name,
        nrc: d.employee.nrc,
        nhisId: d.employee.nhis_id || 'N/A',
        nhimaContribution: d.nhima
    }));
};


// --- BRANDING ---
const BRANDING_BUCKET = 'branding-assets';

export const getBrandingSettings = async (): Promise<BrandingSettings> => {
    const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        console.error('Error fetching branding settings:', error.message);
        throw error;
    }

    if (!data) { // Provide default if no settings exist
        return { id: 1, companyName: 'Your Company', companyAddress: null, logoUrl: null };
    }

    return {
        id: data.id,
        companyName: data.company_name,
        companyAddress: data.company_address,
        logoUrl: data.logo_url,
    };
};

export const updateBrandingSettings = async (settings: Partial<Omit<BrandingSettings, 'id'>>): Promise<BrandingSettings> => {
    const payload: Database['public']['Tables']['branding_settings']['Update'] = {
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        logo_url: settings.logoUrl,
    };
    
    const { data, error } = await supabase
        .from('branding_settings')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();

    if (error) {
        console.error('Error updating branding settings:', error.message);
        throw error;
    }

    return {
        id: data.id,
        companyName: data.company_name,
        companyAddress: data.company_address,
        logoUrl: data.logo_url,
    };
};

export const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;

    // Remove old logo if it exists to prevent clutter
    const { data: list, error: listError } = await supabase.storage.from(BRANDING_BUCKET).list();
    if (listError) console.error("Could not list old logos for deletion", listError.message);
    if (list && list.length > 0) {
        const filesToRemove = list.map(x => x.name);
        await supabase.storage.from(BRANDING_BUCKET).remove(filesToRemove);
    }
    
    const { error: uploadError } = await supabase.storage.from(BRANDING_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
    });

    if (uploadError) {
        console.error('Logo upload error:', uploadError.message);
        throw uploadError;
    }
    
    const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
};

// --- HOLIDAYS & LEAVE BALANCES ---

export const getCompanyHolidays = async (year: number): Promise<CompanyHoliday[]> => {
    const { data, error } = await supabase
        .from('company_holidays')
        .select('*')
        .gte('holiday_date', `${year}-01-01`)
        .lte('holiday_date', `${year}-12-31`)
        .order('holiday_date');

    if (error) {
        console.error('Error fetching holidays:', error.message);
        throw error;
    }
    return data.map(h => ({ id: h.id, name: h.name, holidayDate: h.holiday_date }));
};

export const createCompanyHoliday = async (name: string, holidayDate: string) => {
    const { data, error } = await supabase
        .from('company_holidays')
        .insert({ name, holiday_date: holidayDate });
    if (error) throw error;
    return data;
};

export const deleteCompanyHoliday = async (id: string) => {
    const { error } = await supabase.from('company_holidays').delete().eq('id', id);
    if (error) throw error;
};

export const getLeaveBalances = async (employeeId: string): Promise<LeaveBalance[]> => {
    const { data, error } = await supabase
        .from('leave_balances')
        .select('*, leave_type:leave_types(name)')
        .eq('employee_id', employeeId);

    if (error) {
        console.error('Error fetching leave balances:', error.message);
        throw error;
    }
    return data.map((b: any) => ({
        id: b.id,
        employeeId: b.employee_id,
        leaveTypeId: b.leave_type_id,
        balanceDays: b.balance_days,
        leaveTypeName: b.leave_type.name,
    }));
};

export const adjustLeaveBalance = async (employeeId: string, leaveTypeId: string, balanceDays: number) => {
    const { data, error } = await supabase
        .from('leave_balances')
        .upsert({ employee_id: employeeId, leave_type_id: leaveTypeId, balance_days: balanceDays }, { onConflict: 'employee_id, leave_type_id' });
    if (error) throw error;
    return data;
};

export const getMyLeaveBalances = async (): Promise<LeaveBalance[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];
    return getLeaveBalances(employee.id);
};