import * as React from 'react';
import { PayrollCalculationSettings, PayrollSetting } from '../../types';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface StatutorySettingsManagerProps {
    settings: PayrollCalculationSettings | null;
    onDataChange: () => void;
}

interface FormattedSetting {
    id: string; // This might be a synthetic key if the original is not available
    key: string;
    value: string;
    label: string;
    isRate: boolean;
}

const keyToLabelMapping: Record<string, string> = {
    napsaCeiling: 'NAPSA Contribution Ceiling (ZMW)',
    nhimaMaxContribution: 'NHIMA Max Contribution (ZMW)',
    napsaRate: 'NAPSA Rate (%)',
    nhimaRate: 'NHIMA Rate (%)'
};

export const StatutorySettingsManager: React.FC<StatutorySettingsManagerProps> = ({ settings, onDataChange }) => {
    const { addToast } = useToast();
    const [formattedSettings, setFormattedSettings] = React.useState<FormattedSetting[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (settings) {
            const transformedSettings: FormattedSetting[] = [
                { id: 'napsa_rate', key: 'napsaRate', value: String(settings.napsaRate), label: keyToLabelMapping.napsaRate, isRate: true },
                { id: 'napsa_ceiling', key: 'napsaCeiling', value: String(settings.napsaCeiling), label: keyToLabelMapping.napsaCeiling, isRate: false },
                { id: 'nhima_rate', key: 'nhimaRate', value: String(settings.nhimaRate), label: keyToLabelMapping.nhimaRate, isRate: true },
                { id: 'nhima_max_contribution', key: 'nhimaMaxContribution', value: String(settings.nhimaMaxContribution), label: keyToLabelMapping.nhimaMaxContribution, isRate: false },
            ];
            setFormattedSettings(transformedSettings);
        }
    }, [settings]);

    const handleSettingChange = (key: string, value: string) => {
        setFormattedSettings(prevSettings =>
            prevSettings.map(s =>
                s.key === key ? { ...s, value } : s
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: PayrollSetting[] = formattedSettings.map(s => ({
                id: s.id, // The ID here is the original setting_key from the DB
                settingKey: s.id,
                settingValue: s.isRate ? String(parseFloat(s.value) / 100) : s.value
            }));
            await api.upsertPayrollSettings(payload);
            addToast('Settings updated successfully!', 'success');
            onDataChange();
        } catch (err) {
            const msg = 'Failed to save settings.';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!settings) return <p className="text-yellow-400">Statutory settings could not be loaded.</p>;
    if (error) return <p className="text-red-400">{error}</p>;

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
            <h3 className="text-lg font-bold mb-4">Statutory Contributions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formattedSettings.map(setting => (
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