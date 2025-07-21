import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutProgram, LoggedWorkout, AIAssistSuggestion } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface AICoachProps {
    isPro: boolean;
    isAiEnabled: boolean;
    programs: WorkoutProgram[];
    loggedWorkouts: LoggedWorkout[];
    onUpdate: () => void;
    onPromptUpgrade: () => void;
}

const WandIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M15 4V2m0 14v-2m-7.5-1.5L6 13l-1.5 1.5M19.5 19.5L18 18l-1.5 1.5m-12-6.4L4.5 10.1M4 2v2m16 0v2m-3.9 11.5L15 14l1.5-1.5m-6.4 12l1.5-1.5L10.1 18M10 4V2m0 14v-2M4.5 4.5L6 6l1.5-1.5M18 6l1.5-1.5L21 6m-12 12l-1.5 1.5L6 21"></path></svg>);
const StarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);

const AICoach: React.FC<AICoachProps> = ({ isPro, isAiEnabled, programs, loggedWorkouts, onUpdate, onPromptUpgrade }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<AIAssistSuggestion[]>([]);
    const [coachError, setCoachError] = useState<string | null>(null);

    const handleGetSuggestions = async () => {
        setCoachError(null);
        if (!isAiEnabled) {
            setCoachError("The AI coach is currently unavailable. If the problem persists, please contact support.");
            return;
        }

        setIsGenerating(true);
        setSuggestions([]);
        const result = await geminiService.getSoloAgenticSuggestions(programs, loggedWorkouts);
        if (result) {
            setSuggestions(result);
        } else {
             setCoachError("The AI coach could not generate suggestions at this time. Please try again later.");
        }
        setIsGenerating(false);
    };

    const handleCreateProgram = (suggestion: AIAssistSuggestion) => {
        const newProgram: WorkoutProgram = {
            id: uuidv4(),
            name: suggestion.name || 'AI Generated Program',
            description: suggestion.description || '',
            exercises: suggestion.exercises?.map(e => ({ ...e, id: uuidv4(), videoUrl: '' })) || [],
        };
        const updatedPrograms = [...storageService.getPrograms(), newProgram];
        storageService.savePrograms(updatedPrograms);
        onUpdate();
        alert(`Program "${newProgram.name}" has been created and saved to your 'Workouts' tab!`);
    };

    if (!isPro) {
        return (
            <Card className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Unlock Your AI Coach</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Get personalized workout program suggestions based on your training history and goals.
                </p>
                <Button onClick={onPromptUpgrade} variant="accent">
                    <StarIcon />
                    Upgrade to Pro
                </Button>
            </Card>
        );
    }
    
    return (
        <Card>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">AI Coach</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                Let's find the perfect next workout for you. The AI will analyze your history and suggest what to do next.
            </p>

            <div className="text-center mb-6">
                <Button onClick={handleGetSuggestions} disabled={isGenerating} size="lg">
                    {isGenerating ? <Spinner /> : <WandIcon />}
                    {isGenerating ? 'Analyzing Your Progress...' : 'Suggest My Next Workout'}
                </Button>
            </div>
            
            {coachError && (
                <div className="text-center p-3 bg-danger-50 text-danger rounded-md mb-4">
                    {coachError}
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="space-y-4">
                     <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Here are some ideas:</h3>
                    {suggestions.map((s, i) => (
                        <div key={i} className="p-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500 rounded-r-lg">
                            <h4 className="font-bold text-blue-900 dark:text-blue-300">{s.name}</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">{s.description}</p>
                            <p className="text-sm text-blue-700 dark:text-blue-400 italic border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                                <span className="font-semibold">Coach's Reasoning:</span> "{s.reasoning}"
                            </p>
                            <div className="mt-4">
                                <Button size="sm" onClick={() => handleCreateProgram(s)}>Add to My Programs</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default AICoach;