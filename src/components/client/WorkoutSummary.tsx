
import React, { useState } from 'react';
import { LoggedWorkout, WeightUnit } from '../../types';
import { storageService } from '../../services/storageService';
import { kgToLbs } from '../../utils/conversions';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface WorkoutSummaryProps {
    workoutLog: LoggedWorkout;
    onClose: () => void;
    unit: WeightUnit;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ workoutLog, onClose, unit }) => {
    const [feeling, setFeeling] = useState(workoutLog.feeling || 'none');

    const handleSetFeeling = (newFeeling: 'difficult' | 'okay' | 'great') => {
        setFeeling(newFeeling);
        const allLogs = storageService.getLoggedWorkouts();
        const updatedLogs = allLogs.map(log => 
            log.id === workoutLog.id ? { ...log, feeling: newFeeling } : log
        );
        storageService.saveLoggedWorkouts(updatedLogs);
    };

    const totalVolume = workoutLog.totalVolume || 0;
    const displayVolume = unit === 'lbs' ? Math.round(kgToLbs(totalVolume)) : Math.round(totalVolume);

    const durationMinutes = Math.floor((workoutLog.durationSeconds || 0) / 60);
    const durationSecondsValue = (workoutLog.durationSeconds || 0) % 60;

    const summaryStats = [
        { label: 'Total Volume', value: `${displayVolume.toLocaleString()} ${unit}` },
        { label: 'Duration', value: `${durationMinutes}m ${durationSecondsValue}s` },
        { label: 'New PRs', value: workoutLog.prsAchieved?.length || 0 },
    ];
    
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full text-center">
                <h1 className="text-4xl font-bold text-success mb-2">Workout Complete!</h1>
                <p className="text-lg text-slate-600 mb-6">Great job finishing your <span className="font-semibold">{workoutLog.programName}</span> workout.</p>
                
                <div className="grid grid-cols-3 gap-4 my-8">
                    {summaryStats.map(stat => (
                        <div key={stat.label} className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="my-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">How did this workout feel?</h3>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => handleSetFeeling('difficult')} className={`p-4 rounded-full transition-transform transform hover:scale-110 ${feeling === 'difficult' ? 'bg-danger-100 ring-2 ring-danger' : 'bg-slate-200'}`}>
                            <span className="text-4xl" role="img" aria-label="Difficult">😫</span>
                        </button>
                        <button onClick={() => handleSetFeeling('okay')} className={`p-4 rounded-full transition-transform transform hover:scale-110 ${feeling === 'okay' ? 'bg-accent/20 ring-2 ring-accent' : 'bg-slate-200'}`}>
                            <span className="text-4xl" role="img" aria-label="Okay">😐</span>
                        </button>
                        <button onClick={() => handleSetFeeling('great')} className={`p-4 rounded-full transition-transform transform hover:scale-110 ${feeling === 'great' ? 'bg-success-100 ring-2 ring-success' : 'bg-slate-200'}`}>
                             <span className="text-4xl" role="img" aria-label="Great">💪</span>
                        </button>
                    </div>
                </div>

                <Button onClick={onClose} size="lg">Back to Dashboard</Button>
            </Card>
        </div>
    );
};

export default WorkoutSummary;