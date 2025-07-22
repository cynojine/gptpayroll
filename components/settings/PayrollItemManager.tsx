
import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PayrollItem } from '../../types';
import * as api from '../../services/api';

const initialFormState: Omit<PayrollItem, 'id'> = {
  name: '',
  type: 'Addition',
  calculationType: 'Fixed',
  isTaxable: true,
};

export const PayrollItemManager: React.FC = () => {
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<PayrollItem | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPayrollItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payroll items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await api.updatePayrollItem(isEditing.id, formData);
      } else {
        await api.createPayrollItem(formData);
      }
      setFormData(initialFormState);
      setIsEditing(null);
      await loadItems();
    } catch (err) {
      setError('Failed to save payroll item. Name might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: PayrollItem) => {
    setIsEditing(item);
    setFormData({ name: item.name, type: item.type, calculationType: item.calculationType, isTaxable: item.isTaxable });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payroll item?')) {
      try {
        await api.deletePayrollItem(id);
        await loadItems();
      } catch (err) {
        setError('Failed to delete item. It may be in use by an employee.');
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
        <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Payroll Item' : 'Create New Payroll Item'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3" placeholder="e.g., Housing Allowance"/>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Type</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
              <option value="Addition">Addition</option>
              <option value="Deduction">Deduction</option>
            </select>
          </div>
          <div>
            <label htmlFor="calculationType" className="block text-sm font-medium">Calculation</label>
            <select id="calculationType" name="calculationType" value={formData.calculationType} onChange={handleChange} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
              <option value="Fixed">Fixed Amount</option>
              <option value="Percentage">Percentage of Basic</option>
            </select>
          </div>
          <div className="flex items-end">
          {formData.type === 'Addition' && (
             <div className="flex items-center h-full mt-1">
                <input id="isTaxable" name="isTaxable" type="checkbox" checked={formData.isTaxable} onChange={handleChange} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-emerald-600 focus:ring-emerald-500"/>
                <label htmlFor="isTaxable" className="ml-2 block text-sm">Is Taxable?</label>
              </div>
          )}
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-3">
            <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">{isSubmitting ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}</button>
            {isEditing && (<button type="button" onClick={handleCancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>)}
        </div>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      
      {loading ? ( <LoadingSpinner /> ) : (
        <div className="flow-root">
            <ul role="list" className="divide-y divide-slate-700">
            {items.map((item) => (
                <li key={item.id} className="py-3 sm:py-4 grid grid-cols-4 gap-4 items-center">
                    <p className="font-medium text-slate-200 truncate col-span-1">{item.name}</p>
                    <p className="text-sm col-span-1"><span className={`px-2 py-1 text-xs rounded-full ${item.type === 'Addition' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>{item.type}</span></p>
                    <p className="text-sm text-slate-400 col-span-1">{item.calculationType}</p>
                    <div className="space-x-4 text-right col-span-1">
                        <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400 font-medium text-sm">Delete</button>
                    </div>
                </li>
            ))}
            </ul>
        </div>
      )}
    </div>
  );
};
