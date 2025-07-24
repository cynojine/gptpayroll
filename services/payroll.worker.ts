
// All type imports are compile-time only and will be stripped.
// This prevents runtime module resolution issues in the worker.
import type { Employee, PayrollData, PayrollCalculationSettings, TaxBand, PayeBandCalculation } from '../types';

// --- Start of inlined content from services/payrollCalculations.ts ---
// This code is duplicated from payrollCalculations.ts to make the worker self-contained,
// preventing module resolution errors in the worker environment.

const calculatePaye = (taxableIncome: number, taxBands: TaxBand[]): { totalPaye: number; payeBreakdown: PayeBandCalculation[] } => {
    let totalPaye = 0;
    let incomeRemaining = taxableIncome;
    const payeBreakdown: PayeBandCalculation[] = [];

    const sortedBands = [...taxBands].sort((a, b) => a.bandOrder - b.bandOrder);
    let cumulativeLowerBound = 0;

    for (const band of sortedBands) {
        let bandDescription = '';
        if (band.bandOrder === 1) {
            bandDescription = `First K${band.chargeableAmount?.toLocaleString()}`;
        } else if (band.chargeableAmount) {
            const upperBound = cumulativeLowerBound + band.chargeableAmount;
            bandDescription = `Next K${(cumulativeLowerBound + 0.01).toLocaleString()} to K${upperBound.toLocaleString()}`;
        } else {
            bandDescription = `K${(cumulativeLowerBound + 0.01).toLocaleString()} and Above`;
        }

        if (incomeRemaining <= 0) {
            payeBreakdown.push({ bandDescription, chargeableIncomeInBand: 0, rate: band.rate, taxDue: 0 });
            if (band.chargeableAmount) {
                cumulativeLowerBound += band.chargeableAmount;
            }
            continue;
        };

        const bandChargeableLimit = band.chargeableAmount;
        const amountInBand = bandChargeableLimit === null
            ? incomeRemaining
            : Math.min(incomeRemaining, bandChargeableLimit);
        
        const taxInBand = amountInBand * band.rate;
        totalPaye += taxInBand;

        payeBreakdown.push({
            bandDescription,
            chargeableIncomeInBand: amountInBand,
            rate: band.rate,
            taxDue: taxInBand,
        });

        incomeRemaining -= amountInBand;
        if (band.chargeableAmount) {
            cumulativeLowerBound += band.chargeableAmount;
        }
    }

    return { totalPaye, payeBreakdown };
}

const calculateNapsa = (basicSalary: number, rate: number, ceiling: number): number => {
    const contributionBase = Math.min(basicSalary, ceiling);
    return contributionBase * rate;
}

const calculateNhima = (basicSalary: number, rate: number, maxContribution: number): number => {
    const contribution = basicSalary * rate;
    return Math.min(contribution, maxContribution);
}

const calculatePayrollForEmployee = (employee: Employee, settings: PayrollCalculationSettings): PayrollData => {
    const { taxBands, napsaRate, napsaCeiling, nhimaRate, nhimaMaxContribution } = settings;
    
    const basicSalary = employee.salary;
    const additions: { name: string; amount: number; isTaxable: boolean }[] = [];
    const deductions: { name: string; amount: number }[] = [];
    let taxableAdditions = 0;
    let nonTaxableAdditions = 0;

    (employee.payrollItems || []).forEach(item => {
        let amount = 0;
        if (item.item_calculationType === 'Percentage') {
            amount = basicSalary * (item.value / 100);
        } else {
            amount = item.value;
        }
        
        const isTaxable = (item as any).is_taxable;

        if (item.item_type === 'Addition') {
            additions.push({ name: item.item_name!, amount, isTaxable });
            if (isTaxable) {
                taxableAdditions += amount;
            } else {
                nonTaxableAdditions += amount;
            }
        } else {
            deductions.push({ name: item.item_name!, amount });
        }
    });

    const grossForNapsa = basicSalary; // Typically calculated on basic salary
    const napsa = calculateNapsa(grossForNapsa, napsaRate, napsaCeiling);

    // Taxable income is basic salary + taxable additions.
    const taxableIncome = basicSalary + taxableAdditions;
    const { totalPaye, payeBreakdown } = calculatePaye(taxableIncome > 0 ? taxableIncome : 0, taxBands);
    
    // Gross pay is basic salary plus ALL additions (taxable and non-taxable).
    const grossPay = basicSalary + taxableAdditions + nonTaxableAdditions;

    // NHIMA is based on basic salary and is not tax-deductible.
    const nhima = calculateNhima(basicSalary, nhimaRate, nhimaMaxContribution);
    
    const totalCustomDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const totalStatutoryDeductions = totalPaye + napsa + nhima;
    const netPay = grossPay - totalStatutoryDeductions - totalCustomDeductions;

    return {
        id: employee.id,
        employeeId: employee.id,
        employeeName: employee.fullName,
        basicSalary,
        grossPay,
        taxableIncome,
        netPay,
        breakdown: {
            additions,
            deductions,
            statutory: { napsa, nhima, paye: totalPaye },
            payeBreakdown
        }
    };
};
// --- End of inlined content ---

/**
 * This is a Web Worker that handles payroll calculations in a background thread.
 * It receives a list of employees and payroll settings, calculates the payroll for each,
 * and posts the results back to the main thread.
 */
self.onmessage = (e: MessageEvent<{ employees: Employee[]; payrollSettings: PayrollCalculationSettings }>) => {
  const { employees, payrollSettings } = e.data;
  
  if (!employees || !payrollSettings) {
    self.postMessage({ 
      type: 'ERROR', 
      payload: 'Invalid data received by the payroll worker.' 
    });
    return;
  }

  try {
    // Perform the heavy calculation using the inlined function
    const processedData: PayrollData[] = employees
      .filter(emp => emp.status === 'Active')
      .map(emp => calculatePayrollForEmployee(emp, payrollSettings));
    
    // Send the result back to the main thread
    self.postMessage({ type: 'SUCCESS', payload: processedData });
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      payload: error instanceof Error ? error.message : 'An unknown error occurred in the payroll worker.' 
    });
  }
};
