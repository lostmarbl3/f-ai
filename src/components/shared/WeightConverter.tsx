
import React, { useState } from 'react';
import Input from '../ui/Input';
import { kgToLbs, lbsToKg } from '../../utils/conversions';

const WeightConverter: React.FC = () => {
    const [lbs, setLbs] = useState('');
    const [kg, setKg] = useState('');

    const handleLbsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLbs(val);
        if (val === '') {
            setKg('');
            return;
        }
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
            setKg(lbsToKg(numVal).toFixed(2).replace('.00', ''));
        }
    };

    const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setKg(val);
        if (val === '') {
            setLbs('');
            return;
        }
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
            setLbs(kgToLbs(numVal).toFixed(2).replace('.00', ''));
        }
    };

    return (
        <div className="space-y-4">
            <Input
                label="Pounds (lbs)"
                type="number"
                value={lbs}
                onChange={handleLbsChange}
                placeholder="Enter weight in pounds"
            />
            <Input
                label="Kilograms (kg)"
                type="number"
                value={kg}
                onChange={handleKgChange}
                placeholder="Enter weight in kilograms"
            />
        </div>
    );
};

export default WeightConverter;
