

import { supabase } from './supabase';
import { Database, Employee, LeaveRequest, Profile, Department, JobTitle, ContractType, LeaveType, SettingsCategory, SettingsTableName, EmployeeFormData, UpdateEmployeeFormData, PayrollItem, EmployeePayrollItem, PayrollData, TaxBand, PayrollSetting, LeaveRequestFormData, PayrollBreakdown, Json, EmployeeDocument, PayeReturnRow, NapsaReturnRow, BrandingSettings, NhimaReturnRow, CompanyHoliday, LeaveBalance, PolicyDocument } from '../types';

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
    // v2 compatibility
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
        item_name: pi.payroll_items?.name,
        item_type: pi.payroll_items?.type,
        item_calculationType: pi.payroll_items?.calculation_type,
        is_taxable: pi.payroll_items?.is_taxable,
    })) : []
});

export const getEmployees = async (includePayrollItems = false): Promise<Employee[]> => {
    let query = supabase
        .from('employees')
        .select(`
            *,
            job_titles(name),
            departments(name),
            contract_types(name)
            ${includePayrollItems ? `, employee_payroll_items(id, value, payroll_items(name, type, calculation_type, is_taxable))` : ''}
        `)
        .order('full_name', { ascending: true });

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching employees:', error.message);
        throw error;
    }
    return data.map(mapEmployeeData);
}

export const getEmployeeById = async (id: string): Promise<Employee> => {
    const { data, error } = await supabase
        .from('employees')
        .select(`
            *,
            job_titles(name),
            departments(name),
            contract_types(name),
            employee_payroll_items(
                id,
                value,
                payroll_items(name, type, calculation_type, is_taxable)
            )
        `)
        .eq('id', id)
        .single<any>();
        
    if (error) {
        console.error('Error fetching employee by ID:', error.message);
        throw error;
    }
    
    return mapEmployeeData(data);
}

export const createEmployee = async (formData: EmployeeFormData): Promise<{ employee: Employee; temporaryPassword: string; }> => {
    const { email } = formData;
    const temporaryPassword = Math.random().toString(36).slice(-16);
    
    // v2 compatibility: Store admin session, create user, then restore admin session
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
        throw new Error("Admin user is not authenticated. Cannot create new employee.");
    }

    // Sign up the new user. This will change the current session.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: temporaryPassword,
    });
    
    // After signUp, immediately restore the admin's session regardless of the outcome
    const { error: setSessionError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
    });
    
    if (setSessionError) {
        // This is a critical failure. The admin is now logged out.
        console.error("CRITICAL: Failed to restore admin session after creating a new user. The admin is now logged out.", setSessionError);
        throw new Error("Failed to restore admin session. Please log in again.");
    }

    if (signUpError) {
        throw signUpError;
    }
    if (!signUpData.user) {
        throw new Error("User creation failed, but no error was reported from Supabase.");
    }
    
    const newUserId = signUpData.user.id;
    
    // Now, as the admin user, create the profile and employee records.
    try {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: newUserId,
                role: 'employee',
                first_name: formData.fullName.split(' ')[0],
                last_name: formData.fullName.split(' ').slice(1).join(' ') || null
            });
        
        if (profileError) {
            // NOTE: If this fails, we should delete the auth user we just created.
            // This requires an admin client, which is best done in a server-side function.
            // For now, we log a critical warning.
            console.error(`CRITICAL: User ${email} was created in Auth but profile creation failed. Orphaned user exists.`, profileError);
            throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        const { data: newEmployee, error: employeeError } = await supabase
            .from('employees')
            .insert({
                profile_id: newUserId,
                full_name: formData.fullName,
                nrc: formData.nrc,
                tpin: formData.tpin,
                napsa_number: formData.napsaNumber,
                email: formData.email,
                phone: formData.phone,
                salary: formData.salary,
                hire_date: formData.hireDate,
                department_id: formData.departmentId,
                job_title_id: formData.jobTitleId,
                contract_type_id: formData.contractTypeId,
                employee_number: formData.employeeNumber,
                social_security_number: formData.socialSecurityNumber,
                nhis_id: formData.nhisId,
                grade: formData.grade,
                pay_point: formData.payPoint,
                bank_name: formData.bankName,
                account_number: formData.accountNumber,
                division: formData.division,
            })
            .select()
            .single();

        if (employeeError) {
            console.error(`CRITICAL: User ${email} was created in Auth but employee record creation failed. Orphaned user exists.`, employeeError);
            throw new Error(`Failed to create employee record: ${employeeError.message}`);
        }
        
        return { employee: newEmployee as Employee, temporaryPassword };

    } catch (dbError: any) {
        throw dbError;
    }
};

