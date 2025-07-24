import * as React from 'react';
import { Card } from './common/Card';
import { Table } from './common/Table';
import { Employee } from '../types';
import { getEmployees } from '../services/api';
import { LoadingSpinner } from './common/LoadingSpinner';
import { AddEmployeeModal } from './employees/AddEmployeeModal';
import { EmployeeDetail } from './employees/EmployeeDetail';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);

  const fetchEmployees = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch employees.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  
  const handleEmployeeAdded = () => {
    setIsAddModalOpen(false);
    fetchEmployees(); // Refresh the list
  }
  
  const handleEmployeeDeleted = () => {
    setSelectedEmployeeId(null);
    fetchEmployees();
  }

  const columns = [
    {
      header: 'Employee',
      accessor: 'fullName' as keyof Employee,
      render: (item: Employee) => (
        <div className="flex items-center">
          <img src={item.profilePicUrl || `https://ui-avatars.com/api/?name=${item.fullName.replace(' ', '+')}&background=0D9488&color=fff`} alt={item.fullName} className="w-10 h-10 rounded-full mr-4"/>
          <div>
            <div className="font-bold text-white">{item.fullName}</div>
            <div className="text-sm text-slate-400">{item.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Job Title', accessor: 'jobTitle' as keyof Employee },
    { header: 'Department', accessor: 'department' as keyof Employee },
    {
      header: 'Status',
      accessor: 'status' as keyof Employee,
      render: (item: Employee) => {
        const statusColor = item.status === 'Active' ? 'bg-green-500' : item.status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <span className={`px-2 py-1 text-xs font-semibold leading-5 text-white rounded-full ${statusColor}`}>
            {item.status}
          </span>
        );
      },
    },
    { header: 'Hire Date', accessor: 'hireDate' as keyof Employee },
    { 
        header: 'Actions', 
        accessor: 'id' as keyof Employee,
        render: (item: Employee) => (
            <button 
              onClick={() => setSelectedEmployeeId(item.id)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Details
            </button>
        )
    }
  ];

  if (selectedEmployeeId) {
    return (
      <EmployeeDetail 
        employeeId={selectedEmployeeId} 
        onBack={() => setSelectedEmployeeId(null)}
        onEmployeeDeleted={handleEmployeeDeleted}
      />
    );
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Employee Master Records</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Add Employee
          </button>
        </div>
        {loading && <LoadingSpinner />}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!loading && !error && <Table columns={columns} data={employees} />}
      </Card>
      
      <AddEmployeeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={handleEmployeeAdded}
      />
    </>
  );
};