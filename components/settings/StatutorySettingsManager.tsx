

import React, { useState, useEffect, useCallback } from 'react';
import { PayrollSetting } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface FormattedSetting {
    id: string;
    key: string;
    value: string;
    label: string;
    isRate: boolean;
}

const keyToLabelMapping: Record<string, string> = {
    napsa_ceiling: 'NAPSA Contribution Ceiling (ZMW)',
    nhima_max_contribution: 'NHIMA Max Contribution (ZMW)',
    napsa_rate: 'NAPSA Rate (%)',
    nhima_rate: 'NHIMA Rate (%)'
};

export const StatutorySettingsManager: React.FC = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState<FormattedSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getPayrollSettings();
            const formatted = data.map(s => ({
                id: s.id,
                key: s.settingKey,
                value: s.settingValue,
                label: keyToLabelMapping[s.settingKey] || s.settingKey,
                isRate: s.settingKey.includes('_rate')
            }));
            setSettings(formatted);
            setError(null);
        } catch (err) {
            setError('Failed to load statutory settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSettingChange = (key: string, value: string) => {
        setSettings(prevSettings =>
            prevSettings.map(s =>
                s.key === key ? { ...s, value } : s
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = settings.map(s => ({
                id: s.id,
                settingKey: s.key,
                settingValue: s.isRate ? String(parseFloat(s.value) / 100) : s.value
            }));
            await api.upsertPayrollSettings(payload);
            addToast('Settings updated successfully!', 'success');
        } catch (err) {
            const msg = 'Failed to save settings.';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading statutory settings..." />;
    if (error && !isSubmitting) return <p className="text-red-400">{error}</p>;

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
            <h3 className="text-lg font-bold mb-4">Statutory Contributions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map(setting => (
                    <div key={setting.key}>
                        <label htmlFor={setting.key} className="block text-sm font-medium text-slate-300">{setting.label}</label>
                        <input
                            id={setting.key}
                            type="number"
                            value={setting.isRate ? parseFloat(setting.value) * 100 : setting.value}
                            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                            className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500"
                >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};
