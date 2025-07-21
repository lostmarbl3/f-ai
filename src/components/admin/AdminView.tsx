import React, { useEffect, useState } from 'react';
import { ExerciseSet, LoggedWorkout } from '../../types';
import { formatDuration } from '../../utils/timeUtils';
import { Textarea } from '../ui/Textarea';

type Props = {
    workout: LoggedWorkout;
};

export const AdminView: React.FC<Props> = ({ workout }) => {
    const [notes, setNotes] = useState<string>('');
    const [timer, setTimer] = useState<number>(0);
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (active) {
            interval = setInterval(() => setTimer((t) => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [active]);

    const handleTimerToggle = () => {
        if (active) {
            setActive(false);
            setTimer(0);
        } else {
            setActive(true);
        }
    };

    return (
        <div className="p-4 bg-slate-800 text-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">{workout.exerciseName}</h2>
            <p className="mb-4">
                Target Sets: {workout.targetSets} | Target Reps: {workout.targetReps} | Rest: {workout.restSeconds}s
            </p>

            {workout.sets.map((set: ExerciseSet, i: number) => (
                <div key={i} className="mb-4 p-3 bg-slate-700 rounded">
                    <h4 className="font-semibold text-lg">Set {i + 1}</h4>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                        <input
                            className="p-2 rounded bg-slate-900 text-white"
                            type="number"
                            placeholder="Weight"
                            value={set.actualWeight}
                            onChange={(e) => set.actualWeight = parseFloat(e.target.value)}
                        />
                        <input
                            className="p-2 rounded bg-slate-900 text-white"
                            type="number"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => set.reps = parseInt(e.target.value)}
                        />
                        <input
                            className="p-2 rounded bg-slate-900 text-white"
                            type="number"
                            placeholder="1-10"
                            value={set.rpe}
                            onChange={(e) => set.rpe = parseInt(e.target.value)}
                        />
                        <button
                            className={`border-2 p-2 rounded ${active ? 'border-green-400' : 'border-white'}`}
                            onClick={handleTimerToggle}
                        >
                            {formatDuration(timer)}
                        </button>
                    </div>
                </div>
            ))}

            <div className="mt-4">
                <label className="block mb-1 text-lg">Notes (how did it feel?)</label>
                <Textarea
                    className="w-full p-3 rounded bg-slate-900 text-white"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Your notes..."
                />
            </div>
        </div>
    );
};
