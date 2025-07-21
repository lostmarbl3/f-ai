import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutProgram, LoggedExercise, LoggedSet, Client, WeightUnit, LoggedWorkout, Exercise, LoggedCardio, DistanceUnit, CardioExercise, InProgressWorkout } from '../../types';
import { storageService } from '../../services/storageService';
import { kgToLbs, lbsToKg } from '../../utils/conversions';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Select from '../ui/Select';

interface WorkoutLoggerProps {
    program: WorkoutProgram;
    client: Client;
    onFinish: (loggedWorkout?: LoggedWorkout) => void;
    initialData?: InProgressWorkout | null;
    unit: WeightUnit;
}

type TimerID = { section: 'warmup' | 'main' | 'cooldown', index: number, setIndex: number };
type ActiveTimer = TimerID & { seconds: number };

const YoutubeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-1 text-danger"><path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 4.24 4.24 2.5 7 2.5h10c2.76 0 4.5 1.74 4.5 4.5v10c0 2.76-1.74 4.5-4.5 4.5H7c-2.76 0-4.5-1.74-4.5-4.5Z"></path><path d="m10 15 5-3-5-3z"></path></svg>);
const CheckCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const InfoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);

const CardioLogger = ({ cardioExercises, loggedCardio, onCardioChange }: {
    cardioExercises: CardioExercise[];
    loggedCardio: LoggedCardio[];
    onCardioChange: (index: number, field: keyof LoggedCardio, value: any) => void;
}) => (
    <div className="space-y-6">
        {cardioExercises.map((cardio, index) => {
            const loggedItem = loggedCardio.find(lc => lc.cardioId === cardio.id);
            if (!loggedItem) return null;
            return (
                <Card key={cardio.id}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cardio.activity}</h3>
                    <p className="text-slate-500 dark:text-slate-400">Target: {cardio.goalValue} {cardio.goalType === 'time' ? 'minutes' : cardio.distanceUnit || 'km'} at {cardio.intensity} intensity</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {cardio.goalType === 'time' ? (
                            <div className="flex items-end gap-2">
                                <Input label="Distance Covered" type="number" placeholder="e.g., 3.2" value={loggedItem.actualDistance || ''} onChange={(e) => onCardioChange(index, 'actualDistance', e.target.value)} />
                                <Select value={loggedItem.distanceUnit || 'mi'} onChange={(e) => onCardioChange(index, 'distanceUnit', e.target.value as DistanceUnit)}>
                                    <option value="mi">mi</option><option value="km">km</option><option value="m">m</option><option value="yd">yd</option>
                                </Select>
                            </div>
                        ) : (
                            <Input label="Time Taken (minutes)" type="number" placeholder="e.g., 25.5" value={loggedItem.actualTime || ''} onChange={(e) => onCardioChange(index, 'actualTime', e.target.value)} />
                        )}
                    </div>
                </Card>
            )
        })}
    </div>
);

