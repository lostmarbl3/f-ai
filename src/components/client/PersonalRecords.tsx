import React, { useState, useEffect } from 'react';
import { LoggedWorkout, PersonalRecord, WeightUnit } from '../../types';
import { storageService } from '../../services/storageService';
import { kgToLbs } from '../../utils/conversions';
import Card from '../ui/Card';

interface PersonalRecordsProps {
    clientId: string;
    unit: WeightUnit;
}

// Epley formula for estimating 1-Rep Max
const epley1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps === 0 || weight === 0) return 0;
    return weight * (1 + reps / 30);
};

const PersonalRecords: React.FC<PersonalRecordsProps> = ({ clientId, unit }) => {
    const [prs, setPrs] = useState<PersonalRecord[]>([]);

    useEffect(() => {
        const allWorkouts = storageService.getLoggedWorkouts().filter(w => w.clientId === clientId);
        
        const allSets: { exerciseName: string, weight: number, reps: number, date: string, estimated1RM: number }[] = [];

        allWorkouts.forEach(workout => {
            workout.loggedExercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    if(set.completed && set.weight > 0 && set.reps > 0) {
                        allSets.push({
                            exerciseName: exercise.exerciseName,
                            weight: set.weight,
                            reps: set.reps,
                            date: workout.date,
                            estimated1RM: epley1RM(set.weight, set.reps),
                        });
                    }
                });
            });
        });

        const prsByExercise: { [key: string]: typeof allSets } = allSets.reduce((acc, set) => {
            if (!acc[set.exerciseName]) {
                acc[set.exerciseName] = [];
            }
            acc[set.exerciseName].push(set);
            return acc;
        }, {} as { [key: string]: typeof allSets });
        
        const finalPrs: PersonalRecord[] = Object.entries(prsByExercise).map(([exerciseName, sets]) => {
            const sortedRecords = sets.sort((a, b) => b.estimated1RM - a.estimated1RM);
            return {
                exerciseName,
                records: sortedRecords.slice(0, 3)
            };
        });

        setPrs(finalPrs.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)));

    }, [clientId]);

    if (prs.length === 0) {
        return (
            <Card>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Personal Records</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No personal records yet. Log some workouts to see your best lifts here!</p>
            </Card>
        );
    }
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Personal Records</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prs.map(pr => (
                    <Card key={pr.exerciseName}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{pr.exerciseName}</h3>
                        <div className="space-y-3">
                            {pr.records.map((record, index) => {
                                const displayWeight = unit === 'lbs' ? Math.round(kgToLbs(record.weight)) : record.weight;
                                const display1RM = unit === 'lbs' ? Math.round(kgToLbs(record.estimated1RM)) : Math.round(record.estimated1RM);

                                return (
                                <div key={index} className={`p-3 rounded-lg ${index === 0 ? 'bg-amber-100 dark:bg-amber-900/40 border-l-4 border-amber-400 dark:border-amber-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    <p className="font-semibold text-lg text-slate-800 dark:text-white">
                                        {displayWeight}{unit} x {record.reps} reps
                                        {index === 0 && <span className="ml-2 text-xs font-bold text-amber-800 dark:text-amber-300">ALL-TIME BEST</span>}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        on {new Date(record.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        (Est. 1-Rep Max: {display1RM}{unit})
                                    </p>
                                </div>
                            )})}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PersonalRecords;