export const updateEmployee = async (id: string, formData: UpdateEmployeeFormData): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .update({
        full_name: formData.fullName,
        nrc: formData.nrc,
        tpin: formData.tpin,
        napsa_number: formData.napsaNumber,
        email: formData.email,
        phone: formData.phone,
        salary: formData.salary,
        hire_date: formData.hireDate,
        department_id: formData.departmentId,
        job_title_id: formData.jobTitleId,
        contract_type_id: formData.contractTypeId,
        status: formData.status,
        employee_number: formData.employeeNumber,
        social_security_number: formData.socialSecurityNumber,
        nhis_id: formData.nhisId,
        grade: formData.grade,
        pay_point: formData.payPoint,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        division: formData.division,
      })
      .eq('id', id)
      .select()
      .single();
  
    if (error) {
      console.error('Error updating employee:', error.message);
      throw error;
    }
    return data as Employee;
};

export const deleteEmployee = async (id: string): Promise<void> => {
    const { data: documents, error: listError } = await supabase.storage.from('employee-documents').list(id);
    if(listError) {
        console.error("Could not list documents to delete, but proceeding with employee deletion.", listError);
    }
    if (documents && documents.length > 0) {
        const filePaths = documents.map(doc => `${id}/${doc.name}`);
        const { error: deleteFilesError } = await supabase.storage.from('employee-documents').remove(filePaths);
        if (deleteFilesError) {
            console.error("Failed to delete associated documents from storage.", deleteFilesError);
        }
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
};

export const resetEmployeePassword = async (email: string) => {
    // v2 compatibility
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
};

// Payroll Item Management
export const getPayrollItems = async (): Promise<PayrollItem[]> => {
    const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching payroll items:', error.message);
        throw error;
    }
    // Manually map from snake_case to camelCase
    return data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        calculationType: item.calculation_type,
        isTaxable: item.is_taxable,
    }));
};

export const createPayrollItem = (item: Omit<PayrollItem, 'id'>) => {
    return supabase.from('payroll_items').insert({
        name: item.name,
        type: item.type,
        calculation_type: item.calculationType,
        is_taxable: item.isTaxable,
    }).select().single();
};

export const updatePayrollItem = (id: string, item: Omit<PayrollItem, 'id'>) => {
    return supabase.from('payroll_items').update({
        name: item.name,
        type: item.type,
        calculation_type: item.calculationType,
        is_taxable: item.isTaxable
    }).eq('id', id).select().single();
};
export const deletePayrollItem = (id: string) => supabase.from('payroll_items').delete().eq('id', id);


// Employee Payroll Item Management
export const getEmployeePayrollItems = async (employeeId: string): Promise<EmployeePayrollItem[]> => {
    const { data, error } = await supabase
        .from('employee_payroll_items')
        .select(`*, payroll_items(name, type, calculation_type, is_taxable)`)
        .eq('employee_id', employeeId);
    if (error) throw error;
    return data.map((item: any) => ({
        id: item.id,
        employeeId: item.employee_id,
        payrollItemId: item.payroll_item_id,
        value: item.value,
        item_name: item.payroll_items.name,
        item_type: item.payroll_items.type,
        item_calculationType: item.payroll_items.calculation_type,
    }));
};
export const addEmployeePayrollItem = (employeeId: string, payrollItemId: string, value: number) => supabase.from('employee_payroll_items').insert({ employee_id: employeeId, payroll_item_id: payrollItemId, value });
export const removeEmployeePayrollItem = (id: string) => supabase.from('employee_payroll_items').delete().eq('id', id);

