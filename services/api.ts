


import type { PostgrestSingleResponse } from '@supabase/supabase-js';
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
        throw new Error(error.message);
    }
    return (data as unknown as T[]) || [];
}

export const getDepartments = () => getCategoryItems<Department>('departments');
export const createDepartment = async (name: string): Promise<Department> => {
    const payload: Database['public']['Tables']['departments']['Insert'] = { name };
    const { data, error } = await supabase.from('departments').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Department creation failed.");
    return data as unknown as Department;
};
export const updateDepartment = async (id: string, name: string): Promise<Department> => {
    const payload: Database['public']['Tables']['departments']['Update'] = { name };
    const { data, error } = await supabase.from('departments').update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Department update failed.");
    return data as unknown as Department;
};
export const deleteDepartment = async (id: string): Promise<void> => {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const getJobTitles = () => getCategoryItems<JobTitle>('job_titles');
export const createJobTitle = async (name: string): Promise<JobTitle> => {
    const payload: Database['public']['Tables']['job_titles']['Insert'] = { name };
    const { data, error } = await supabase.from('job_titles').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Job Title creation failed.");
    return data as unknown as JobTitle;
};
export const updateJobTitle = async (id: string, name: string): Promise<JobTitle> => {
    const payload: Database['public']['Tables']['job_titles']['Update'] = { name };
    const { data, error } = await supabase.from('job_titles').update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Job Title update failed.");
    return data as unknown as JobTitle;
};
export const deleteJobTitle = async (id: string): Promise<void> => {
    const { error } = await supabase.from('job_titles').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const getContractTypes = () => getCategoryItems<ContractType>('contract_types');
export const createContractType = async (name: string): Promise<ContractType> => {
    const payload: Database['public']['Tables']['contract_types']['Insert'] = { name };
    const { data, error } = await supabase.from('contract_types').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Contract Type creation failed.");
    return data as unknown as ContractType;
};
export const updateContractType = async (id: string, name: string): Promise<ContractType> => {
    const payload: Database['public']['Tables']['contract_types']['Update'] = { name };
    const { data, error } = await supabase.from('contract_types').update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Contract Type update failed.");
    return data as unknown as ContractType;
};
export const deleteContractType = async (id: string): Promise<void> => {
    const { error } = await supabase.from('contract_types').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const getLeaveTypes = () => getCategoryItems<LeaveType>('leave_types');
export const createLeaveType = async (name: string): Promise<LeaveType> => {
    const payload: Database['public']['Tables']['leave_types']['Insert'] = { name };
    const { data, error } = await supabase.from('leave_types').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Leave Type creation failed.");
    return data as unknown as LeaveType;
};
export const updateLeaveType = async (id: string, name: string): Promise<LeaveType> => {
    const payload: Database['public']['Tables']['leave_types']['Update'] = { name };
    const { data, error } = await supabase.from('leave_types').update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Leave Type update failed.");
    return data as unknown as LeaveType;
};
export const deleteLeaveType = async (id: string): Promise<void> => {
    const { error } = await supabase.from('leave_types').delete().eq('id', id);
    if (error) throw new Error(error.message);
};


export const getProfileForUser = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    type ProfileRow = Database['public']['Tables']['profiles']['Row'];
    const response: PostgrestSingleResponse<ProfileRow> = await supabase.from('profiles').select('id, first_name, last_name, role').eq('id', user.id).single();
    
    if (response.error && response.error.code !== 'PGRST116') { 
        console.error('Error fetching profile:', response.error.message); 
        return null; 
    }
    
    const profileData = response.data;
    if (!profileData) return null;
    
    return {
        id: profileData.id,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        role: profileData.role
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
        throw new Error(error.message);
    }
    return (data || []).map(mapEmployeeData);
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
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error(`Employee with ID ${id} not found.`);
    }
    
    return mapEmployeeData(data);
}

export const createEmployee = async (formData: EmployeeFormData): Promise<Employee> => {
    const newEmployeePayload: Database['public']['Tables']['employees']['Insert'] = {
        profile_id: null, // Initially no login
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
    };

    const { data: newEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert([newEmployeePayload])
        .select('id')
        .single();

    if (employeeError) {
        console.error(`Failed to create employee record:`, employeeError);
        throw new Error(`Failed to create employee record: ${employeeError.message}`);
    }
    if (!newEmployee) {
        throw new Error("Failed to retrieve created employee record after insert.");
    }
    
    return getEmployeeById(newEmployee.id);
};

export const createLoginForEmployee = async (employeeId: string, email: string): Promise<void> => {
    // 1. Get the admin's session to restore it later.
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
        throw new Error("Admin user is not authenticated. Cannot create new employee login.");
    }

    const temporaryPassword = Math.random().toString(36).slice(-16);
    
    // 2. Sign up the new user. This will change the current session.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: temporaryPassword,
    });
    
    // 3. Immediately and robustly restore the admin's session. This is the crucial step.
    const { error: setSessionError } = await supabase.auth.setSession(adminSession);
    
    if (setSessionError) {
        console.error("CRITICAL: Failed to restore admin session after creating a new user login. The admin is now logged out.", setSessionError);
        throw new Error("Failed to restore admin session. Please log in again.");
    }

    // 4. Now that the admin's session is secure, check for errors from the signUp operation.
    if (signUpError) {
        throw new Error(signUpError.message);
    }
    if (!signUpData.user) {
        throw new Error("User creation failed, but no error was reported from Supabase.");
    }
    
    const newUserId = signUpData.user.id;
    
    try {
        // 5. Link the new auth user to the employee record.
        const { error: linkError } = await supabase
            .from('employees')
            .update({ profile_id: newUserId } as any)
            .eq('id', employeeId);

        if (linkError) {
            throw new Error(`Failed to link new login to employee record: ${linkError.message}`);
        }

        // 6. Send the user a password reset email so they can set their own password.
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
        });
        
        if (resetError) {
            console.warn(`User login created for ${email}, but failed to send password reset email.`, resetError);
            throw new Error(`Login created, but failed to send reset email: ${resetError.message}`);
        }
    } catch(err) {
        // If these steps fail, an orphaned auth user might exist that requires manual cleanup.
        console.error(`CRITICAL: An error occurred after user ${email} was created in Auth. An orphaned user may exist.`, err);
        throw err;
    }
};


