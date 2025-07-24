import * as React from 'react';
import { getEmployeeDataForUser } from '../../services/api';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmployeeDocuments } from '../documents/EmployeeDocuments';

export const MyDocuments: React.FC = () => {
    const [employeeId, setEmployeeId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const employee = await getEmployeeDataForUser();
                if (employee) {
                    setEmployeeId(employee.id);
                } else {
                    setError("Could not find an employee record for your account.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch your employee information.");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, []);

    if (loading) return <LoadingSpinner text="Loading your documents..." />;
    if (error) return <p className="text-red-400 text-center py-8">{error}</p>;

    return (
        <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Your Documents</h2>
            {employeeId ? (
                <EmployeeDocuments employeeId={employeeId} isAdminView={false} />
            ) : (
                <p className="text-slate-400 text-center py-8">No employee record found to display documents.</p>
            )}
        </Card>
    );
};