// Leave Management
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employees(full_name), leave_types(name)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((req: any) => ({
        ...req,
        employeeName: req.employees.full_name,
        leaveType: req.leave_types.name,
        startDate: req.start_date,
        endDate: req.end_date,
    }));
};

export const updateLeaveRequestStatus = async (id: string, status: 'Approved' | 'Rejected'): Promise<void> => {
    // If approving, we need to debit the balance
    if (status === 'Approved') {
        const { data: request, error: fetchError } = await supabase.from('leave_requests').select('*').eq('id', id).single();
        if (fetchError || !request) throw new Error("Could not fetch leave request to update balance.");

        const { data: balance, error: balanceError } = await supabase.from('leave_balances').select('id, balance_days').eq('employee_id', request.employee_id).eq('leave_type_id', request.leave_type_id).single();

        if (balanceError && balanceError.code !== 'PGRST116') throw new Error("Error fetching current leave balance.");

        const currentBalance = balance?.balance_days || 0;
        const newBalance = currentBalance - request.days;

        if (newBalance < 0) {
            throw new Error("Approving this request would result in a negative leave balance.");
        }

        const { error: upsertError } = await supabase.from('leave_balances').upsert({
            employee_id: request.employee_id,
            leave_type_id: request.leave_type_id,
            balance_days: newBalance,
        }, { onConflict: 'employee_id, leave_type_id' });
        
        if (upsertError) throw new Error("Failed to update leave balance.");
    }
    
    // Note: This does not handle reverting an approved request back to pending and crediting the balance.
    // That would require more complex logic.

    const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
    if (error) throw error;
};

// Tax & Statutory Settings
export const getTaxBands = async (): Promise<TaxBand[]> => {
    const { data, error } = await supabase.from('tax_bands').select('*');
    if (error) throw error;
    return data.map(b => ({
        id: b.id,
        bandOrder: b.band_order,
        chargeableAmount: b.chargeable_amount,
        rate: b.rate
    }));
}
export const upsertTaxBands = async (bands: TaxBand[]) => {
    const payload = bands.map(b => ({
        id: b.id,
        band_order: b.bandOrder,
        chargeable_amount: b.chargeableAmount,
        rate: b.rate
    }));
    const { error } = await supabase.from('tax_bands').upsert(payload);
    if (error) throw error;
}

export const getPayrollSettings = async (): Promise<PayrollSetting[]> => {
    const { data, error } = await supabase.from('payroll_settings').select('*');
    if (error) throw error;
    return data.map(s => ({
        id: s.id,
        settingKey: s.setting_key,
        settingValue: s.setting_value
    }));
}

export const upsertPayrollSettings = async (settings: PayrollSetting[]) => {
    const payload = settings.map(s => ({
        id: s.id,
        setting_key: s.settingKey,
        setting_value: s.settingValue,
    }));
    const { error } = await supabase.from('payroll_settings').upsert(payload);
    if (error) throw error;
}

