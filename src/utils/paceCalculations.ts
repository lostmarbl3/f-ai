
import { convertDistance } from './conversions';
import { DistanceUnit } from '../types';

// Parses a time string (e.g., "01:30:15" or "45:20") into total seconds
export const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) { // HH:MM:SS
        seconds += parts[0] * 3600;
        seconds += parts[1] * 60;
        seconds += parts[2];
    } else if (parts.length === 2) { // MM:SS
        seconds += parts[0] * 60;
        seconds += parts[1];
    } else if (parts.length === 1) { // SS
        seconds += parts[0];
    }
    return seconds;
};

// Formats total seconds into a readable time string (HH:MM:SS)
export const formatSecondsToTime = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds <= 0) return '';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    
    // Don't show hours if it's 00
    if (parts.length === 3 && parts[0] === '00') {
        parts.shift();
    }

    return parts.join(':');
};

// Calculates pace in seconds per the given distance unit
export const calculatePace = (distance: number, timeInSeconds: number, unit: DistanceUnit): number => {
    if (distance <= 0 || timeInSeconds <= 0) return 0;
    return timeInSeconds / distance;
};

// Calculates distance
export const calculateDistance = (timeInSeconds: number, paceInSeconds: number): number => {
    if (timeInSeconds <= 0 || paceInSeconds <= 0) return 0;
    return timeInSeconds / paceInSeconds;
};

// Calculates time in seconds
export const calculateTime = (distance: number, paceInSeconds: number): number => {
    if (distance <= 0 || paceInSeconds <= 0) return 0;
    return distance * paceInSeconds;
};