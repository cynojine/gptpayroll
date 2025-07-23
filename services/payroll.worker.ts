

import { calculatePayrollForEmployee } from './payrollCalculations';
import type { Employee, PayrollData, PayrollCalculationSettings } from '../types';

/**
 * This is a Web Worker that handles payroll calculations in a background thread.
 * It receives a list of employees and payroll settings, calculates the payroll for each,
 * and posts the results back to the main thread.
 * This prevents the UI from freezing during heavy computations.
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
    // Perform the heavy calculation
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