import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeDocument } from '../../types';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EmployeeDocumentsProps {
    employeeId: string;
    isAdminView: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const EmployeeDocuments: React.FC<EmployeeDocumentsProps> = ({ employeeId, isAdminView }) => {
    const { addToast } = useToast();
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.listEmployeeDocuments(employeeId);
            setDocuments(data);
            setError(null);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load documents.';
            console.error('Load documents error:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!fileToUpload || isUploading) return;
        setIsUploading(true);
        setError(null);
        try {
            await api.uploadEmployeeDocument(employeeId, fileToUpload);
            addToast('File uploaded successfully!', 'success');
            setFileToUpload(null);
            (document.getElementById('file-upload') as HTMLInputElement).value = ''; // Reset file input
            await loadDocuments();
        } catch (err: any) {
            const errorMessage = err.message || 'File upload failed. Please try again.';
            console.error('File upload error:', errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDownload = async (doc: EmployeeDocument) => {
        try {
            const url = await api.getEmployeeDocumentDownloadUrl(doc.filePath);
            window.open(url, '_blank');
        } catch (err: any) {
            const errorMessage = err.message || 'Could not get download link.';
            console.error('Download error:', errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    const handleDelete = async (doc: EmployeeDocument) => {
        if (window.confirm(`Are you sure you want to delete "${doc.fileName}"? This cannot be undone.`)) {
            try {
                await api.deleteEmployeeDocument(doc);
                addToast('Document deleted successfully.', 'success');
                await loadDocuments();
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to delete document.';
                console.error('Delete error:', errorMessage);
                addToast(errorMessage, 'error');
            }
        }
    };

    if (loading) return <LoadingSpinner text="Loading documents..." />;
    if (error) return <p className="text-red-400 text-center py-4">{error}</p>;

    return (
        <div>
            {isAdminView && (
                <div className="mb-6 p-4 border border-dashed border-slate-700 rounded-lg flex items-center space-x-4">
                    <label htmlFor="file-upload" className="sr-only">Choose file</label>
                    <input id="file-upload" type="file" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-800 file:text-emerald-300 hover:file:bg-emerald-700"/>
                    <button onClick={handleUpload} disabled={!fileToUpload || isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            )}
             {documents.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No documents found.</p>
             ) : (
                <ul className="divide-y divide-slate-700">
                    {documents.map(doc => (
                        <li key={doc.id} className="py-3 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-md">
                            <div className="flex items-center space-x-3">
                                <svg className="w-6 h-6 text-slate-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                <div>
                                    <p className="font-medium text-slate-200">{doc.fileName}</p>
                                    <p className="text-sm text-slate-400">
                                        {formatBytes(doc.fileSize)} &bull; Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => handleDownload(doc)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Download</button>
                                {isAdminView && (
                                     <button onClick={() => handleDelete(doc)} className="text-red-500 hover:text-red-400 font-medium text-sm">Delete</button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
             )}
        </div>
    );
};