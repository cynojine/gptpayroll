
import React, { useState, useEffect, useCallback } from 'react';
import { EmployeePayrollItem, PayrollItem } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EmployeePayrollItemsProps {
  employeeId: string;
}

export const EmployeePayrollItems: React.FC<EmployeePayrollItemsProps> = ({ employeeId }) => {
  const [assignedItems, setAssignedItems] = useState<EmployeePayrollItem[]>([]);
  const [availableItems, setAvailableItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [value, setValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        api.getEmployeePayrollItems(employeeId),
        api.getPayrollItems(),
      ]);
      setAssignedItems(assigned);
      setAvailableItems(available);
      setError(null);
    } catch (err) {
      setError('Failed to load payroll item data.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || value <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.addEmployeePayrollItem(employeeId, selectedItemId, value);
      setSelectedItemId('');
      setValue(0);
      await loadData();
    } catch (err) {
      setError('Failed to add item. It may already be assigned.');
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeId, selectedItemId, value, isSubmitting, loadData]);
  
  const handleRemoveItem = useCallback(async (id: string) => {
    try {
        await api.removeEmployeePayrollItem(id);
        await loadData();
    } catch(err) {
        setError("Failed to remove item.");
    }
  }, [loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <form onSubmit={handleAddItem} className="mb-6 p-4 border border-dashed border-slate-700 rounded-lg flex items-end space-x-3">
        <div className="flex-grow">
          <label htmlFor="payrollItemId" className="block text-sm font-medium">Payroll Item</label>
          <select id="payrollItemId" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            <option value="" disabled>Select an item</option>
            {availableItems.filter(item => !assignedItems.some(a => a.payrollItemId === item.id)).map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.type})</option>
            ))}
          </select>
        </div>
        <div className="w-1/4">
          <label htmlFor="value" className="block text-sm font-medium">Value (ZMW or %)</label>
          <input type="number" id="value" value={value} onChange={e => setValue(parseFloat(e.target.value))} required min="0" step="any" className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
        </div>
        <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      {error && <p className="text-red-400 mb-4">{error}</p>}
      
      <h4 className="text-md font-semibold text-slate-300 mb-2">Assigned Items</h4>
      {assignedItems.length === 0 ? (
        <p className="text-slate-500">No payroll items assigned to this employee.</p>
      ) : (
        <ul className="divide-y divide-slate-700">
            {assignedItems.map(item => (
                <li key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                        <span className="font-medium text-slate-200">{item.item_name}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.item_type === 'Addition' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>{item.item_type}</span>
                    </div>
                    <div>
                        <span className="text-slate-300">{item.item_calculationType === 'Fixed' ? `ZMW ${item.value.toLocaleString()}` : `${item.value}%`}</span>
                        <button onClick={() => handleRemoveItem(item.id)} className="ml-6 text-red-500 hover:text-red-400 font-medium text-sm">&times; Remove</button>
                    </div>
                </li>
            ))}
        </ul>
      )}
    </div>
  );
};
