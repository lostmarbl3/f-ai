
import React, { useState, useEffect } from 'react';
import { DistanceUnit } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import {
    parseTimeToSeconds,
    formatSecondsToTime,
    calculateDistance,
    calculatePace,
    calculateTime,
} from '../../utils/paceCalculations';
import { convertDistance } from '../../utils/conversions';

const PaceCalculator: React.FC = () => {
    const [distance, setDistance] = useState('');
    const [time, setTime] = useState(''); // in HH:MM:SS format
    const [pace, setPace] = useState(''); // in HH:MM:SS format
    const [unit, setUnit] = useState<DistanceUnit>('mi');
    const [lastChanged, setLastChanged] = useState<'distance' | 'time' | 'pace' | null>(null);

    useEffect(() => {
        if (lastChanged === null) return;

        const distNum = parseFloat(distance);
        const timeSec = parseTimeToSeconds(time);
        const paceSec = parseTimeToSeconds(pace);

        if (lastChanged !== 'pace' && distNum > 0 && timeSec > 0) {
            const calculatedPace = calculatePace(distNum, timeSec, unit);
            setPace(formatSecondsToTime(calculatedPace));
        } else if (lastChanged !== 'distance' && timeSec > 0 && paceSec > 0) {
            const calculatedDistance = calculateDistance(timeSec, paceSec);
            setDistance(calculatedDistance.toFixed(2).replace('.00', ''));
        } else if (lastChanged !== 'time' && distNum > 0 && paceSec > 0) {
            const calculatedTime = calculateTime(distNum, paceSec);
            setTime(formatSecondsToTime(calculatedTime));
        }

    }, [distance, time, pace, unit, lastChanged]);

    const handleUnitChange = (newUnit: DistanceUnit) => {
        const distNum = parseFloat(distance);
        if (distNum > 0 && lastChanged !== 'distance') {
            const newDist = convertDistance(distNum, unit, newUnit);
            setDistance(newDist.toFixed(2).replace('.00', ''));
        }
        setUnit(newUnit);
        // Recalculate pace based on new unit
        const timeSec = parseTimeToSeconds(time);
        const distToUse = parseFloat(distance) || 0;
        if(distToUse > 0 && timeSec > 0) {
             const newPace = calculatePace(convertDistance(distToUse, unit, newUnit), timeSec, newUnit);
             setPace(formatSecondsToTime(newPace));
        }
    }

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                    <Input
                        label="Distance"
                        type="number"
                        value={distance}
                        onChange={e => { setDistance(e.target.value); setLastChanged('distance'); }}
                        placeholder="e.g., 3.1"
                    />
                </div>
                <div className="col-span-2">
                    <Select label="Unit" value={unit} onChange={e => handleUnitChange(e.target.value as DistanceUnit)}>
                        <option value="mi">miles</option>
                        <option value="km">km</option>
                        <option value="m">meters</option>
                        <option value="yd">yards</option>
                    </Select>
                </div>
             </div>
             <Input
                label="Time"
                type="text"
                value={time}
                onChange={e => { setTime(e.target.value); setLastChanged('time'); }}
                placeholder="HH:MM:SS or MM:SS"
            />
            <Input
                label={`Pace per ${unit}`}
                type="text"
                value={pace}
                onChange={e => { setPace(e.target.value); setLastChanged('pace'); }}
                placeholder="HH:MM:SS or MM:SS"
            />
        </div>
    );
};

export default PaceCalculator;