export const updateEmployee = async (id: string, formData: UpdateEmployeeFormData): Promise<Employee> => {
    const employeeUpdate: Database['public']['Tables']['employees']['Update'] = {
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
    };
    const { error } = await supabase
      .from('employees')
      .update(employeeUpdate as any)
      .eq('id', id);
  
    if (error) {
      console.error('Error updating employee:', error.message);
      throw new Error(error.message);
    }
    return getEmployeeById(id);
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
    if (error) throw new Error(error.message);
};

export const resetEmployeePassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
    });
    if (error) throw new Error(error.message);
};

export const getPayrollItems = async (): Promise<PayrollItem[]> => {
    const { data, error } = await supabase
        .from('payroll_items')
        .select('id, name, type, calculation_type, is_taxable')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching payroll items:', error.message);
        throw new Error(error.message);
    }
    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        calculationType: item.calculation_type,
        isTaxable: item.is_taxable,
    }));
};

export const createPayrollItem = async (item: Omit<PayrollItem, 'id'>): Promise<PayrollItem> => {
    const payload: Database['public']['Tables']['payroll_items']['Insert'] = {
        name: item.name,
        type: item.type,
        calculation_type: item.calculationType,
        is_taxable: item.isTaxable,
    };
    const { data, error } = await supabase.from('payroll_items').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Payroll item creation failed.");
    const row = data as any;
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        calculationType: row.calculation_type,
        isTaxable: row.is_taxable,
    };
};

