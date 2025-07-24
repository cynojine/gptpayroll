

import * as React from 'react';
import { PolicyDocument } from '../../types';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const PolicyDocumentManager: React.FC = () => {
    const { addToast } = useToast();
    const [documents, setDocuments] = React.useState<PolicyDocument[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);

    const loadDocuments = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.listPolicyDocuments();
            setDocuments(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load policy documents.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type !== 'text/plain') {
                addToast('Only .txt files are allowed for policies.', 'error');
                return;
            }
            setFileToUpload(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!fileToUpload || isUploading) return;
        setIsUploading(true);
        setError(null);
        try {
            await api.uploadPolicyDocument(fileToUpload);
            addToast('Policy document uploaded successfully!', 'success');
            setFileToUpload(null);
            (document.getElementById('policy-upload') as HTMLInputElement).value = ''; // Reset file input
            await loadDocuments();
        } catch (err: any) {
            addToast(err.message || 'File upload failed.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (doc: PolicyDocument) => {
        if (window.confirm(`Are you sure you want to delete "${doc.fileName}"? This will affect the AI Assistant's knowledge base.`)) {
            try {
                await api.deletePolicyDocument(doc);
                addToast('Policy document deleted.', 'success');
                await loadDocuments();
            } catch (err: any) {
                addToast(err.message || 'Failed to delete document.', 'error');
            }
        }
    };

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
            <h3 className="text-lg font-bold mb-2">Company Policies</h3>
            <p className="text-sm text-slate-400 mb-4">Upload and manage `.txt` files that form the knowledge base for the AI Policy Assistant.</p>
            
            <div className="mb-6 p-4 border border-dashed border-slate-700 rounded-lg flex items-center space-x-4">
                <label htmlFor="policy-upload" className="sr-only">Choose policy file</label>
                <input 
                    id="policy-upload" 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".txt"
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-800 file:text-emerald-300 hover:file:bg-emerald-700"
                />
                <button 
                    onClick={handleUpload} 
                    disabled={!fileToUpload || isUploading} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            
            {loading ? <LoadingSpinner /> : error ? <p className="text-red-400 text-center">{error}</p> : (
                documents.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No policy documents uploaded yet.</p>
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
                                    <button onClick={() => handleDelete(doc)} className="text-red-500 hover:text-red-400 font-medium text-sm">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
};