const ExerciseSection = ({ sectionTitle, sectionKey, sectionExercises, loggedExercises, onSetChange, onNoteChange, toggleSetComplete, startRestTimer, activeTimer, unit }: {
    sectionTitle: string;
    sectionKey: 'warmup' | 'main' | 'cooldown';
    sectionExercises: Exercise[];
    loggedExercises: LoggedExercise[];
    onSetChange: (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rpe', value: string) => void;
    onNoteChange: (exIndex: number, value: string) => void;
    toggleSetComplete: (exIndex: number, setIndex: number) => void;
    startRestTimer: (exIndex: number, setIndex: number) => void;
    activeTimer: ActiveTimer | null;
    unit: WeightUnit;
}) => (
    <div className="space-y-6">
        {sectionExercises.map((exercise, exIndex) => {
            const loggedExercise = loggedExercises.find(le => le.exerciseId === exercise.id);
            if (!loggedExercise) return null;

            return (
                 <Card key={exercise.id}>
                    <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-2">
                         <div className="flex-1 min-w-0">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white break-words">{exercise.name}</h3>
                             <p className="text-slate-500 dark:text-slate-400">Target Sets: {exercise.sets} | Target Reps: {exercise.reps} | Rest: {exercise.rest}</p>
                         </div>
                        {exercise.videoUrl && (<a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark"><YoutubeIcon /><span>Watch Demo</span></a>)}
                    </div>
                     {(exercise.prescribedWeight || exercise.prescribedRpe) && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Target Weight: <span className="font-semibold text-slate-700 dark:text-slate-300">{exercise.prescribedWeight || 'N/A'}</span> | Target RPE: <span className="font-semibold text-slate-700 dark:text-slate-300">{exercise.prescribedRpe || 'N/A'}</span>
                        </p>
                    )}
                    {exercise.cues && (<div className="mt-3 text-sm text-primary-dark dark:text-primary-light bg-primary-100 dark:bg-primary/20 p-3 rounded-lg flex"><InfoIcon /><div><p className="font-semibold">Coach's Cues:</p><p className="whitespace-pre-wrap">{exercise.cues}</p></div></div>)}
                    <div className="mt-4 space-y-3">
                        {loggedExercise.sets.map((set, setIndex) => {
                            const isTimerActive = activeTimer?.index === exIndex && activeTimer?.setIndex === setIndex && activeTimer?.section === sectionKey;
                            const displayWeight = set.weight > 0 ? (unit === 'lbs' ? kgToLbs(set.weight).toFixed(1) : set.weight.toFixed(1)) : '';
                            return (
                            <div key={setIndex} className={`flex items-center space-x-2 sm:space-x-4 p-3 rounded-lg ${set.completed ? 'bg-success-50 dark:bg-success/20' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                                <div className="font-bold text-slate-600 dark:text-slate-300 w-10">Set {setIndex + 1}</div>
                                <div className="flex-1"><Input type="number" label={`Actual Weight (${unit})`} value={displayWeight.replace('.0','')} onChange={e => onSetChange(exIndex, setIndex, 'weight', e.target.value)} step="0.1" /></div>
                                <div className="flex-1"><Input type="number" label="Reps" value={set.reps > 0 ? set.reps : ''} onChange={e => onSetChange(exIndex, setIndex, 'reps', e.target.value)} /></div>
                                <div className="flex-1"><Input type="number" label="RPE" value={set.rpe || ''} onChange={e => onSetChange(exIndex, setIndex, 'rpe', e.target.value)} min="1" max="10" step="0.5" placeholder="1-10"/></div>
                                <button onClick={() => toggleSetComplete(exIndex, setIndex)} className="p-2">{set.completed ? <CheckCircleIcon/> : <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>}</button>
                                {isTimerActive ? (<div className="font-mono text-lg text-primary font-bold w-20 text-center">{`${Math.floor(activeTimer.seconds / 60)}`.padStart(2, '0')}:{`${activeTimer.seconds % 60}`.padStart(2, '0')}</div>) : (<div className="w-20 text-center">{set.completed && <Button size="sm" variant="ghost" onClick={() => startRestTimer(exIndex, setIndex)}>Rest</Button>}</div>)}
                            </div>
                        )})}
                    </div>
                     <div className="mt-4"><label htmlFor={`notes-${exercise.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (how did it feel?)</label><textarea id={`notes-${exercise.id}`} rows={2} className="block w-full mt-1 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 bg-white dark:bg-slate-700" placeholder="e.g., Felt strong, a little pinch in my right shoulder, etc." value={loggedExercise.notes || ''} onChange={(e) => onNoteChange(exIndex, e.target.value)} /></div>
                </Card>
            )
        })}
    </div>
);

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ program, client, onFinish, initialData, unit }) => {
    const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
    const [loggedCardio, setLoggedCardio] = useState<LoggedCardio[]>([]);
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [startTime] = useState(Date.now());
    const timerRef = useRef<number | null>(null);

    const allWarmupEx = program.warmup || [];
    const allMainEx = program.exercises || [];
    const allCooldownEx = program.cooldown || [];
    const allExercises = { warmup: allWarmupEx, main: allMainEx, cooldown: allCooldownEx };

    useEffect(() => {
        setLoggedExercises(initialData?.loggedExercises || [...allWarmupEx, ...allMainEx, ...allCooldownEx].map(exercise => ({
            exerciseId: exercise.id, exerciseName: exercise.name, notes: '',
            sets: Array.from({ length: exercise.sets }, (_, i) => ({ setNumber: i + 1, weight: 0, reps: 0, rpe: 0, completed: false })),
        })));
        setLoggedCardio(initialData?.loggedCardio || (program.cardio || []).map(c => ({
            cardioId: c.id, activity: c.activity, goalType: c.goalType, goalValue: c.goalValue, distanceUnit: c.distanceUnit || 'mi'
        })));
    }, [program, initialData]);

    useEffect(() => {
        if (loggedExercises.length > 0 || (loggedCardio && loggedCardio.length > 0)) {
            storageService.saveInProgressWorkout(client.id, program.id, { loggedExercises, loggedCardio });
        }
    }, [loggedExercises, loggedCardio, client.id, program.id]);

    useEffect(() => {
        if (activeTimer && activeTimer.seconds > 0) {
            timerRef.current = window.setTimeout(() => { setActiveTimer(t => t ? { ...t, seconds: t.seconds - 1 } : null); }, 1000);
        } else if (activeTimer && activeTimer.seconds === 0) {
            const exerciseList = allExercises[activeTimer.section];
            const activeExercise = exerciseList ? exerciseList[activeTimer.index] : null;
            if (activeExercise) { 
                // Simple alert for now. Could be a toast notification.
                // alert(`Rest time is up for ${activeExercise.name}!`); 
            }
            setActiveTimer(null);
        }
        return () => { if (timerRef.current) { clearTimeout(timerRef.current); } };
    }, [activeTimer, allExercises]);
    
    const handleSetChange = (section: 'warmup' | 'main' | 'cooldown', exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
        const newLogs = [...loggedExercises];
        const exerciseId = allExercises[section][exIndex].id;
        const logIndex = newLogs.findIndex(le => le.exerciseId === exerciseId);
        if (logIndex === -1) return;
        
        const numValue = parseFloat(value) || 0;
        
        if (field === 'weight') { newLogs[logIndex].sets[setIndex].weight = unit === 'lbs' ? lbsToKg(numValue) : numValue;
        } else if (field === 'reps') { newLogs[logIndex].sets[setIndex].reps = Math.round(numValue);
        } else if (field === 'rpe') { newLogs[logIndex].sets[setIndex].rpe = numValue; }
        setLoggedExercises(newLogs);
    };

    const handleNoteChange = (section: 'warmup' | 'main' | 'cooldown', exIndex: number, value: string) => {
        const newLogs = [...loggedExercises];
        const exerciseId = allExercises[section][exIndex].id;
        const logIndex = newLogs.findIndex(le => le.exerciseId === exerciseId);
        if (logIndex === -1) return;
        newLogs[logIndex].notes = value; setLoggedExercises(newLogs);
    };

    const handleCardioChange = (cardioIndex: number, field: keyof LoggedCardio, value: any) => {
        const newLogs = [...loggedCardio];
        const logIndex = newLogs.findIndex(lc => lc.cardioId === program.cardio![cardioIndex].id);
        if (logIndex === -1) return;
        (newLogs[logIndex] as any)[field] = (field === 'actualDistance' || field === 'actualTime') ? parseFloat(value) || 0 : value;
        setLoggedCardio(newLogs);
    };

    const startRestTimer = (section: 'warmup' | 'main' | 'cooldown', exIndex: number, setIndex: number) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const restSeconds = parseInt(allExercises[section][exIndex].rest, 10) || 60;
        setActiveTimer({ section, index: exIndex, setIndex, seconds: restSeconds });
    };

    const toggleSetComplete = (section: 'warmup' | 'main' | 'cooldown', exIndex: number, setIndex: number) => {
        const newLogs = [...loggedExercises];
        const exerciseId = allExercises[section][exIndex].id;
        const logIndex = newLogs.findIndex(le => le.exerciseId === exerciseId);
        if (logIndex === -1) return;
        const currentSet = newLogs[logIndex].sets[setIndex];
        currentSet.completed = !currentSet.completed;
        if (currentSet.completed) {
            startRestTimer(section, exIndex, setIndex);
        }
        setLoggedExercises(newLogs);
    };
    
    const handleFinishWorkout = () => {
        if(window.confirm("Are you sure you want to finish this workout?")){
            const durationSeconds = Math.round((Date.now() - startTime) / 1000);
            const totalVolume = loggedExercises.reduce((total, ex) => total + ex.sets.reduce((vol, set) => vol + (set.weight * set.reps), 0), 0);
            const newLoggedWorkout: LoggedWorkout = {
                id: uuidv4(), programId: program.id, programName: program.name, clientId: client.id,
                date: new Date().toISOString(), loggedExercises: loggedExercises, loggedCardio,
                durationSeconds, totalVolume, feeling: 'none', prsAchieved: [],
            };
            storageService.addLoggedWorkout(newLoggedWorkout);
            storageService.clearInProgressWorkout(client.id, program.id);
            onFinish(newLoggedWorkout);
        }
    };

    const renderSection = (title: string, sectionKey: 'warmup' | 'main' | 'cooldown', sectionClass: string) => {
        const exercises = allExercises[sectionKey];
        if (!exercises || exercises.length === 0) return null;
        return (
            <div className={`mb-8 p-4 rounded-xl ${sectionClass}`}>
                <h2 className={`text-2xl font-bold mb-4 ${title === 'Warm-up' ? 'text-primary-dark dark:text-primary-light' : title === 'Cooldown' ? 'text-success dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{title}</h2>
                <ExerciseSection
                    sectionTitle={title}
                    sectionKey={sectionKey}
                    sectionExercises={exercises}
                    loggedExercises={loggedExercises}
                    onSetChange={(exIdx, setIdx, f, v) => handleSetChange(sectionKey, exIdx, setIdx, f, v)}
                    onNoteChange={(exIdx, v) => handleNoteChange(sectionKey, exIdx, v)}
                    toggleSetComplete={(exIdx, setIdx) => toggleSetComplete(sectionKey, exIdx, setIdx)}
                    startRestTimer={(exIdx, setIdx) => startRestTimer(sectionKey, exIdx, setIdx)}
                    activeTimer={activeTimer}
                    unit={unit}
                />
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">{program.name}</h1><Button variant="secondary" onClick={() => onFinish()}>Back to Dashboard</Button></div>
            {program.programNotes && (<div className="mb-6 p-4 bg-warning-100 dark:bg-amber-900/40 border-l-4 border-accent text-accent-dark dark:text-amber-300 rounded-r-lg"><p className="font-bold">A Note from Your Coach:</p><p className="whitespace-pre-wrap">{program.programNotes}</p></div>)}
            
            {renderSection('Warm-up', 'warmup', 'bg-primary-50 dark:bg-primary/10')}
            {renderSection('Main Workout', 'main', '')}

            {program.cardio && program.cardio.length > 0 && (
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Cardio</h2>
                    <CardioLogger cardioExercises={program.cardio} loggedCardio={loggedCardio} onCardioChange={handleCardioChange} />
                </div>
            )}
            
            {renderSection('Cooldown', 'cooldown', 'bg-success-50 dark:bg-success/10')}
            
            <div className="mt-8 flex justify-center"><Button size="lg" onClick={handleFinishWorkout}>Finish Workout</Button></div>
        </div>
    );
};

export default WorkoutLogger;