// Payroll Run
export const savePayrollRun = async (month: number, year: number, data: PayrollData[], status: 'Draft' | 'Finalized') => {
    const { data: { user } } = await supabase.auth.getUser();

    // More robustly check for an existing run, then update or insert.
    const { data: existingRun, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to check for existing payroll run: ${fetchError.message}`);
    }

    let run;
    const runPayload = {
        month,
        year,
        status,
        processed_by: user?.id,
    };

    if (existingRun) {
        // Update existing run
        const { data: updatedRun, error: updateError } = await supabase
            .from('payroll_runs')
            .update(runPayload)
            .eq('id', existingRun.id)
            .select()
            .single();
        if (updateError) throw updateError;
        run = updatedRun;
    } else {
        // Insert new run
        const { data: newRun, error: insertError } = await supabase
            .from('payroll_runs')
            .insert(runPayload)
            .select()
            .single();
        if (insertError) throw insertError;
        run = newRun;
    }
    
    if (!run) throw new Error("Failed to create or update payroll run.");

    // Delete old details for this run to prevent duplicates and re-insert
    await supabase.from('payroll_details').delete().eq('payroll_run_id', run.id);
    
    if (data.length > 0) {
        const detailsPayload = data.map(d => ({
            payroll_run_id: run.id,
            employee_id: d.employeeId,
            basic_salary: d.basicSalary,
            gross_pay: d.grossPay,
            paye: d.breakdown.statutory.paye,
            napsa: d.breakdown.statutory.napsa,
            nhima: d.breakdown.statutory.nhima,
            net_pay: d.netPay,
            breakdown: d.breakdown as Json,
            taxable_income: d.taxableIncome
        }));
        
        const { error: detailsError } = await supabase.from('payroll_details').insert(detailsPayload);
        if (detailsError) throw detailsError;
    }
};

export const getPayrollRun = async (month: number, year: number): Promise<{ payrollData: PayrollData[], status: string } | null> => {
    const { data: run, error: runError } = await supabase.from('payroll_runs').select('id, status').eq('month', month).eq('year', year).single();
    if (runError && runError.code !== 'PGRST116') throw runError;
    if (!run) return null;

    const { data: details, error: detailsError } = await supabase
        .from('payroll_details')
        .select('*, employees(full_name)')
        .eq('payroll_run_id', run.id);
    if (detailsError) throw detailsError;

    const payrollData: PayrollData[] = details.map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: d.employees.full_name,
        basicSalary: d.basic_salary,
        grossPay: d.gross_pay,
        taxableIncome: d.taxable_income,
        netPay: d.net_pay,
        breakdown: d.breakdown,
    }));
    
    return { payrollData, status: run.status };
};

export const getFinalizedPayrollDetailsForYear = async (employeeId: string, year: number) => {
    const { data, error } = (await supabase
        .from('payroll_runs')
        .select('month, payroll_details!inner(gross_pay, taxable_income, paye, napsa)')
        .eq('year', year)
        .eq('status', 'Finalized')
        .eq('payroll_details.employee_id', employeeId)) as any;

    if (error) {
        throw error;
    }
    
    return data.flatMap((run: any) => 
        run.payroll_details.map((detail: any) => ({
            month: run.month,
            gross_pay: detail.gross_pay,
            taxable_income: detail.taxable_income,
            paye: detail.paye,
            napsa: detail.napsa
        }))
    );
};


// Reports
export const getPayeReturnReportData = async (month: number, year: number): Promise<PayeReturnRow[]> => {
    const run = await getPayrollRun(month, year);
    if (!run || run.status !== 'Finalized') return [];
    
    const { data, error } = await supabase.from('payroll_details')
        .select('id, gross_pay, paye, employees!inner(full_name, nrc, tpin)')
        .eq('payroll_run_id', (run.payrollData[0] as any).payroll_run_id || run.payrollData[0].id)

    const {data: details, error: detailsError} = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, gross_pay, paye, employees!inner(full_name, nrc, tpin))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single<any>();
    
    if (detailsError || !details) throw detailsError || new Error("Report data not found.");
    
    return details.payroll_details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        tpin: d.employees.tpin,
        grossPay: d.gross_pay,
        paye: d.paye,
    }));
};

export const getNapsaReturnReportData = async (month: number, year: number): Promise<NapsaReturnRow[]> => {
    const {data: details, error: detailsError} = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, basic_salary, napsa, employees!inner(full_name, nrc, napsa_number))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single<any>();

    if (detailsError || !details) throw detailsError || new Error("Report data not found.");
    
    return details.payroll_details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        napsaNumber: d.employees.napsa_number,
        contributionBase: d.basic_salary,
        employeeContribution: d.napsa,
    }));
};

export const getNhimaReturnReportData = async (month: number, year: number): Promise<NhimaReturnRow[]> => {
    const {data: details, error: detailsError} = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, nhima, employees!inner(full_name, nrc, nhis_id))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single<any>();

    if (detailsError || !details) throw detailsError || new Error("Report data not found.");

    return details.payroll_details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        nhisId: d.employees.nhis_id,
        nhimaContribution: d.nhima
    }));
};


// ESS Functions
export const getEmployeeDataForUser = async (): Promise<Employee | null> => {
    // v2 compatibility
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('employees').select('*, job_titles(name), departments(name), contract_types(name)').eq('profile_id', user.id).single();
    if (error) {
        console.error('Error fetching employee data for user:', error.message);
        return null;
    }
    return mapEmployeeData(data);
};
export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
    // v2 compatibility
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];

    const { data, error } = await supabase.from('leave_requests').select('*, leave_types(name)').eq('employee_id', employee.id).order('start_date', { ascending: false });
    if (error) throw error;
    return data.map((req: any) => ({
        ...req,
        employeeName: employee.fullName,
        leaveType: req.leave_types.name,
        startDate: req.start_date,
        endDate: req.end_date,
    }));
};

export const createLeaveRequest = async (formData: LeaveRequestFormData) => {
    const employee = await getEmployeeDataForUser();
    if (!employee) throw new Error("Employee record not found.");
    const { error } = await supabase.from('leave_requests').insert({
        employee_id: employee.id,
        leave_type_id: formData.leaveTypeId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days: formData.days,
    });
    if (error) throw error;
};

export const getMyPayslips = async (): Promise<(PayrollData & { period: string })[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];
    
    const { data, error } = (await supabase
        .from('payroll_details')
        .select('*, payroll_runs!inner(month, year)')
        .eq('employee_id', employee.id)
        .order('year', { ascending: false, foreignTable: 'payroll_runs' })
        .order('month', { ascending: false, foreignTable: 'payroll_runs' })) as any;
        
    if (error) throw error;

    return data.map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: employee.fullName,
        basicSalary: d.basic_salary,
        grossPay: d.gross_pay,
        taxableIncome: d.taxable_income,
        netPay: d.net_pay,
        breakdown: d.breakdown,
        period: `${new Date(d.payroll_runs.year, d.payroll_runs.month - 1).toLocaleString('default', { month: 'long' })} ${d.payroll_runs.year}`
    }));
};

// Document Management
export const listEmployeeDocuments = async (employeeId: string): Promise<EmployeeDocument[]> => {
    const { data, error } = await supabase.from('employee_documents').select('*').eq('employee_id', employeeId).order('uploaded_at', {ascending: false});
    if(error) throw error;
    return data.map(d => ({
        id: d.id,
        employeeId: d.employee_id,
        fileName: d.file_name,
        filePath: d.file_path,
        fileType: d.file_type,
        fileSize: d.file_size,
        uploadedAt: d.uploaded_at
    }));
}
export const uploadEmployeeDocument = async(employeeId: string, file: File) => {
    const filePath = `${employeeId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('employee-documents').upload(filePath, file);
    if(uploadError) throw uploadError;
    const { error: dbError } = await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
    });
    if(dbError) throw dbError;
}
export const getEmployeeDocumentDownloadUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from('employee-documents').createSignedUrl(filePath, 60); // URL valid for 60 seconds
    if(error) throw error;
    return data.signedUrl;
}
export const deleteEmployeeDocument = async (doc: EmployeeDocument) => {
    const { error: storageError } = await supabase.storage.from('employee-documents').remove([doc.filePath]);
    if(storageError) throw storageError;
    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if(dbError) throw dbError;
}

