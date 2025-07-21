import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { isApiKeySet } from '../../services/geminiService';
import { WorkoutProgram, LoggedWorkout, ProgressDataPoint, UserRole, SoloAuthState, AuthState, WeightUnit, InProgressWorkout, Notification, Theme } from '../../types';

import WorkoutBuilder from '../admin/WorkoutBuilder';
import WorkoutLogger from '../client/WorkoutLogger';
import WorkoutHistory from '../client/WorkoutHistory';
import ProgressChart from '../shared/ProgressChart';
import Card from '../ui/Card';
import Select from '../ui/Select';
import Button from '../ui/Button';
import AICoach from './AICoach';
import SubscriptionModal from '../shared/SubscriptionModal';
import ToolsModal from '../shared/ToolsModal';
import WorkoutSummary from '../client/WorkoutSummary';
import ConfirmationModal from '../ui/ConfirmationModal';
import BellIcon from '../ui/BellIcon';
import NotificationsModal from '../shared/NotificationsModal';

const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);
const BarChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>);
const WandIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M15 4V2m0 14v-2m-7.5-1.5L6 13l-1.5 1.5M19.5 19.5L18 18l-1.5 1.5m-12-6.4L4.5 10.1M4 2v2m16 0v2m-3.9 11.5L15 14l1.5-1.5m-6.4 12l1.5-1.5L10.1 18M10 4V2m0 14v-2M4.5 4.5L6 6l1.5-1.5M18 6l1.5-1.5L21 6m-12 12l-1.5 1.5L6 21"></path></svg>);
const StarIcon = ({ className = '' }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 mr-2 ${className}`}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const ToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
);


const UnitToggle = ({ unit, onToggle }: { unit: WeightUnit, onToggle: (unit: WeightUnit) => void }) => (
    <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
        <button onClick={() => onToggle('kg')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'kg' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>KG</button>
        <button onClick={() => onToggle('lbs')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'lbs' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>LBS</button>
    </div>
);

interface SoloViewProps {
    onLogout: () => void;
    authState: SoloAuthState;
    setAuthState: (state: AuthState) => void;
    unit: WeightUnit;
    onUnitToggle: (unit: WeightUnit) => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}
type Tab = 'dashboard' | 'workouts' | 'progress' | 'coach';

const SoloView: React.FC<SoloViewProps> = ({ onLogout, authState, setAuthState, unit, onUnitToggle, theme, onThemeChange }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);
    const [activeWorkout, setActiveWorkout] = useState<WorkoutProgram | null>(null);
    const [finishedWorkoutLog, setFinishedWorkoutLog] = useState<LoggedWorkout | null>(null);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [resumeData, setResumeData] = useState<InProgressWorkout | null>(null);
    const [resumePrompt, setResumePrompt] = useState<WorkoutProgram | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsModalOpen, setNotificationsModalOpen] = useState(false);

    // State for progress tab
    const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
    const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
    const [availableExercises, setAvailableExercises] = useState<string[]>([]);
    
    const { clientId, subscriptionStatus } = authState;

    const refreshData = useCallback(() => {
        const allPrograms = storageService.getPrograms();
        const soloVisiblePrograms = allPrograms.filter(p => p.ownerId === clientId || !p.ownerId);
        setPrograms(soloVisiblePrograms);
        
        const allLogged = storageService.getLoggedWorkouts();
        setLoggedWorkouts(allLogged.filter(w => w.clientId === clientId));
        setNotifications(storageService.getNotifications());
    }, [clientId]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);
    
    const handleStartWorkout = (program: WorkoutProgram) => {
        const savedProgress = storageService.getInProgressWorkout(clientId, program.id);
        if (savedProgress) {
            setResumeData(savedProgress);
            setResumePrompt(program);
        } else {
            setResumeData(null);
            setActiveWorkout(program);
        }
    };

    const handleDeleteProgram = (programId: string, fromView: 'client' | 'personal') => {
        // In SoloView, fromView is irrelevant. Deletion is always permanent.
        if (window.confirm("Are you sure you want to permanently delete this program?")) {
            const allPrograms = storageService.getPrograms();
            const updatedPrograms = allPrograms.filter(p => p.id !== programId);
            storageService.savePrograms(updatedPrograms);
            refreshData();
        }
    };

    const handleFinishWorkout = (loggedWorkout?: LoggedWorkout) => {
        setActiveWorkout(null);
        setResumeData(null);
        if (loggedWorkout) {
            setFinishedWorkoutLog(loggedWorkout);
        }
        refreshData();
    };

    const handleOpenNotifications = () => {
        setNotificationsModalOpen(true);
        const unread = notifications.filter(n => !n.read);
        if (unread.length > 0) {
            const updatedNotifications = notifications.map(n => ({...n, read: true}));
            setNotifications(updatedNotifications);
            storageService.saveNotifications(updatedNotifications);
        }
    }

    const handleSubscribe = () => {
        authService.setSubscriptionStatus(UserRole.Solo, 'pro');
        setAuthState({...authState, subscriptionStatus: 'pro'});
    };

    const handleCancelSubscription = () => {
         if (window.confirm("Are you sure you want to cancel your Pro subscription?")) {
            authService.setSubscriptionStatus(UserRole.Solo, 'free');
            setAuthState({...authState, subscriptionStatus: 'free'});
            setIsSubModalOpen(false);
        }
    };

    // Effects for progress chart
    useEffect(() => {
        const exercises = new Set<string>();
        loggedWorkouts.forEach(w => w.loggedExercises.forEach(e => exercises.add(e.exerciseName)));
        const exerciseList = Array.from(exercises);
        setAvailableExercises(exerciseList);

        if (exerciseList.length > 0 && !exerciseList.includes(selectedExerciseName)) {
             setSelectedExerciseName(exerciseList[0]);
        } else if (exerciseList.length === 0) {
            setSelectedExerciseName('');
        }
    }, [loggedWorkouts, selectedExerciseName]);

    useEffect(() => {
        if (selectedExerciseName) {
            const sortedWorkouts = [...loggedWorkouts].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const data: ProgressDataPoint[] = [];
            sortedWorkouts.forEach(workout => {
                const exerciseLog = workout.loggedExercises.find(e => e.exerciseName === selectedExerciseName);
                if (exerciseLog) {
                    const maxWeight = Math.max(...exerciseLog.sets.map(s => s.weight), 0);
                    if (maxWeight > 0) {
                        data.push({ date: workout.date, weight: maxWeight });
                    }
                }
            });
            setProgressData(data);
        } else {
            setProgressData([]);
        }
    }, [selectedExerciseName, loggedWorkouts]);

    if (finishedWorkoutLog) {
        return <WorkoutSummary workoutLog={finishedWorkoutLog} onClose={() => setFinishedWorkoutLog(null)} unit={unit} />;
    }

    if (activeWorkout) {
        return <WorkoutLogger 
            program={activeWorkout} 
            client={{id: clientId, name: 'Me', assignedProgramIds: [], status: 'active', userHandle: ''}} // userHandle not needed here
            onFinish={handleFinishWorkout}
            initialData={resumeData}
            unit={unit}
        />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">My Workout Programs</h2>
                        {programs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {programs.map(program => (
                                    <Card key={program.id} className="flex flex-col">
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{program.name}</h3>
                                            <p className="mt-2 text-slate-600 dark:text-slate-400">{program.description}</p>
                                        </div>
                                        <div className="mt-6">
                                             <Button onClick={() => handleStartWorkout(program)} className="w-full">Start Workout</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <Card className="text-center py-12">
                                <p className="text-slate-600 dark:text-slate-400">You haven't created any workout programs yet.</p>
                                <Button className="mt-4" onClick={() => setActiveTab('workouts')}>Create Your First Workout</Button>
                            </Card>
                        )}
                    </div>
                );
            case 'workouts':
                return <WorkoutBuilder programs={programs} onUpdate={refreshData} isAiEnabled={isApiKeySet} programOwnerId={clientId} onDeleteProgram={handleDeleteProgram} />;
            case 'progress':
                return (
                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Progress Chart</h2>
                             <Select label="Select Exercise for Chart" value={selectedExerciseName} onChange={e => setSelectedExerciseName(e.target.value)} disabled={availableExercises.length === 0}>
                                {availableExercises.length > 0 ? (
                                    availableExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)
                                ) : (
                                    <option>Log a workout to see progress</option>
                                )}
                            </Select>
                            <div className="mt-4">
                                {selectedExerciseName && progressData.length > 0 ? (
                                     <ProgressChart data={progressData} exerciseName={selectedExerciseName} unit={unit} />
                                ) : (
                                     <div className="flex items-center justify-center h-72 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        <WorkoutHistory clientId={clientId} unit={unit} />
                    </div>
                );
            case 'coach':
                 return <AICoach isPro={subscriptionStatus === 'pro'} programs={programs} loggedWorkouts={loggedWorkouts} onUpdate={refreshData} onPromptUpgrade={() => setIsSubModalOpen(true)} isAiEnabled={isApiKeySet} />;
            default:
                return null;
        }
    };
    
    const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center px-3 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
            {icon} {label}
        </button>
    )

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border dark:border-slate-700">
                            <TabButton tab="dashboard" label="Home" icon={<HomeIcon />} />
                            <TabButton tab="workouts" label="Workouts" icon={<ListIcon />} />
                            <TabButton tab="coach" label="AI Coach" icon={<WandIcon />} />
                            <TabButton tab="progress" label="Progress" icon={<BarChartIcon />} />
                        </div>
                        <UnitToggle unit={unit} onToggle={onUnitToggle} />
                        <BellIcon hasNotification={notifications.some(n => !n.read)} onClick={handleOpenNotifications} />
                        <button onClick={() => setIsToolsModalOpen(true)} title="Tools" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <ToolsIcon />
                        </button>
                        <Button onClick={() => setIsSubModalOpen(true)} variant={subscriptionStatus === 'pro' ? 'secondary' : 'accent'}>
                            <StarIcon className={subscriptionStatus === 'pro' ? 'text-accent' : ''}/>
                            {subscriptionStatus === 'pro' ? 'Manage Pro' : 'Upgrade to Pro'}
                        </Button>
                        <Button variant="secondary" onClick={onLogout}>
                            <LogOutIcon />
                            Logout
                        </Button>
                    </div>
                </header>
                <main>
                    {renderContent()}
                </main>
                <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} notifications={notifications} />
                <ConfirmationModal
                    isOpen={!!resumePrompt}
                    title="Resume Workout?"
                    onClose={() => setResumePrompt(null)}
                    onConfirm={() => {
                        if (resumePrompt) {
                            setActiveWorkout(resumePrompt);
                        }
                        setResumePrompt(null);
                    }}
                    onDecline={() => {
                        if (resumePrompt) {
                            storageService.clearInProgressWorkout(clientId, resumePrompt.id);
                            setResumeData(null);
                            setActiveWorkout(resumePrompt);
                        }
                        setResumePrompt(null);
                    }}
                >
                    You have an unfinished workout session. Would you like to resume where you left off?
                </ConfirmationModal>
                <SubscriptionModal
                    isOpen={isSubModalOpen}
                    onClose={() => setIsSubModalOpen(false)}
                    onSubscribe={handleSubscribe}
                    onCancel={handleCancelSubscription}
                    currentStatus={subscriptionStatus}
                    role={UserRole.Solo}
                />
                <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} theme={theme} onThemeChange={onThemeChange} />
            </div>
        </div>
    );
};

export default SoloView;