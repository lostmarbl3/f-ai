import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../../services/storageService';
import { Client, WorkoutProgram, Invoice, TrainerSettings, InProgressWorkout, WeightUnit, LoggedWorkout, Notification, Theme } from '../../types';
import WorkoutLogger from './WorkoutLogger';
import WorkoutHistory from './WorkoutHistory';
import ClientBilling from './ClientBilling';
import PersonalRecords from './PersonalRecords';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ToolsModal from '../shared/ToolsModal';
import WorkoutSummary from './WorkoutSummary';
import ConfirmationModal from '../ui/ConfirmationModal';
import BellIcon from '../ui/BellIcon';
import NotificationsModal from '../shared/NotificationsModal';

interface ClientViewProps {
    clientId: string;
    onLogout: () => void;
    unit: WeightUnit;
    onUnitToggle: (unit: WeightUnit) => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-danger"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
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
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const DollarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const ToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
);

const UnitToggle = ({ unit, onToggle }: { unit: WeightUnit, onToggle: (unit: WeightUnit) => void }) => (
    <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
        <button onClick={() => onToggle('kg')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'kg' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>KG</button>
        <button onClick={() => onToggle('lbs')} className={`px-3 py-1 text-sm font-semibold rounded ${unit === 'lbs' ? 'bg-white dark:bg-slate-500 dark:text-white text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>LBS</button>
    </div>
);

const daysOverdue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    if (today <= due) return 0;
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
};

type View = 'dashboard' | 'history' | 'prs' | 'billing';

const ClientView: React.FC<ClientViewProps> = ({ clientId, onLogout, unit, onUnitToggle, theme, onThemeChange }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [trainerSettings, setTrainerSettings] = useState<TrainerSettings>({ lockoutThresholdDays: 999 });
    const [activeWorkout, setActiveWorkout] = useState<WorkoutProgram | null>(null);
    const [resumeData, setResumeData] = useState<InProgressWorkout | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [hasOverdueInvoice, setHasOverdueInvoice] = useState(false);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [finishedWorkoutLog, setFinishedWorkoutLog] = useState<LoggedWorkout | null>(null);
    const [resumePrompt, setResumePrompt] = useState<WorkoutProgram | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsModalOpen, setNotificationsModalOpen] = useState(false);

    const refreshData = useCallback(() => {
        const currentClient = storageService.getClients().find(c => c.id === clientId);
        if (currentClient && currentClient.status === 'active') {
            setClient(currentClient);
            const allPrograms = storageService.getPrograms();
            const assigned = allPrograms.filter(p => currentClient.assignedProgramIds.includes(p.id));
            setPrograms(assigned);
            
            storageService.updateInvoiceStatuses();
            const allInvoices = storageService.getInvoices();
            const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId);
            setInvoices(clientInvoices);
            setNotifications(storageService.getNotifications());

            const settings = storageService.getTrainerSettings();
            setTrainerSettings(settings);

            const overdue = clientInvoices.some(inv => inv.status === 'overdue');
            setHasOverdueInvoice(overdue);
            
            const locked = clientInvoices.some(inv => inv.status === 'overdue' && daysOverdue(inv.dueDate) >= settings.lockoutThresholdDays);
            setIsLockedOut(locked);
            if (locked) {
                setView('billing');
            }
        } else {
             onLogout();
        }
    }, [clientId, onLogout]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleOpenNotifications = () => {
        setNotificationsModalOpen(true);
        const unread = notifications.filter(n => !n.read);
        if (unread.length > 0) {
            const updatedNotifications = notifications.map(n => ({...n, read: true}));
            setNotifications(updatedNotifications);
            storageService.saveNotifications(updatedNotifications);
        }
    }

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

    const handleFinishWorkout = (loggedWorkout?: LoggedWorkout) => {
        setActiveWorkout(null);
        setResumeData(null);
        if (loggedWorkout) {
            setFinishedWorkoutLog(loggedWorkout);
        }
        refreshData();
    };

    if (!client) {
        return <div className="p-8 text-center">Loading client data...</div>;
    }
    
    if (isLockedOut) {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <Card className="text-center max-w-lg w-full border-2 border-red-200">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <LockIcon/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Account Access Restricted</h2>
                    <p className="text-gray-600 my-4">
                        Your account is currently on hold due to one or more overdue invoices. Please settle your payment to restore full access to your workout programs and history.
                    </p>
                    <div className="my-6">
                        <ClientBilling clientId={clientId} onPayment={refreshData} />
                    </div>
                    <p className="text-xs text-gray-500">If you believe this is a mistake, please contact your trainer.</p>
                </Card>
            </div>
        )
    }
    
    if (finishedWorkoutLog) {
        return <WorkoutSummary workoutLog={finishedWorkoutLog} onClose={() => setFinishedWorkoutLog(null)} unit={unit} />;
    }

    if (activeWorkout) {
        return <WorkoutLogger program={activeWorkout} client={client} onFinish={handleFinishWorkout} initialData={resumeData} unit={unit} />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {client.name}</h1>
                </div>
                 <div className="flex items-center space-x-4">
                      <UnitToggle unit={unit} onToggle={onUnitToggle} />
                      <button onClick={() => setIsToolsModalOpen(true)} title="Tools" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ToolsIcon />
                      </button>
                      <BellIcon hasNotification={hasOverdueInvoice || notifications.some(n => !n.read)} onClick={handleOpenNotifications} />
                      <Button variant="secondary" onClick={onLogout}>
                        <LogOutIcon />
                        Logout
                    </Button>
                 </div>
            </header>

            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="flex space-x-1 sm:space-x-4" aria-label="Tabs">
                    <button onClick={() => setView('dashboard')} className={`inline-flex items-center px-1 sm:px-3 py-2 font-medium text-sm rounded-t-md ${view === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                       <ListIcon/> My Workouts
                    </button>
                    <button onClick={() => setView('history')} className={`inline-flex items-center px-1 sm:px-3 py-2 font-medium text-sm rounded-t-md ${view === 'history' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                       <ClockIcon/> History
                    </button>
                    <button onClick={() => setView('prs')} className={`inline-flex items-center px-1 sm:px-3 py-2 font-medium text-sm rounded-t-md ${view === 'prs' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                       <TrophyIcon/> Personal Records
                    </button>
                    <button onClick={() => setView('billing')} className={`inline-flex items-center px-1 sm:px-3 py-2 font-medium text-sm rounded-t-md ${view === 'billing' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                       <DollarIcon/> Billing
                    </button>
                </nav>
            </div>

            <main>
                {view === 'dashboard' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Your Assigned Programs</h2>
                        {programs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <Card>
                                <p className="text-slate-600 dark:text-slate-400 text-center py-8">You don't have any workout programs assigned yet. Contact your trainer!</p>
                            </Card>
                        )}
                    </div>
                )}
                {view === 'history' && <WorkoutHistory clientId={clientId} unit={unit} />}
                {view === 'prs' && <PersonalRecords clientId={clientId} unit={unit} />}
                {view === 'billing' && <ClientBilling clientId={clientId} onPayment={refreshData} />}
            </main>
            <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} notifications={notifications} />
            <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} theme={theme} onThemeChange={onThemeChange} />
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
        </div>
    );
};

export default ClientView;
