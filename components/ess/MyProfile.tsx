
import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getEmployeeDataForUser, getEmployeePayrollItems } from '../../services/api';
import { Employee, EmployeePayrollItem } from '../../types';

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-base text-white">{value || 'N/A'}</dd>
    </div>
);

const AssignedPayrollItems: React.FC<{ employeeId: string }> = ({ employeeId }) => {
    const [items, setItems] = useState<EmployeePayrollItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            const data = await getEmployeePayrollItems(employeeId);
            setItems(data);
            setLoading(false);
        };
        fetchItems();
    }, [employeeId]);
    
    if (loading) return <LoadingSpinner />;
    if (items.length === 0) return <p className="text-slate-500">You have no custom additions or deductions assigned.</p>;

    return (
        <ul className="divide-y divide-slate-700">
            {items.map(item => (
                <li key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                        <span className="font-medium text-slate-200">{item.item_name}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.item_type === 'Addition' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>{item.item_type}</span>
                    </div>
                    <div>
                        <span className="text-slate-300">{item.item_calculationType === 'Fixed' ? `ZMW ${item.value.toLocaleString()}` : `${item.value}%`}</span>
                    </div>
                </li>
            ))}
        </ul>
    )
}

export const MyProfile: React.FC = () => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getEmployeeDataForUser();
                if (data) {
                    setEmployee(data);
                } else {
                    setError("Could not find an employee record linked to your user account.");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching your profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner text="Loading your profile..." />;
    if (error || !employee) return <p className="text-center text-red-400 p-8">{error || 'Employee record not found.'}</p>;
    
    const { fullName, email, phone, nrc, jobTitle, department, hireDate, salary, status, profilePicUrl } = employee;
    const statusColor = status === 'Active' ? 'bg-green-500' : status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center mb-6">
                    <img src={profilePicUrl || `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=14B8A6&color=fff&size=128`} alt={fullName} className="w-24 h-24 rounded-full mr-6 border-4 border-slate-700"/>
                    <div>
                        <h2 className="text-3xl font-bold text-white">{fullName}</h2>
                        <p className="text-lg text-slate-300">{jobTitle || 'No title specified'}</p>
                        <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold leading-5 text-white rounded-full ${statusColor}`}>
                        {status}
                        </span>
                    </div>
                </div>
            
                <div className="border-t border-slate-700 pt-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                        <DetailItem label="Email Address" value={email} />
                        <DetailItem label="Phone Number" value={phone} />
                        <DetailItem label="NRC Number" value={nrc} />
                        <DetailItem label="Department" value={department} />
                        <DetailItem label="Hire Date" value={hireDate} />
                        <DetailItem label="Basic Salary" value={`ZMW ${salary.toLocaleString()}`} />
                    </dl>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Your Payroll Additions & Deductions</h3>
                <AssignedPayrollItems employeeId={employee.id} />
            </Card>
        </div>
    );
};
