import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { isApiKeySet } from '../../services/geminiService';
import { Client, WorkoutProgram, LoggedWorkout, ProgressDataPoint, UserRole, AdminAuthState, AuthState, WeightUnit, InProgressWorkout, Notification, Theme } from '../../types';
import { TRAINER_CLIENT_ID, SOLO_USER_CLIENT_ID } from '../../constants';
import ClientManager from './ClientManager';
import WorkoutBuilder from './WorkoutBuilder';
import BillingManager from './BillingManager';
import WorkoutLogger from '../client/WorkoutLogger';
import Card from '../ui/Card';
import Select from '../ui/Select';
import ProgressChart from '../shared/ProgressChart';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SubscriptionModal from '../shared/SubscriptionModal';
import ToolsModal from '../shared/ToolsModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import WorkoutSummary from '../client/WorkoutSummary';
import { kgToLbs } from '../../utils/conversions';
import BellIcon from '../ui/BellIcon';
import NotificationsModal from '../shared/NotificationsModal';

const LogOutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const DollarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const StarIcon = ({ className = '' }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 mr-2 ${className}`}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const ToolsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>);
const UserTrainingIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);


const UnitToggle = ({ unit, onToggle }: { unit: WeightUnit, onToggle: (unit: WeightUnit) => void }) => (
    <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
        <button onClick={() => onToggle('kg')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'kg' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>KG</button>
        <button onClick={() => onToggle('lbs')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'lbs' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>LBS</button>
    </div>
);

interface AdminViewProps {
    onLogout: () => void;
    authState: AdminAuthState;
    setAuthState: (state: AuthState) => void;
    unit: WeightUnit;
    onUnitToggle: (unit: WeightUnit) => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

type Tab = 'clients' | 'workouts' | 'progress' | 'billing' | 'my_training';

const AdminView: React.FC<AdminViewProps> = ({ onLogout, authState, setAuthState, unit, onUnitToggle, theme, onThemeChange }) => {
    const [activeTab, setActiveTab] = useState<Tab>('clients');
    const [clients, setClients] = useState<Client[]>([]);
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
    const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
    const [availableExercises, setAvailableExercises] = useState<string[]>([]);
    const [clientWorkoutHistory, setClientWorkoutHistory] = useState<LoggedWorkout[]>([]);
    const [viewingWorkoutLog, setViewingWorkoutLog] = useState<LoggedWorkout | null>(null);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [activeTrainerWorkout, setActiveTrainerWorkout] = useState<WorkoutProgram | null>(null);
    const [trainerClientProfile, setTrainerClientProfile] = useState<Client | null>(null);
    const [trainerPrograms, setTrainerPrograms] = useState<WorkoutProgram[]>([]);
    const [resumePrompt, setResumePrompt] = useState<WorkoutProgram | null>(null);
    const [resumeData, setResumeData] = useState<InProgressWorkout | null>(null);
    const [finishedWorkoutLog, setFinishedWorkoutLog] = useState<LoggedWorkout | null>(null);
    const [isMyProgramsModalOpen, setIsMyProgramsModalOpen] = useState(false);
    const [myAssignedProgramIds, setMyAssignedProgramIds] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsModalOpen, setNotificationsModalOpen] = useState(false);

    const { subscriptionStatus, stripeConnected } = authState;

    const refreshData = useCallback(() => {
        const allClients = storageService.getClients();
        const allPrograms = storageService.getPrograms();
        const allLoggedWorkouts = storageService.getLoggedWorkouts();

        const trainerVisiblePrograms = allPrograms.filter(p => p.ownerId === TRAINER_CLIENT_ID || !p.ownerId);

        setClients(allClients.filter(c => c.id !== TRAINER_CLIENT_ID && c.id !== SOLO_USER_CLIENT_ID));
        setPrograms(trainerVisiblePrograms);
        setLoggedWorkouts(allLoggedWorkouts);
        setNotifications(storageService.getNotifications());

        const trainerProfile = allClients.find(c => c.id === TRAINER_CLIENT_ID);
        if (trainerProfile) {
            setTrainerClientProfile(trainerProfile);
            setMyAssignedProgramIds(trainerProfile.assignedProgramIds || []);
            setTrainerPrograms(trainerVisiblePrograms.filter(p => trainerProfile.assignedProgramIds.includes(p.id)));
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleSubscribe = () => {
        authService.setSubscriptionStatus(UserRole.Admin, 'pro');
        setAuthState({...authState, subscriptionStatus: 'pro'});
        setIsSubModalOpen(false);
    };

    const handleCancelSubscription = () => {
        if (window.confirm("Are you sure you want to cancel your Pro subscription?")) {
            authService.setSubscriptionStatus(UserRole.Admin, 'free');
            setAuthState({...authState, subscriptionStatus: 'free'});
            setIsSubModalOpen(false);
        }
    };
    
    const handleStripeConnect = () => {
        authService.connectStripe();
        setAuthState({...authState, stripeConnected: true});
    }

    const handleOpenNotifications = () => {
        setNotificationsModalOpen(true);
        const unread = notifications.filter(n => !n.read);
        if (unread.length > 0) {
            const updatedNotifications = notifications.map(n => ({...n, read: true}));
            setNotifications(updatedNotifications);
            storageService.saveNotifications(updatedNotifications);
        }
    }
    
     const handleStartTrainerWorkout = (program: WorkoutProgram) => {
        const savedProgress = storageService.getInProgressWorkout(TRAINER_CLIENT_ID, program.id);
        if (savedProgress) {
            setResumeData(savedProgress);
            setResumePrompt(program);
        } else {
            setResumeData(null);
            setActiveTrainerWorkout(program);
        }
    };
    
    const handleFinishTrainerWorkout = (loggedWorkout?: LoggedWorkout) => {
        setActiveTrainerWorkout(null);
        setResumeData(null);
        if(loggedWorkout) {
            setFinishedWorkoutLog(loggedWorkout);
        }
        refreshData();
    };

    const openMyProgramsModal = () => {
        const currentProfile = storageService.getClients().find(c => c.id === TRAINER_CLIENT_ID);
        setMyAssignedProgramIds(currentProfile?.assignedProgramIds || []);
        setIsMyProgramsModalOpen(true);
    };

    const handleMyProgramToggle = (programId: string) => {
        setMyAssignedProgramIds(prev => 
            prev.includes(programId) 
                ? prev.filter(id => id !== programId)
                : [...prev, programId]
        );
    };

    const handleSaveMyPrograms = () => {
        const allClients = storageService.getClients();
        const trainerProfileIndex = allClients.findIndex(c => c.id === TRAINER_CLIENT_ID);
    
        if (trainerProfileIndex > -1) {
            allClients[trainerProfileIndex].assignedProgramIds = myAssignedProgramIds;
        } else {
            console.warn("Trainer profile was missing. Re-creating it to save program assignments.");
            const { v4: uuidv4 } = require('uuid');
            allClients.push({
                id: TRAINER_CLIENT_ID,
                name: 'Me',
                assignedProgramIds: myAssignedProgramIds,
                notes: 'My personal training profile.',
                status: 'active',
                userHandle: uuidv4(),
            });
        }
        
        storageService.saveClients(allClients);
        refreshData();
        setIsMyProgramsModalOpen(false);
    };
    
    const handleAssignNewProgramToMe = (newProgramId: string) => {
        if (!newProgramId) return;

        let allClients = storageService.getClients();
        const trainerProfileIndex = allClients.findIndex(c => c.id === TRAINER_CLIENT_ID);
    
        if (trainerProfileIndex > -1) {
            const currentProfile = allClients[trainerProfileIndex];
            const newAssignedIds = [...new Set([...currentProfile.assignedProgramIds, newProgramId])];
            allClients[trainerProfileIndex] = { ...currentProfile, assignedProgramIds: newAssignedIds };
        } else {
            const { v4: uuidv4 } = require('uuid');
            allClients.push({
                id: TRAINER_CLIENT_ID,
                name: 'Me',
                assignedProgramIds: [newProgramId],
                notes: 'My personal training profile.',
                status: 'active',
                userHandle: uuidv4(),
            });
        }
        
        storageService.saveClients(allClients);
        refreshData();
    };

    const handleDeleteProgram = (programId: string, fromView: 'client' | 'personal') => {
        if (fromView === 'personal') {
            if (window.confirm("Are you sure you want to remove this program from your personal training list?")) {
                const allClients = storageService.getClients();
                const trainerProfile = allClients.find(c => c.id === TRAINER_CLIENT_ID);
                if (trainerProfile) {
                    trainerProfile.assignedProgramIds = trainerProfile.assignedProgramIds.filter(id => id !== programId);
                    storageService.saveClients(allClients);
                    refreshData();
                }
            }
        } else {
            if (window.confirm("Are you sure you want to permanently delete this program? This will remove it from all assigned clients and your personal list.")) {
                const allPrograms = storageService.getPrograms();
                const updatedPrograms = allPrograms.filter(p => p.id !== programId);
                storageService.savePrograms(updatedPrograms);
                
                const allClients = storageService.getClients();
                const updatedClients = allClients.map(c => ({
                    ...c,
                    assignedProgramIds: c.assignedProgramIds.filter(id => id !== programId)
                }));
                storageService.saveClients(updatedClients);
                refreshData();
            }
        }
    };

    useEffect(() => {
        const activeClients = clients.filter(c => c.status === 'active');
        if(activeClients.length > 0 && !activeClients.find(c => c.id === selectedClientId)) {
            setSelectedClientId(activeClients[0].id);
        } else if (activeClients.length === 0) {
            setSelectedClientId('');
        }
    }, [clients, selectedClientId]);

    useEffect(() => {
        if(selectedClientId) {
            const clientWorkouts = loggedWorkouts.filter(w => w.clientId === selectedClientId);
            const exercises = new Set<string>();
            clientWorkouts.forEach(w => w.loggedExercises.forEach(e => exercises.add(e.exerciseName)));
            const exerciseList = Array.from(exercises).filter(Boolean); // Filter out empty strings
            setAvailableExercises(exerciseList);
            
            const clientHistory = loggedWorkouts
                .filter(w => w.clientId === selectedClientId)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setClientWorkoutHistory(clientHistory);

            if(exerciseList.length > 0) {
                 if (!exerciseList.includes(selectedExerciseName)) {
                    setSelectedExerciseName(exerciseList[0]);
                 }
            } else {
                 setSelectedExerciseName('');
                 setProgressData([]);
            }
        } else {
            setAvailableExercises([]);
            setSelectedExerciseName('');
            setClientWorkoutHistory([]);
            setProgressData([]);
        }
    }, [selectedClientId, loggedWorkouts, selectedExerciseName]);

    useEffect(() => {
        if(selectedClientId && selectedExerciseName) {
            const clientWorkouts = loggedWorkouts
                .filter(w => w.clientId === selectedClientId)
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const data: ProgressDataPoint[] = [];
            clientWorkouts.forEach(workout => {
                const exerciseLog = workout.loggedExercises.find(e => e.exerciseName === selectedExerciseName);
                if(exerciseLog) {
                    const maxWeight = Math.max(...exerciseLog.sets.map(s => s.weight), 0);
                    if(maxWeight > 0) {
                        data.push({ date: workout.date, weight: maxWeight });
                    }
                }
            });
            setProgressData(data);
        } else {
            setProgressData([]);
        }

    }, [selectedClientId, selectedExerciseName, loggedWorkouts]);
    
    if (activeTrainerWorkout && trainerClientProfile) {
        return <WorkoutLogger program={activeTrainerWorkout} client={trainerClientProfile} onFinish={handleFinishTrainerWorkout} initialData={resumeData} unit={unit} />;
    }
    
    if (finishedWorkoutLog) {
        return <WorkoutSummary workoutLog={finishedWorkoutLog} onClose={() => setFinishedWorkoutLog(null)} unit={unit} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'clients':
                return <ClientManager clients={clients} programs={programs.filter(p => p.scope !== 'personal')} loggedWorkouts={loggedWorkouts} onUpdate={refreshData} isPro={subscriptionStatus === 'pro'} onPromptUpgrade={() => setIsSubModalOpen(true)} />;
            case 'workouts':
                return <WorkoutBuilder programs={programs} onUpdate={refreshData} isAiEnabled={isApiKeySet} myProgramIds={trainerClientProfile?.assignedProgramIds || []} onProgramCreated={handleAssignNewProgramToMe} programOwnerId={TRAINER_CLIENT_ID} onDeleteProgram={handleDeleteProgram}/>;
            case 'billing':
                return <BillingManager clients={clients} stripeConnected={stripeConnected} onStripeConnect={handleStripeConnect} />;
            case 'my_training':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">My Assigned Programs</h2>
                             <Button variant="secondary" onClick={openMyProgramsModal}>Manage My Programs</Button>
                        </div>
                        {trainerPrograms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trainerPrograms.map(program => (
                                    <Card key={program.id} className="flex flex-col">
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{program.name}</h3>
                                            <p className="mt-2 text-slate-600 dark:text-slate-400">{program.description}</p>
                                        </div>
                                        <div className="mt-6">
                                             <Button onClick={() => handleStartTrainerWorkout(program)} className="w-full">Start Workout</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                                    You don't have any workout programs assigned to yourself yet.
                                    <br />
                                    Click 'Manage My Programs' to select your training plan.
                                </p>
                            </Card>
                        )}
                    </div>
                );
            case 'progress':
                const activeClients = clients.filter(c => c.status === 'active');
                return (
                    <Card>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Client Progress</h2>
                        {activeClients.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <Select label="Select Client" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                                    {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                                <Select label="Select Exercise for Chart" value={selectedExerciseName} onChange={e => setSelectedExerciseName(e.target.value)} disabled={availableExercises.length === 0}>
                                    {availableExercises.length > 0 ? (
                                        availableExercises.filter(Boolean).map(ex => <option key={ex} value={ex}>{ex}</option>)
                                    ) : (
                                        <option>No exercises logged</option>
                                    )}
                                </Select>
                            </div>
                            {selectedExerciseName && progressData.length > 0 ? (
                                 <ProgressChart data={progressData} exerciseName={selectedExerciseName} unit={unit} />
                            ) : (
                                 <div className="flex items-center justify-center h-72 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <p className="text-slate-500 dark:text-slate-400">No progress data for this selection.</p>
                                </div>
                            )}
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Workout History</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {clientWorkoutHistory.length > 0 ? clientWorkoutHistory.map(log => (
                                        <div key={log.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{log.programName}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                                            </div>
                                            <Button size="sm" variant="secondary" onClick={() => setViewingWorkoutLog(log)}>View Details</Button>
                                        </div>
                                    )) : <p className="text-slate-500 dark:text-slate-400">No workout history for this client.</p>}
                                </div>
                            </div>
                        </>
                        ) : (
                             <div className="text-center py-12">
                                <p className="text-slate-600 dark:text-slate-400">No active clients to display progress for.</p>
                            </div>
                        )}
                    </Card>
                );
            default:
                return null;
        }
    };
    
    const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
            {icon} {label}
        </button>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Trainer Dashboard</h1>
                </div>
                <div className="flex items-center flex-wrap justify-end gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border dark:border-slate-700">
                        <TabButton tab="clients" label="Clients" icon={<UsersIcon />} />
                        <TabButton tab="my_training" label="My Training" icon={<UserTrainingIcon/>} />
                        <TabButton tab="workouts" label="Workouts" icon={<ListIcon />} />
                        <TabButton tab="progress" label="Progress" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M12 20V10m6 10V4M6 20v-4"/></svg>} />
                        <TabButton tab="billing" label="Billing" icon={<DollarIcon />} />
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
                                        <p className="font-bold">Client's Note:</p>
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
             <Modal title="Manage My Programs" isOpen={isMyProgramsModalOpen} onClose={() => setIsMyProgramsModalOpen(false)}>
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2 border-b dark:border-slate-700 pb-2">My Programs</h3>
                        <div className="pl-2">
                            {programs.filter(p => p.scope === 'personal').map(program => (
                                <div key={program.id} className="flex items-center mb-2"><input type="checkbox" id={`my-program-${program.id}`} className="h-4 w-4 text-primary bg-slate-200 border-slate-300 rounded focus:ring-primary" checked={myAssignedProgramIds.includes(program.id)} onChange={() => handleMyProgramToggle(program.id)} /><label htmlFor={`my-program-${program.id}`} className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">{program.name}</label></div>
                            ))}
                             {programs.filter(p => p.scope === 'personal').length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No personal programs created yet.</p>}
                        </div>
                    </div>
                    <div className="pt-4 border-t dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2 border-b dark:border-slate-700 pb-2">Client Programs</h3>
                        <div className="pl-2">
                            {programs.filter(p => p.scope !== 'personal').map(program => (
                                <div key={program.id} className="flex items-center mb-2"><input type="checkbox" id={`my-program-${program.id}`} className="h-4 w-4 text-primary bg-slate-200 border-slate-300 rounded focus:ring-primary" checked={myAssignedProgramIds.includes(program.id)} onChange={() => handleMyProgramToggle(program.id)} /><label htmlFor={`my-program-${program.id}`} className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">{program.name}</label></div>
                            ))}
                             {programs.filter(p => p.scope !== 'personal').length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No client programs available to assign.</p>}
                        </div>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end space-x-4">
                     <Button variant="secondary" onClick={() => setIsMyProgramsModalOpen(false)}>Cancel</Button>
                     <Button onClick={handleSaveMyPrograms}>Save Changes</Button>
                </div>
            </Modal>
            <ConfirmationModal
                isOpen={!!resumePrompt}
                title="Resume Workout?"
                onClose={() => setResumePrompt(null)}
                onConfirm={() => {
                    if (resumePrompt) {
                        setActiveTrainerWorkout(resumePrompt);
                    }
                    setResumePrompt(null);
                }}
                onDecline={() => {
                    if (resumePrompt) {
                        storageService.clearInProgressWorkout(TRAINER_CLIENT_ID, resumePrompt.id);
                        setResumeData(null);
                        setActiveTrainerWorkout(resumePrompt);
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
                role={UserRole.Admin}
            />
            <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} theme={theme} onThemeChange={onThemeChange} />
        </div>
    );
};

export default AdminView;
