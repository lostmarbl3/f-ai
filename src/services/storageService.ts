
import { Client, WorkoutProgram, LoggedWorkout, Invoice, TrainerSettings, SubscriptionPlan, ClientSubscription, InProgressWorkout, LoggedExercise, LoggedCardio, Notification } from '../types';
import { CLIENTS, WORKOUT_PROGRAMS, SUBSCRIPTION_PLANS, NOTIFICATIONS } from '../constants';

const CLIENTS_KEY = 'fit_track_clients';
const PROGRAMS_KEY = 'fit_track_programs';
const LOGGED_WORKOUTS_KEY = 'fit_track_logged_workouts';
const INVOICES_KEY = 'fit_track_invoices';
const TRAINER_SETTINGS_KEY = 'fit_track_trainer_settings';
const PLANS_KEY = 'fit_track_subscription_plans';
const SUBSCRIPTIONS_KEY = 'fit_track_client_subscriptions';
const IN_PROGRESS_WORKOUTS_KEY = 'fit_track_in_progress_workouts';
const NOTIFICATIONS_KEY = 'fit_track_notifications';

const getItems = <T,>(key: string): T[] => {
    try {
        const items = localStorage.getItem(key);
        return items ? JSON.parse(items) : [];
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        return [];
    }
};

const getItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        return defaultValue;
    }
}

const saveItems = <T,>(key: string, items: T[]): void => {
    localStorage.setItem(key, JSON.stringify(items));
};

const saveItem = <T,>(key: string, item: T): void => {
    localStorage.setItem(key, JSON.stringify(item));
}

export const storageService = {
    // SEED
    seedData: () => {
        saveItems(CLIENTS_KEY, CLIENTS);
        saveItems(PROGRAMS_KEY, WORKOUT_PROGRAMS);
        saveItems(PLANS_KEY, SUBSCRIPTION_PLANS);
        saveItems(NOTIFICATIONS_KEY, NOTIFICATIONS);
        // Default trainer settings
        saveItem(TRAINER_SETTINGS_KEY, { lockoutThresholdDays: 7 });
        localStorage.setItem('initialized', 'true');
    },

    // CLIENTS
    getClients: (): Client[] => getItems<Client>(CLIENTS_KEY),
    saveClients: (clients: Client[]) => saveItems(CLIENTS_KEY, clients),
    
    // WORKOUT PROGRAMS
    getPrograms: (): WorkoutProgram[] => getItems<WorkoutProgram>(PROGRAMS_KEY),
    savePrograms: (programs: WorkoutProgram[]) => saveItems(PROGRAMS_KEY, programs),
    
    // LOGGED WORKOUTS
    getLoggedWorkouts: (): LoggedWorkout[] => getItems<LoggedWorkout>(LOGGED_WORKOUTS_KEY),
    saveLoggedWorkouts: (workouts: LoggedWorkout[]) => saveItems(LOGGED_WORKOUTS_KEY, workouts),
    addLoggedWorkout: (workout: LoggedWorkout) => {
        const workouts = getItems<LoggedWorkout>(LOGGED_WORKOUTS_KEY);
        saveItems(LOGGED_WORKOUTS_KEY, [...workouts, workout]);
    },

    // IN-PROGRESS WORKOUTS (for save & resume)
    getInProgressWorkout: (clientId: string, programId: string): InProgressWorkout | null => {
        const workouts = getItems<InProgressWorkout>(IN_PROGRESS_WORKOUTS_KEY);
        const found = workouts.find(w => w.clientId === clientId && w.programId === programId);
        return found || null;
    },
    saveInProgressWorkout: (clientId: string, programId: string, progress: { loggedExercises: LoggedExercise[], loggedCardio?: LoggedCardio[] }) => {
        let workouts = getItems<InProgressWorkout>(IN_PROGRESS_WORKOUTS_KEY);
        const newWorkout: InProgressWorkout = {
            clientId,
            programId,
            loggedExercises: progress.loggedExercises,
            loggedCardio: progress.loggedCardio,
            lastUpdated: new Date().toISOString()
        };
        const existingIndex = workouts.findIndex(w => w.clientId === clientId && w.programId === programId);
        if (existingIndex > -1) {
            workouts[existingIndex] = newWorkout;
        } else {
            workouts.push(newWorkout);
        }
        saveItems(IN_PROGRESS_WORKOUTS_KEY, workouts);
    },
    clearInProgressWorkout: (clientId: string, programId: string) => {
        let workouts = getItems<InProgressWorkout>(IN_PROGRESS_WORKOUTS_KEY);
        const updatedWorkouts = workouts.filter(w => w.clientId !== clientId || w.programId !== programId);
        saveItems(IN_PROGRESS_WORKOUTS_KEY, updatedWorkouts);
    },

    // INVOICES
    getInvoices: (): Invoice[] => getItems<Invoice>(INVOICES_KEY),
    saveInvoices: (invoices: Invoice[]) => saveItems(INVOICES_KEY, invoices),
    updateInvoiceStatuses: () => {
        const invoices = getItems<Invoice>(INVOICES_KEY);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        const updatedInvoices = invoices.map(inv => {
            if (inv.status === 'sent') {
                const dueDate = new Date(inv.dueDate);
                if (today > dueDate) {
                    return { ...inv, status: 'overdue' as const };
                }
            }
            return inv;
        });
        saveItems(INVOICES_KEY, updatedInvoices);
    },

    // TRAINER SETTINGS
    getTrainerSettings: (): TrainerSettings => getItem<TrainerSettings>(TRAINER_SETTINGS_KEY, { lockoutThresholdDays: 7 }),
    saveTrainerSettings: (settings: TrainerSettings) => saveItem(TRAINER_SETTINGS_KEY, settings),

    // SUBSCRIPTION PLANS
    getSubscriptionPlans: (): SubscriptionPlan[] => getItems<SubscriptionPlan>(PLANS_KEY),
    saveSubscriptionPlans: (plans: SubscriptionPlan[]) => saveItems(PLANS_KEY, plans),

    // CLIENT SUBSCRIPTIONS
    getClientSubscriptions: (): ClientSubscription[] => getItems<ClientSubscription>(SUBSCRIPTIONS_KEY),
    saveClientSubscriptions: (subscriptions: ClientSubscription[]) => saveItems(SUBSCRIPTIONS_KEY, subscriptions),

    // NOTIFICATIONS
    getNotifications: (): Notification[] => getItems<Notification>(NOTIFICATIONS_KEY),
    saveNotifications: (notifications: Notification[]) => saveItems(NOTIFICATIONS_KEY, notifications),
};