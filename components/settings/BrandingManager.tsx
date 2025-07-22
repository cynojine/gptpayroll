
import React, { useState, useEffect, useCallback } from 'react';
import { BrandingSettings } from '../../types';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const BrandingManager: React.FC = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState<BrandingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getBrandingSettings();
            setSettings(data);
            setLogoPreview(data.logoUrl);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load branding settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        setError(null);

        try {
            let updatedSettings = { ...settings };

            if (logoFile) {
                const newLogoUrl = await api.uploadLogo(logoFile);
                updatedSettings.logoUrl = newLogoUrl;
            }

            await api.updateBrandingSettings({
                companyName: updatedSettings.companyName,
                companyAddress: updatedSettings.companyAddress,
                logoUrl: updatedSettings.logoUrl,
            });

            addToast('Branding settings saved successfully!', 'success');
            setLogoFile(null); // Clear file after upload
            loadSettings(); // Reload to confirm changes
        } catch (err: any) {
            setError(err.message || 'Failed to save settings.');
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <LoadingSpinner text="Loading branding settings..." />;
    if (error) return <p className="text-red-400">{error}</p>;
    if (!settings) return <p className="text-slate-400">Could not initialize branding settings.</p>;

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50 space-y-6">
            <h3 className="text-lg font-bold">Company Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                     <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-300">Company Name</label>
                        <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            value={settings.companyName || ''}
                            onChange={handleSettingsChange}
                            className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"
                        />
                    </div>
                     <div>
                        <label htmlFor="companyAddress" className="block text-sm font-medium text-slate-300">Company Address</label>
                        <textarea
                            name="companyAddress"
                            id="companyAddress"
                            rows={3}
                            value={settings.companyAddress || ''}
                            onChange={handleSettingsChange}
                            className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Company Logo</label>
                    <div className="mt-1 flex flex-col items-center space-y-4">
                        <div className="w-48 h-24 bg-slate-700 rounded-md flex items-center justify-center">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain"/>
                            ) : (
                                <span className="text-slate-500 text-sm">No Logo</span>
                            )}
                        </div>
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Choose File...
                        </label>
                         {logoFile && <span className="text-sm text-slate-400">{logoFile.name}</span>}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500"
                >
                    {isSaving ? 'Saving...' : 'Save Branding Settings'}
                </button>
            </div>
        </div>
    );
};
