
import { DistanceUnit } from '../types';

export const KG_TO_LBS = 2.20462;

export const lbsToKg = (lbs: number): number => {
    if (!lbs || isNaN(lbs)) return 0;
    return lbs / KG_TO_LBS;
};

export const kgToLbs = (kg: number): number => {
    if (!kg || isNaN(kg)) return 0;
    return kg * KG_TO_LBS;
};


const METERS_IN: { [key in DistanceUnit]: number } = {
    km: 1000,
    mi: 1609.34,
    m: 1,
    yd: 0.9144,
};

// Converts any distance unit to meters
const toMeters = (value: number, fromUnit: DistanceUnit): number => {
    return value * METERS_IN[fromUnit];
};

// Converts meters to any other distance unit
const fromMeters = (valueInMeters: number, toUnit: DistanceUnit): number => {
    return valueInMeters / METERS_IN[toUnit];
};

export const convertDistance = (value: number, fromUnit: DistanceUnit, toUnit: DistanceUnit): number => {
    if (fromUnit === toUnit) return value;
    const valueInMeters = toMeters(value, fromUnit);
    return fromMeters(valueInMeters, toUnit);
};
