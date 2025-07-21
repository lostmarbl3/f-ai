export enum UserRole {
    Admin = 'admin',
    Client = 'client',
    Solo = 'solo',
}

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi' | 'm' | 'yd';
export type Theme = 'light' | 'dark' | 'system';

export type SubscriptionStatus = 'free' | 'pro';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string; // ISO String
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    amount: number;
    interval: 'week' | 'month' | 'year';
}

export interface ClientSubscription {
    id: string;
    clientId: string;
    planId: string;
    status: 'active' | 'canceled';
    startDate: string; // ISO string
}

export interface Invoice {
    id: string;
    clientId: string;
    clientName: string; // denormalized for easy display
    amount: number;
    description: string;
    status: InvoiceStatus;
    issueDate: string; // ISO string
    dueDate: string; // ISO string
    paidDate?: string; // ISO string
}

export interface TrainerSettings {
    lockoutThresholdDays: number; // e.g., 5 days
}

export interface BaseAuthState {
    role: UserRole;
}

export interface AdminAuthState extends BaseAuthState {
    role: UserRole.Admin;
    subscriptionStatus: SubscriptionStatus;
    stripeConnected: boolean;
}

export interface ClientAuthState extends BaseAuthState {
    role: UserRole.Client;
    clientId: string;
}

export interface SoloAuthState extends BaseAuthState {
    role: UserRole.Solo;
    clientId: string;
    subscriptionStatus: SubscriptionStatus;
}

export type AuthState = AdminAuthState | ClientAuthState | SoloAuthState;

export interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: string; // e.g., "8-12" or "10"
    rest: string; // e.g., "60s"
    videoUrl?: string;
    cues?: string;
    prescribedWeight?: string;
    prescribedRpe?: string;
}

export interface CardioExercise {
    id: string;
    activity: string;
    goalType: 'time' | 'distance';
    goalValue: number;
    distanceUnit?: DistanceUnit;
    intensity: 'low' | 'moderate' | 'high';
}

export interface WorkoutProgram {
    id: string;
    name: string;
    description: string;
    programNotes?: string;
    warmup?: Exercise[];
    exercises: Exercise[];
    cardio?: CardioExercise[];
    cooldown?: Exercise[];
    ownerId?: string; // Used to silo programs between trainer and solo user
    scope?: 'client' | 'personal'; // Used to silo trainer's own programs
}

export interface AIAssistSuggestion extends Partial<WorkoutProgram> {
    reasoning: string;
}

export interface Client {
    id:string;
    name: string;
    assignedProgramIds: string[];
    notes?: string;
    status: 'active' | 'suspended';
    userHandle: string;
    passkeyId?: string;
}

export interface LoggedSet {
    setNumber: number;
    weight: number; // Always stored in KG
    reps: number;
    rpe?: number;
    completed: boolean;
}

export interface LoggedExercise {
    exerciseId: string;
    exerciseName: string;
    sets: LoggedSet[];
    notes?: string; // Client's notes for this specific exercise during the workout
}

export interface LoggedCardio {
    cardioId: string;
    activity: string;
    goalType: 'time' | 'distance';
    goalValue: number;
    actualTime?: number; // in minutes
    actualDistance?: number;
    distanceUnit?: DistanceUnit;
}

export interface LoggedWorkout {
    id: string;
    programId: string;
    programName: string;
    clientId: string;
    date: string; // ISO string
    loggedExercises: LoggedExercise[];
    loggedCardio?: LoggedCardio[];
    durationSeconds?: number;
    totalVolume?: number;
    feeling?: 'none' | 'difficult' | 'okay' | 'great';
    prsAchieved?: any[]; // Simple for now
}

export interface InProgressWorkout {
    clientId: string;
    programId: string;
    loggedExercises: LoggedExercise[];
    loggedCardio?: LoggedCardio[];
    lastUpdated: string; // ISO string
}

export interface ProgressDataPoint {
    date: string;
    weight: number; // Stored in KG
}

export interface PersonalRecord {
    exerciseName: string;
    records: {
        weight: number; // Stored in KG
        reps: number;
        date: string;
        estimated1RM: number; // Stored in KG
    }[];
}