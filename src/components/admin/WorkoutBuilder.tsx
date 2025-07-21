import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutProgram, Exercise } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import Switch from '../ui/Switch';

interface WorkoutBuilderProps {
    programs: WorkoutProgram[];
    onUpdate: () => void;
    isAiEnabled: boolean;
    programOwnerId: string;
    myProgramIds?: string[];
    onProgramCreated?: (newProgramId: string) => void;
    onDeleteProgram: (programId: string, fromView: 'client' | 'personal') => void;
}

const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const WandIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M15 4V2m0 14v-2m-7.5-1.5L6 13l-1.5 1.5M19.5 19.5L18 18l-1.5 1.5m-12-6.4L4.5 10.1M4 2v2m16 0v2m-3.9 11.5L15 14l1.5-1.5m-6.4 12l1.5-1.5L10.1 18M10 4V2m0 14v-2M4.5 4.5L6 6l1.5-1.5M18 6l1.5-1.5L21 6m-12 12l-1.5 1.5L6 21"></path></svg>);
const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const emptyExercise = (): Exercise => ({ id: uuidv4(), name: '', sets: 3, reps: '10', rest: '60s' });

const ExerciseEditor = ({ exercise, index, onExerciseChange, onRemoveExercise, isLast }: { exercise: Exercise, index: number, onExerciseChange: (index: number, field: keyof Exercise, value: any) => void, onRemoveExercise: (index: number) => void, isLast: boolean }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4 relative">
         <button onClick={() => onRemoveExercise(index)} className="absolute top-3 right-3 text-slate-400 hover:text-danger disabled:opacity-50" title="Remove Exercise" disabled={isLast}>
            <TrashIcon />
         </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Exercise Name" value={exercise.name} onChange={e => onExerciseChange(index, 'name', e.target.value)} placeholder="e.g., Barbell Squat" />
            <Input label="Video URL (Optional)" value={exercise.videoUrl || ''} onChange={e => onExerciseChange(index, 'videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Sets" type="number" value={exercise.sets} onChange={e => onExerciseChange(index, 'sets', e.target.value)} />
            <Input label="Reps" value={exercise.reps} onChange={e => onExerciseChange(index, 'reps', e.target.value)} placeholder="e.g., 8-12" />
            <Input label="Rest" value={exercise.rest} onChange={e => onExerciseChange(index, 'rest', e.target.value)} placeholder="e.g., 60s" />
            <Input label="Prescribed RPE" value={exercise.prescribedRpe || ''} onChange={e => onExerciseChange(index, 'prescribedRpe', e.target.value)} placeholder="e.g., 7-8" />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Prescribed Weight" value={exercise.prescribedWeight || ''} onChange={e => onExerciseChange(index, 'prescribedWeight', e.target.value)} placeholder="e.g., 135 lbs or 75%" />
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coaching Cues</label>
                <textarea rows={2} className="block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={exercise.cues || ''} onChange={e => onExerciseChange(index, 'cues', e.target.value)} placeholder="e.g., Keep chest up. Drive through heels." />
             </div>
        </div>
    </div>
);

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ programs, onUpdate, isAiEnabled, myProgramIds, onProgramCreated, programOwnerId, onDeleteProgram }) => {
    const [editingProgram, setEditingProgram] = useState<Partial<WorkoutProgram> | null>(null);
    const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
    const [geminiPrompt, setGeminiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [includeWarmup, setIncludeWarmup] = useState(false);
    const [includeCooldown, setIncludeCooldown] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importContent, setImportContent] = useState('');
    const [viewTab, setViewTab] = useState<'client' | 'personal'>('client');

    const startNewProgram = () => {
        setEditingProgram({
            id: uuidv4(), name: '', description: '',
            exercises: [emptyExercise()], warmup: [], cooldown: [],
            ownerId: programOwnerId,
            scope: viewTab, // Set the scope based on the current view
        });
        setIncludeWarmup(false);
        setIncludeCooldown(false);
    };
    
    const handleProgramChange = (field: keyof WorkoutProgram, value: any) => {
        if (editingProgram) setEditingProgram({ ...editingProgram, [field]: value });
    };

    const handleExerciseListChange = (listName: 'warmup' | 'exercises' | 'cooldown', index: number, field: keyof Exercise, value: any) => {
        if (!editingProgram) return;
        const list = editingProgram[listName] ? [...(editingProgram[listName]!)] : [];
        if(!list[index]) return;
        const exerciseToUpdate = { ...list[index], [field]: value };
        if(field === 'sets') exerciseToUpdate.sets = parseInt(value, 10) || 0;
        list[index] = exerciseToUpdate;
        setEditingProgram({ ...editingProgram, [listName]: list });
    };

    const addExerciseToList = (listName: 'warmup' | 'exercises' | 'cooldown') => {
        if (!editingProgram) return;
        const list = editingProgram[listName] ? [...(editingProgram[listName]!)] : [];
        const newList = [...list, emptyExercise()];
        setEditingProgram({ ...editingProgram, [listName]: newList });
    };

    const removeExerciseFromList = (listName: 'warmup' | 'exercises' | 'cooldown', index: number) => {
        if (!editingProgram) return;
        const list = editingProgram[listName] ? [...(editingProgram[listName]!)] : [];
        if (list.length <= 1 && listName === 'exercises') return;
        const newList = list.filter((_, i) => i !== index);
        setEditingProgram({ ...editingProgram, [listName]: newList });
    };

    const saveProgram = () => {
        if (editingProgram && editingProgram.name && editingProgram.id) {
            const finalProgram: WorkoutProgram = {
                id: editingProgram.id,
                name: editingProgram.name,
                description: editingProgram.description || '',
                exercises: editingProgram.exercises || [],
                warmup: includeWarmup ? (editingProgram.warmup || []) : [],
                cooldown: includeCooldown ? (editingProgram.cooldown || []) : [],
                programNotes: editingProgram.programNotes || '',
                ownerId: editingProgram.ownerId || programOwnerId,
                scope: editingProgram.scope || 'client',
            };
            
            const allPrograms = storageService.getPrograms();
            const existingIndex = allPrograms.findIndex(p => p.id === finalProgram.id);
            let isNewProgram = false;

            if (existingIndex > -1) {
                allPrograms[existingIndex] = finalProgram;
            } else {
                allPrograms.push(finalProgram);
                isNewProgram = true;
            }
            
            storageService.savePrograms(allPrograms);

            if (isNewProgram && finalProgram.scope === 'personal' && onProgramCreated) {
                onProgramCreated(finalProgram.id);
            }

            onUpdate();
            setEditingProgram(null);
        } else {
            alert('Program name is required.');
        }
    };
    
    const handleGenerateWithGemini = async () => {
        if (!geminiPrompt || isGenerating || isThrottled) return;
        setIsGenerating(true);
        const result = await geminiService.generateWorkout(geminiPrompt);
        setIsGenerating(false);

        if (result) {
            // This now correctly sets the editor state *after* getting a result
            setEditingProgram({
                id: uuidv4(),
                ownerId: programOwnerId,
                scope: viewTab,
                name: result.name || '',
                description: result.description || '',
                exercises: result.exercises?.map(e => ({ ...e, id: uuidv4() })) || [emptyExercise()],
                warmup: result.warmup?.map(e => ({ ...e, id: uuidv4() })) || [],
                cooldown: result.cooldown?.map(e => ({ ...e, id: uuidv4() })) || [],
                programNotes: result.programNotes || '',
            });
            setIncludeWarmup(!!result.warmup && result.warmup.length > 0);
            setIncludeCooldown(!!result.cooldown && result.cooldown.length > 0);
            setIsGeminiModalOpen(false);
            setGeminiPrompt('');
        } else {
            alert("Could not generate a workout with AI at this time. Please try again later.");
        }
        
        setIsThrottled(true); setTimeout(() => setIsThrottled(false), 5000);
    };

    const handleImportWorkout = async () => {
        if (!importContent || isGenerating || isThrottled) return;
        setIsGenerating(true);
        const result = await geminiService.generateWorkoutFromContent(importContent);
        setIsGenerating(false);

        if (result) {
            setEditingProgram({
                id: uuidv4(),
                ownerId: programOwnerId,
                scope: viewTab, // Ensure scope is set from the current view
                name: result.name || 'Imported Workout',
                description: result.description || '',
                exercises: result.exercises?.map(e => ({ ...e, id: uuidv4() })) || [emptyExercise()],
                warmup: result.warmup?.map(e => ({ ...e, id: uuidv4() })) || [],
                cooldown: result.cooldown?.map(e => ({ ...e, id: uuidv4() })) || [],
                programNotes: result.programNotes || '',
            });
            setIncludeWarmup(!!result.warmup && result.warmup.length > 0);
            setIncludeCooldown(!!result.cooldown && result.cooldown.length > 0);
            setIsImportModalOpen(false);
            setImportContent('');
        } else {
            alert("Could not import and parse the workout with AI. Please check the content and try again.");
        }
        
        setIsThrottled(true); setTimeout(() => setIsThrottled(false), 5000);
    };

    const openImportModal = () => { setImportContent(''); setIsImportModalOpen(true); }
    
    const setProgramForEditing = (program: WorkoutProgram) => {
        setEditingProgram(program);
        setIncludeWarmup(!!program.warmup && program.warmup.length > 0);
        setIncludeCooldown(!!program.cooldown && program.cooldown.length > 0);
    }
    
    const clientPrograms = programs.filter(p => p.scope !== 'personal');
    const myPrograms = programs.filter(p => p.scope === 'personal');
    const programsToShow = viewTab === 'personal' ? myPrograms : clientPrograms;

    if (editingProgram) {
        return (
            <Card>
                <div className="flex justify-between items-start"><h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{programs.some(p => p.id === editingProgram.id) ? 'Edit Program' : 'Create New Program'}</h2><Button variant="secondary" onClick={() => setEditingProgram(null)}>Cancel</Button></div>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Build a workout by adding exercises, warm-ups, and cool-downs.</p>
                <div className="space-y-6">
                    <Input label="Program Name" value={editingProgram.name || ''} onChange={e => handleProgramChange('name', e.target.value)} placeholder="e.g., Ultimate Leg Day" />
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label><textarea rows={2} className="block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={editingProgram.description || ''} onChange={e => handleProgramChange('description', e.target.value)} placeholder="A brief summary of this program's focus." /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">General Notes for Client</label><textarea rows={3} className="block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={editingProgram.programNotes || ''} onChange={e => handleProgramChange('programNotes', e.target.value)} placeholder="e.g., Focus on form this week! Don't be afraid to lower the weight to get it right." /></div>
                    
                    <div className="space-y-2 pt-4 border-t dark:border-slate-700"><Switch checked={includeWarmup} onChange={(c) => { setIncludeWarmup(c); if(c && (!editingProgram.warmup || editingProgram.warmup.length === 0)) { addExerciseToList('warmup'); }}} label="Include Warm-up Section" /></div>
                    {includeWarmup && (
                        <div className="pl-4 border-l-4 border-primary-light space-y-4">
                             {(editingProgram.warmup || []).map((ex, i) => <ExerciseEditor key={ex.id} exercise={ex} index={i} onExerciseChange={(idx, f, v) => handleExerciseListChange('warmup', idx, f, v)} onRemoveExercise={() => removeExerciseFromList('warmup', i)} isLast={false} />)}
                            <Button variant="secondary" size="sm" onClick={() => addExerciseToList('warmup')}>Add Warm-up Exercise</Button>
                        </div>
                    )}

                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 pt-4 border-t dark:border-slate-700">Main Exercises</h3>
                    <div className="space-y-4">{(editingProgram.exercises || []).map((ex, i) => <ExerciseEditor key={ex.id} exercise={ex} index={i} onExerciseChange={(idx, f, v) => handleExerciseListChange('exercises', idx, f, v)} onRemoveExercise={() => removeExerciseFromList('exercises', i)} isLast={(editingProgram.exercises || []).length === 1} />)}</div>
                    <Button variant="secondary" onClick={() => addExerciseToList('exercises')}>Add Main Exercise</Button>

                    <div className="space-y-2 pt-4 border-t dark:border-slate-700"><Switch checked={includeCooldown} onChange={(c) => { setIncludeCooldown(c); if(c && (!editingProgram.cooldown || editingProgram.cooldown.length === 0)) { addExerciseToList('cooldown'); }}} label="Include Cool-down Section" /></div>
                    {includeCooldown && (
                        <div className="pl-4 border-l-4 border-success space-y-4">
                             {(editingProgram.cooldown || []).map((ex, i) => <ExerciseEditor key={ex.id} exercise={ex} index={i} onExerciseChange={(idx, f, v) => handleExerciseListChange('cooldown', idx, f, v)} onRemoveExercise={() => removeExerciseFromList('cooldown', i)} isLast={false} />)}
                            <Button variant="secondary" size="sm" onClick={() => addExerciseToList('cooldown')}>Add Cool-down Exercise</Button>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-6 border-t dark:border-slate-700"><Button onClick={saveProgram}>Save Program</Button></div>
                </div>
            </Card>
        );
    }

    return (
        <div>
             <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Workout Programs</h2>
                    <div className="flex space-x-2">
                        <Button onClick={openImportModal} variant="secondary" disabled={!isAiEnabled} title={!isAiEnabled ? "AI features are currently unavailable." : "Import workout from text or URL"}><ImportIcon/>Import</Button>
                        <Button onClick={() => setIsGeminiModalOpen(true)} disabled={!isAiEnabled} title={!isAiEnabled ? "AI features are currently unavailable." : "Create a workout with AI"}><WandIcon/>Create with AI</Button>
                        <Button onClick={startNewProgram}>Create New Program</Button>
                    </div>
                </div>
                {myProgramIds && (
                    <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setViewTab('client')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewTab === 'client' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}>
                                Client Programs ({clientPrograms.length})
                            </button>
                            <button onClick={() => setViewTab('personal')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewTab === 'personal' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}>
                                My Programs ({myPrograms.length})
                            </button>
                        </nav>
                    </div>
                )}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {programsToShow.map(program => (<div key={program.id} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><div><p className="font-semibold text-slate-900 dark:text-white">{program.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{program.exercises.length} exercises</p></div><div className="space-x-2"><Button size="sm" variant="secondary" onClick={() => setProgramForEditing(program)}>Edit</Button><Button size="sm" variant="danger" onClick={() => onDeleteProgram(program.id, viewTab)}>Delete</Button></div></div>))}
                    {programsToShow.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-center py-4">No workout programs found in this view.</p>}
                </div>
            </Card>

            <Modal title="Create Workout with AI" isOpen={isGeminiModalOpen} onClose={() => setIsGeminiModalOpen(false)}>
                <p className="mb-4 text-slate-600 dark:text-slate-300">Describe the workout you want to create. Be as specific as you like!</p>
                <textarea rows={3} className="block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={geminiPrompt} onChange={e => setGeminiPrompt(e.target.value)} placeholder="e.g., A 45-minute beginner workout for chest and triceps, including a warm-up and cool-down." />
                 <div className="mt-6 flex justify-end"><Button onClick={handleGenerateWithGemini} disabled={isGenerating || isThrottled}>{isGenerating ? <Spinner/> : (isThrottled ? 'Please wait...' : 'Generate')}</Button></div>
            </Modal>
            
            <Modal title="Import Workout from Web/Text" isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
                <p className="mb-4 text-slate-600 dark:text-slate-300">Paste a URL or the full text of a workout below. The AI will attempt to parse it into a structured program.</p>
                <textarea rows={8} className="block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={importContent} onChange={e => setImportContent(e.target.value)} placeholder="e.g., https://www.muscleandstrength.com/workouts/4-day-power-muscle-burn-workout&#10;OR&#10;Squats 3x5, Bench Press 3x5, ..." />
                 <div className="mt-6 flex justify-end"><Button onClick={handleImportWorkout} disabled={isGenerating || isThrottled}>{isGenerating ? <Spinner/> : (isThrottled ? 'Please wait...' : 'Generate Program')}</Button></div>
            </Modal>
        </div>
    );
};

export default WorkoutBuilder;