export const updatePayrollItem = async (id: string, item: Omit<PayrollItem, 'id'>): Promise<PayrollItem> => {
     const payload: Database['public']['Tables']['payroll_items']['Update'] = {
        name: item.name,
        type: item.type,
        calculation_type: item.calculationType,
        is_taxable: item.isTaxable
    };
    const { data, error } = await supabase.from('payroll_items').update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Payroll item update failed.");
    const row = data as any;
     return {
        id: row.id,
        name: row.name,
        type: row.type,
        calculationType: row.calculation_type,
        isTaxable: row.is_taxable,
    };
};
export const deletePayrollItem = async (id: string): Promise<void> => {
    const { error } = await supabase.from('payroll_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const getEmployeePayrollItems = async (employeeId: string): Promise<EmployeePayrollItem[]> => {
    const { data, error } = await supabase
        .from('employee_payroll_items')
        .select(`*, payroll_items(name, type, calculation_type, is_taxable)`)
        .eq('employee_id', employeeId);
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employee_id,
        payrollItemId: item.payroll_item_id,
        value: item.value,
        item_name: item.payroll_items.name,
        item_type: item.payroll_items.type,
        item_calculationType: item.payroll_items.calculation_type,
    }));
};
export const addEmployeePayrollItem = async (employeeId: string, payrollItemId: string, value: number): Promise<void> => {
    const payload: Database['public']['Tables']['employee_payroll_items']['Insert'] = { employee_id: employeeId, payroll_item_id: payrollItemId, value };
    const { error } = await supabase.from('employee_payroll_items').insert([payload]);
    if (error) throw new Error(error.message);
}
export const removeEmployeePayrollItem = async (id: string): Promise<void> => {
    const { error } = await supabase.from('employee_payroll_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employees(full_name), leave_types(name)')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((req: any) => ({
        id: req.id,
        employeeId: req.employee_id,
        leaveTypeId: req.leave_type_id,
        days: req.days,
        employeeName: req.employees?.full_name || 'N/A',
        leaveType: req.leave_types?.name || 'N/A',
        startDate: req.start_date,
        endDate: req.end_date,
        status: req.status
    }));
};

export const updateLeaveRequestStatus = async (request: LeaveRequest, status: 'Approved' | 'Rejected'): Promise<void> => {
    if (status === 'Approved') {
        const {data: balanceData, error: balanceError}: PostgrestSingleResponse<{id: string, balance_days: number}> = await supabase.from('leave_balances').select('id, balance_days').eq('employee_id', request.employeeId).eq('leave_type_id', request.leaveTypeId).single();

        if (balanceError && balanceError.code !== 'PGRST116') throw new Error("Error fetching current leave balance.");
        
        const currentBalance = balanceData?.balance_days || 0;
        const newBalance = currentBalance - request.days;

        if (newBalance < 0) {
            throw new Error("Approving this request would result in a negative leave balance.");
        }

        const upsertPayload: Database['public']['Tables']['leave_balances']['Insert'] = {
            employee_id: request.employeeId,
            leave_type_id: request.leaveTypeId,
            balance_days: newBalance,
        };

        const { error: upsertError } = await supabase.from('leave_balances').upsert([upsertPayload], { onConflict: 'employee_id, leave_type_id' });
        
        if (upsertError) throw new Error("Failed to update leave balance.");
    }
    
    const payload: Database['public']['Tables']['leave_requests']['Update'] = { status };
    const { error } = await supabase.from('leave_requests').update(payload as any).eq('id', request.id);
    if (error) throw new Error(error.message);
};

export const getTaxBands = async (): Promise<TaxBand[]> => {
    const { data, error } = await supabase.from('tax_bands').select('id, band_order, chargeable_amount, rate');
    if (error) throw new Error(error.message);
    return (data || []).map((b: any) => ({
        id: b.id,
        bandOrder: b.band_order,
        chargeableAmount: b.chargeable_amount,
        rate: b.rate
    }));
}
export const upsertTaxBands = async (bands: TaxBand[]) => {
    const payload: Database['public']['Tables']['tax_bands']['Insert'][] = bands.map(b => ({
        id: b.id,
        band_order: b.bandOrder,
        chargeable_amount: b.chargeableAmount,
        rate: b.rate
    }));
    const { error } = await supabase.from('tax_bands').upsert(payload as any);
    if (error) throw new Error(error.message);
}

export const getPayrollSettings = async (): Promise<PayrollSetting[]> => {
    const { data, error } = await supabase.from('payroll_settings').select('id, setting_key, setting_value');
    if (error) throw new Error(error.message);
    return (data || []).map((s: any) => ({
        id: s.id,
        settingKey: s.setting_key,
        settingValue: s.setting_value
    }));
}

export const upsertPayrollSettings = async (settings: PayrollSetting[]) => {
    const payload: Database['public']['Tables']['payroll_settings']['Insert'][] = settings.map(s => ({
        id: s.id,
        setting_key: s.settingKey,
        setting_value: s.settingValue,
    }));
    const { error } = await supabase.from('payroll_settings').upsert(payload as any);
    if (error) throw new Error(error.message);
}