// Branding
export const getBrandingSettings = async (): Promise<BrandingSettings> => {
    const { data, error } = await supabase.from('branding_settings').select('*').eq('id', 1).single();

    // Handle case where no settings row exists (e.g., fresh install)
    if (error && error.code === 'PGRST116') {
        // Return default values if no settings are configured yet.
        return {
            id: 1,
            companyName: 'GPTPayroll',
            companyAddress: null,
            logoUrl: null,
        };
    }

    if (error) {
        console.error('Error fetching branding settings:', error);
        throw error;
    }
    
    // This should not happen if there's no error, but as a fallback.
    if (!data) {
        return {
            id: 1,
            companyName: 'GPTPayroll',
            companyAddress: null,
            logoUrl: null,
        };
    }
    
    // Correctly map from snake_case (DB) to camelCase (TS)
    return { 
        id: data.id, 
        companyName: data.company_name, 
        companyAddress: data.company_address, 
        logoUrl: data.logo_url 
    };
}
export const updateBrandingSettings = async(settings: { companyName: string | null, companyAddress: string | null, logoUrl: string | null }) => {
    const { error } = await supabase.from('branding_settings').update({
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        logo_url: settings.logoUrl
    }).eq('id', 1);
    if(error) throw error;
}
export const uploadLogo = async (file: File): Promise<string> => {
    const filePath = `public/logo-${Date.now()}`;
    const { error } = await supabase.storage.from('branding-assets').upload(filePath, file, { upsert: true });
    if(error) throw error;
    const { data } = supabase.storage.from('branding-assets').getPublicUrl(filePath);
    return data.publicUrl;
}

