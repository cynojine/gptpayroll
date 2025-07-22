

import React, { useState, useEffect, useCallback } from 'react';
import { TaxBand } from '../../types';
import * as api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

export const TaxBandManager: React.FC = () => {
    const { addToast } = useToast();
    const [bands, setBands] = useState<TaxBand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadBands = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getTaxBands();
            setBands(data.sort((a,b) => a.bandOrder - b.bandOrder));
            setError(null);
        } catch (err) {
            setError('Failed to load tax bands.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBands();
    }, [loadBands]);

    const handleBandChange = (id: string, field: 'chargeableAmount' | 'rate', value: string) => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) && value !== '') return;

        setBands(prevBands =>
            prevBands.map(band =>
                band.id === id ? { ...band, [field]: value === '' ? null : numericValue } : band
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.upsertTaxBands(bands);
            addToast('Tax bands updated successfully!', 'success');
        } catch (err) {
            const msg = 'Failed to save tax bands.';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <LoadingSpinner text="Loading tax bands..." />
    if (error && !isSubmitting) return <p className="text-red-400">{error}</p>

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
            <h3 className="text-lg font-bold mb-4">ZRA Tax Bands (PAYE)</h3>
            <div className="space-y-3">
                {bands.map((band, index) => (
                    <div key={band.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="font-medium">
                            Band {band.bandOrder}
                            {index === 0 && <span className="text-xs text-slate-400 ml-2">(Tax Free Threshold)</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Chargeable Amount (ZMW)</label>
                            <input
                                type="number"
                                value={band.chargeableAmount ?? ''}
                                onChange={(e) => handleBandChange(band.id, 'chargeableAmount', e.target.value)}
                                placeholder="Top Band"
                                disabled={index === bands.length -1}
                                className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Rate (%)</label>
                            <input
                                type="number"
                                value={band.rate * 100}
                                onChange={(e) => handleBandChange(band.id, 'rate', String(parseFloat(e.target.value) / 100))}
                                className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500"
                >
                    {isSubmitting ? 'Saving...' : 'Save Tax Bands'}
                </button>
            </div>
        </div>
    );
};