export const savePayrollRun = async (month: number, year: number, data: PayrollData[], status: 'Draft' | 'Finalized') => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existingRun, error: fetchError }: PostgrestSingleResponse<{id: string}> = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to check for existing payroll run: ${fetchError.message}`);
    }
    
    let runId: string;

    if (existingRun) {
        const runPayload: Database['public']['Tables']['payroll_runs']['Update'] = {
            status,
            processed_by: user?.id || null,
            run_date: new Date().toISOString()
        };
        const { data: updatedRun, error: updateError } = await supabase
            .from('payroll_runs')
            .update(runPayload as any)
            .eq('id', existingRun.id)
            .select('id')
            .single();
        if (updateError) throw new Error(updateError.message);
        if (!updatedRun) throw new Error("Failed to update payroll run.");
        runId = updatedRun.id;
    } else {
        const runPayload: Database['public']['Tables']['payroll_runs']['Insert'] = {
            month,
            year,
            status,
            processed_by: user?.id || null,
            run_date: new Date().toISOString()
        };
        const { data: insertedRun, error: insertError } = await supabase
            .from('payroll_runs')
            .insert([runPayload])
            .select('id')
            .single();
        if (insertError) throw new Error(insertError.message);
        if (!insertedRun) throw new Error("Failed to create payroll run.");
        runId = insertedRun.id;
    }
    
    await supabase.from('payroll_details').delete().eq('payroll_run_id', runId);
    
    if (data.length > 0) {
        const detailsPayload: Database['public']['Tables']['payroll_details']['Insert'][] = data.map(d => ({
            payroll_run_id: runId,
            employee_id: d.employeeId,
            basic_salary: d.basicSalary,
            gross_pay: d.grossPay,
            paye: d.breakdown.statutory.paye,
            napsa: d.breakdown.statutory.napsa,
            nhima: d.breakdown.statutory.nhima,
            net_pay: d.netPay,
            breakdown: d.breakdown as unknown as Json,
            taxable_income: d.taxableIncome
        }));
        
        const { error: detailsError } = await supabase.from('payroll_details').insert(detailsPayload);
        if (detailsError) throw new Error(detailsError.message);
    }
};

export const getPayrollRun = async (month: number, year: number): Promise<{ payrollData: PayrollData[], status: string } | null> => {
    const { data: runData, error: runError } = await supabase.from('payroll_runs').select('id, status').eq('month', month).eq('year', year).single();
    if (runError && runError.code !== 'PGRST116') throw new Error(runError.message);
    if (!runData) return null;
    
    const run = runData as unknown as { id: string, status: string };

    const { data: details, error: detailsError } = await supabase
        .from('payroll_details')
        .select('*, employees(full_name)')
        .eq('payroll_run_id', run.id);
    if (detailsError) throw new Error(detailsError.message);

    const payrollData: PayrollData[] = (details || []).map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: d.employees?.full_name || 'N/A',
        basicSalary: d.basic_salary,
        grossPay: d.gross_pay,
        taxableIncome: d.taxable_income,
        netPay: d.net_pay,
        breakdown: d.breakdown,
    }));
    
    return { payrollData, status: run.status };
};

export const getFinalizedPayrollDetailsForYear = async (employeeId: string, year: number): Promise<{month: number, gross_pay: number, taxable_income: number, paye: number, napsa: number}[]> => {
    const { data, error } = await supabase
        .from('payroll_runs')
        .select('month, payroll_details!inner(gross_pay, taxable_income, paye, napsa)')
        .eq('year', year)
        .eq('status', 'Finalized')
        .eq('payroll_details.employee_id', employeeId);

    if (error) {
        throw new Error(error.message);
    }
    
    if (!data) {
        return [];
    }
    
    type FinalizedRun = {
        month: number;
        payroll_details: {
            gross_pay: number;
            taxable_income: number;
            paye: number;
            napsa: number;
        }[];
    }

    return (data as any as FinalizedRun[]).flatMap(run => 
        run.payroll_details.map(detail => ({
            month: run.month,
            ...detail
        }))
    );
};

export const getPayeReturnReportData = async (month: number, year: number): Promise<PayeReturnRow[]> => {
    const { data, error } = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, gross_pay, paye, employees!inner(full_name, nrc, tpin))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return [];

    const details = (data as any).payroll_details;
    
    return details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        tpin: d.employees.tpin,
        grossPay: d.gross_pay,
        paye: d.paye,
    }));
};

export const getNapsaReturnReportData = async (month: number, year: number): Promise<NapsaReturnRow[]> => {
    const { data, error } = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, basic_salary, napsa, employees!inner(full_name, nrc, napsa_number))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return [];
    
    const details = (data as any).payroll_details;

    return details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        napsaNumber: d.employees.napsa_number,
        contributionBase: d.basic_salary,
        employeeContribution: d.napsa,
    }));
};

export const getNhimaReturnReportData = async (month: number, year: number): Promise<NhimaReturnRow[]> => {
    const { data, error } = await supabase
        .from('payroll_runs')
        .select(`id, payroll_details!inner(id, nhima, employees!inner(full_name, nrc, nhis_id))`)
        .eq('month', month)
        .eq('year', year)
        .eq('status', 'Finalized')
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return [];
    
    const details = (data as any).payroll_details;

    return details.map((d: any) => ({
        id: d.id,
        employeeName: d.employees.full_name,
        nrc: d.employees.nrc,
        nhisId: d.employees.nhis_id,
        nhimaContribution: d.nhima
    }));
};

export const getEmployeeDataForUser = async (): Promise<Employee | null> => {
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
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];

    const { data, error } = await supabase.from('leave_requests').select('*, leave_types(name)').eq('employee_id', employee.id).order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((req: any) => ({
        ...req,
        employeeName: employee.fullName,
        leaveType: req.leave_types?.name || 'N/A',
        startDate: req.start_date,
        endDate: req.end_date,
    }));
};

export const createLeaveRequest = async (formData: LeaveRequestFormData) => {
    const employee = await getEmployeeDataForUser();
    if (!employee) throw new Error("Employee record not found.");
    const payload: Database['public']['Tables']['leave_requests']['Insert'] = {
        employee_id: employee.id,
        leave_type_id: formData.leaveTypeId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days: formData.days,
    };
    const { error } = await supabase.from('leave_requests').insert([payload]);
    if (error) throw new Error(error.message);
};

export const getMyPayslips = async (): Promise<(PayrollData & { period: string })[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];
    
    const { data, error } = await supabase
        .from('payroll_details')
        .select('*, payroll_runs!inner(month, year)')
        .eq('employee_id', employee.id)
        .order('year', { ascending: false, foreignTable: 'payroll_runs' })
        .order('month', { ascending: false, foreignTable: 'payroll_runs' });
        
    if (error) throw new Error(error.message);
    
    if (!data) return [];

    return data.map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: employee.fullName,
        basicSalary: d.basic_salary,
        grossPay: d.gross_pay,
        taxableIncome: d.taxable_income,
        netPay: d.net_pay,
        breakdown: d.breakdown as unknown as PayrollBreakdown,
        period: `${new Date(d.payroll_runs.year, d.payroll_runs.month - 1).toLocaleString('default', { month: 'long' })} ${d.payroll_runs.year}`
    }));
};

export const listEmployeeDocuments = async (employeeId: string): Promise<EmployeeDocument[]> => {
    const { data, error } = await supabase.from('employee_documents').select('*').eq('employee_id', employeeId).order('uploaded_at', {ascending: false});
    if(error) throw new Error(error.message);
    return (data || []).map((d: any) => ({
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
    if(uploadError) throw new Error(uploadError.message);
    const payload: Database['public']['Tables']['employee_documents']['Insert'] = {
        employee_id: employeeId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
    };
    const { error: dbError } = await supabase.from('employee_documents').insert([payload]);
    if(dbError) throw new Error(dbError.message);
}
export const getEmployeeDocumentDownloadUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from('employee-documents').createSignedUrl(filePath, 60);
    if(error) throw new Error(error.message);
    return data.signedUrl;
}
export const deleteEmployeeDocument = async (doc: EmployeeDocument) => {
    const { error: storageError } = await supabase.storage.from('employee-documents').remove([doc.filePath]);
    if(storageError) throw new Error(storageError.message);
    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if(dbError) throw new Error(dbError.message);
}

export const getBrandingSettings = async (): Promise<BrandingSettings> => {
    const { data, error } = await supabase.from('branding_settings').select('*').eq('id', 1).single();

    if (error && error.code === 'PGRST116') {
        return {
            id: 1,
            companyName: 'GPTPayroll',
            companyAddress: null,
            logoUrl: null,
        };
    }

    if (error) {
        console.error('Error fetching branding settings:', error);
        throw new Error(error.message);
    }
    
    if (!data) {
         return { id: 1, companyName: 'GPTPayroll', companyAddress: null, logoUrl: null };
    }
    
    const settings = data as any;
    return { 
        id: settings.id, 
        companyName: settings.company_name, 
        companyAddress: settings.company_address, 
        logoUrl: settings.logo_url 
    };
}
export const updateBrandingSettings = async(settings: { companyName: string | null, companyAddress: string | null, logoUrl: string | null }) => {
    const payload: Database['public']['Tables']['branding_settings']['Update'] = {
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        logo_url: settings.logoUrl
    };
    const { error } = await supabase.from('branding_settings').update(payload as any).eq('id', 1);
    if(error) throw new Error(error.message);
}
export const uploadLogo = async (file: File): Promise<string> => {
    const filePath = `public/logo-${Date.now()}`;
    const { error } = await supabase.storage.from('branding-assets').upload(filePath, file, { upsert: true });
    if(error) throw new Error(error.message);
    const { data } = supabase.storage.from('branding-assets').getPublicUrl(filePath);
    return data.publicUrl;
}

export const getCompanyHolidays = async (year: number): Promise<CompanyHoliday[]> => {
    const { data, error } = await supabase.from('company_holidays').select('*').gte('holiday_date', `${year}-01-01`).lte('holiday_date', `${year}-12-31`).order('holiday_date');
    if(error) throw new Error(error.message);
    return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        holidayDate: d.holiday_date
    }));
}
export const createCompanyHoliday = async (name: string, date: string) => {
    const payload: Database['public']['Tables']['company_holidays']['Insert'] = { name, holiday_date: date };
    const { error } = await supabase.from('company_holidays').insert([payload]);
    if(error) throw new Error(error.message);
}
export const deleteCompanyHoliday = async (id: string) => {
    const { error } = await supabase.from('company_holidays').delete().eq('id', id);
    if(error) throw new Error(error.message);
}

export const getLeaveBalances = async (employeeId: string): Promise<LeaveBalance[]> => {
    const { data, error } = await supabase.from('leave_balances').select('*, leave_types(name)').eq('employee_id', employeeId);
    if(error) throw new Error(error.message);
    return (data || []).map((d: any) => ({
        id: d.id,
        employeeId: d.employee_id,
        leaveTypeId: d.leave_type_id,
        balanceDays: d.balance_days,
        leaveTypeName: d.leave_types?.name,
    }));
}
export const getMyLeaveBalances = async(): Promise<LeaveBalance[]> => {
    const employee = await getEmployeeDataForUser();
    if (!employee) return [];
    return getLeaveBalances(employee.id);
}
export const adjustLeaveBalance = async (employeeId: string, leaveTypeId: string, newBalance: number) => {
    const payload: Database['public']['Tables']['leave_balances']['Insert'] = {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        balance_days: newBalance
    };
    const { error } = await supabase.from('leave_balances').upsert([payload] as any, { onConflict: 'employee_id, leave_type_id'});
    if(error) throw new Error(error.message);
}

export const listPolicyDocuments = async (): Promise<PolicyDocument[]> => {
    const { data, error } = await supabase.from('policy_documents').select('*').order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => ({
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
    if (uploadError) throw new Error(uploadError.message);
    
    const payload: Database['public']['Tables']['policy_documents']['Insert'] = {
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
    };

    const { error: dbError } = await supabase.from('policy_documents').insert([payload]);
    if (dbError) throw new Error(dbError.message);
};

export const deletePolicyDocument = async (doc: PolicyDocument) => {
    const { error: storageError } = await supabase.storage.from('policy-documents').remove([doc.filePath]);
    if (storageError) throw new Error(storageError.message);

    const { error: dbError } = await supabase.from('policy_documents').delete().eq('id', doc.id);
    if (dbError) throw new Error(dbError.message);
};

export const getPoliciesAsText = async (): Promise<string> => {
    const { data: documentsData, error: listError } = await supabase.from('policy_documents').select('file_path');
    if (listError) throw new Error(listError.message);
    const typedDocumentsData = documentsData as unknown as { file_path: string }[] | null;
    if (!typedDocumentsData || typedDocumentsData.length === 0) return "No policy documents have been uploaded.";

    const downloadPromises = typedDocumentsData.map(doc => {
        return supabase.storage.from('policy-documents').download(doc.file_path);
    });
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