// Holidays
export const getCompanyHolidays = async (year: number): Promise<CompanyHoliday[]> => {
    const { data, error } = await supabase.from('company_holidays').select('*').gte('holiday_date', `${year}-01-01`).lte('holiday_date', `${year}-12-31`).order('holiday_date');
    if(error) throw error;
    return data.map(d => ({
        id: d.id,
        name: d.name,
        holidayDate: d.holiday_date
    }));
}
export const createCompanyHoliday = async (name: string, date: string) => {
    const { error } = await supabase.from('company_holidays').insert({ name, holiday_date: date });
    if(error) throw error;
}
export const deleteCompanyHoliday = async (id: string) => {
    const { error } = await supabase.from('company_holidays').delete().eq('id', id);
    if(error) throw error;
}

// Leave Balances
export const getLeaveBalances = async (employeeId: string): Promise<LeaveBalance[]> => {
    const { data, error } = await supabase.from('leave_balances').select('*, leave_types(name)').eq('employee_id', employeeId);
    if(error) throw error;
    return data.map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        leaveTypeId: d.leave_type_id,
        balanceDays: d.balance_days,
        leaveTypeName: d.leave_types.name,
    }));
}
export const getMyLeaveBalances = async(): Promise<LeaveBalance[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];
    return getLeaveBalances(employee.id);
}
export const adjustLeaveBalance = async (employeeId: string, leaveTypeId: string, newBalance: number) => {
    const { error } = await supabase.from('leave_balances').upsert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        balance_days: newBalance
    }, { onConflict: 'employee_id, leave_type_id'});
    if(error) throw error;
}

// Policy Documents
export const listPolicyDocuments = async (): Promise<PolicyDocument[]> => {
    const { data, error } = await supabase.from('policy_documents').select('*').order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
        id: d.id,
        fileName: d.file_name,
        filePath: d.file_path,
        fileType: d.file_type,
        fileSize: d.file_size,
        uploadedAt: d.uploaded_at
    }));
};

export const uploadPolicyDocument = async (file: File) => {
    const filePath = `policies/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('policy-documents').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from('policy_documents').insert({
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
    });
    if (dbError) throw dbError;
};

export const deletePolicyDocument = async (doc: PolicyDocument) => {
    const { error: storageError } = await supabase.storage.from('policy-documents').remove([doc.filePath]);
    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('policy_documents').delete().eq('id', doc.id);
    if (dbError) throw dbError;
};

export const getPoliciesAsText = async (): Promise<string> => {
    const { data: documents, error: listError } = await supabase.from('policy_documents').select('file_path');
    if (listError) throw listError;
    if (!documents || documents.length === 0) return "No policy documents have been uploaded.";

    const downloadPromises = documents.map(doc => supabase.storage.from('policy-documents').download(doc.file_path));
    const downloadedFiles = await Promise.all(downloadPromises);

    let combinedText = '';
    for (const fileResult of downloadedFiles) {
        if (fileResult.error) {
            console.error('Failed to download a policy file:', fileResult.error);
            continue;
        }
        if (fileResult.data) {
            combinedText += await fileResult.data.text() + '\n\n---\n\n';
        }
    }
    return combinedText;
};