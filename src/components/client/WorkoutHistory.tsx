import React, { useState, useEffect } from 'react';
import { LoggedWorkout, WeightUnit } from '../../types';
import { storageService } from '../../services/storageService';
import { kgToLbs } from '../../utils/conversions';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface WorkoutHistoryProps {
    clientId: string;
    unit: WeightUnit;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ clientId, unit }) => {
    const [history, setHistory] = useState<LoggedWorkout[]>([]);
    const [viewingWorkoutLog, setViewingWorkoutLog] = useState<LoggedWorkout | null>(null);

    useEffect(() => {
        const allWorkouts = storageService.getLoggedWorkouts();
        const clientHistory = allWorkouts
            .filter(w => w.clientId === clientId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(clientHistory);
    }, [clientId]);

    return (
        <Card>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Workout History</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {history.length > 0 ? history.map(log => (
                    <div key={log.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">{log.programName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setViewingWorkoutLog(log)}>View Details</Button>
                    </div>
                )) : (
                    <p className="text-slate-500 dark:text-slate-400">No workouts logged yet. Go complete a session!</p>
                )}
            </div>

            <Modal isOpen={!!viewingWorkoutLog} onClose={() => setViewingWorkoutLog(null)} title={`Workout Details - ${viewingWorkoutLog ? new Date(viewingWorkoutLog.date).toLocaleDateString() : ''}`}>
                {viewingWorkoutLog ? (
                     <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {viewingWorkoutLog.loggedExercises.map(ex => (
                            <div key={ex.exerciseId} className="py-3 border-b dark:border-slate-700 last:border-b-0">
                                <h4 className="font-semibold text-slate-800 dark:text-white">{ex.exerciseName}</h4>
                                <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc">
                                    {ex.sets.map((set, index) => {
                                        const displayWeight = unit === 'lbs' ? Math.round(kgToLbs(set.weight)) : set.weight;
                                        return (
                                            <li key={index}>Set {set.setNumber}: {displayWeight}{unit} x {set.reps} reps</li>
                                        )
                                    })}
                                </ul>
                                {ex.notes && (
                                    <div className="mt-3 text-sm text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 border-l-4 border-blue-500 p-3 rounded-r-lg">
                                        <p className="font-bold">Your Note:</p>
                                        <p className="whitespace-pre-wrap">{ex.notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : <p>No workout data to display.</p>}
                 <div className="mt-6 flex justify-end">
                    <Button variant="secondary" onClick={() => setViewingWorkoutLog(null)}>Close</Button>
                </div>
            </Modal>
        </Card>
    );
};

export default WorkoutHistory;