import * as React from 'react';
import { Card } from './common/Card';
import { Table } from './common/Table';
import { LeaveRequest } from '../types';
import { getLeaveRequests, updateLeaveRequestStatus } from '../services/api';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

export const LeaveManagement: React.FC = () => {
  const { addToast } = useToast();
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequests();
      setLeaveRequests(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch leave requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeaveRequests();
  }, []);
  
  const handleStatusChange = async (request: LeaveRequest, newStatus: 'Approved' | 'Rejected') => {
      const originalRequests = [...leaveRequests];
      const updatedRequests = leaveRequests.map(req => 
        req.id === request.id ? { ...req, status: newStatus } : req
      );
      setLeaveRequests(updatedRequests);

      try {
        await updateLeaveRequestStatus(request, newStatus);
        addToast(`Leave request has been ${newStatus.toLowerCase()}. Balance updated.`, 'success');
        // No need to re-fetch, the optimistic update and balance logic are sufficient.
      } catch (err) {
        setLeaveRequests(originalRequests); // Revert on failure
        addToast(`Failed to update status: ${(err as Error).message}`, 'error');
      }
  }

  const columns = [
    { header: 'Employee', accessor: 'employeeName' as keyof LeaveRequest },
    { header: 'Leave Type', accessor: 'leaveType' as keyof LeaveRequest },
    { header: 'Start Date', accessor: 'startDate' as keyof LeaveRequest },
    { header: 'End Date', accessor: 'endDate' as keyof LeaveRequest },
    { header: 'Days', accessor: 'days' as keyof LeaveRequest },
    { 
        header: 'Status', 
        accessor: 'status' as keyof LeaveRequest,
        render: (item: LeaveRequest) => {
            const color = item.status === 'Approved' ? 'text-green-400' : item.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400';
            return <span className={`font-semibold ${color}`}>{item.status}</span>
        }
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof LeaveRequest,
      render: (item: LeaveRequest) => (
        item.status === 'Pending' ? (
          <div className="flex space-x-2">
            <button onClick={() => handleStatusChange(item, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition">Approve</button>
            <button onClick={() => handleStatusChange(item, 'Rejected')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition">Reject</button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Leave Requests</h2>
      </div>
      {loading && <LoadingSpinner />}
      {error && <p className="text-center text-red-400">{error}</p>}
      {!loading && !error && <Table columns={columns} data={leaveRequests} />}
    </Card>
  );
};