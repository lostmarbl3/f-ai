

import { Client, WorkoutProgram, SubscriptionPlan, Notification } from './types';
import { v4 as uuidv4 } from 'uuid';

export const TRAINER_CLIENT_ID = 'trainer-profile-id';
export const SOLO_USER_CLIENT_ID = 'solo-user-client-id';

// NOTE: Initial client data is now minimal. 
// The trainer is expected to add their own clients.
export const CLIENTS: Client[] = [
    { id: TRAINER_CLIENT_ID, name: 'Me', assignedProgramIds: ['program-1'], notes: 'My personal training profile.', status: 'active', userHandle: uuidv4() },
];

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
    {
        id: 'program-1',
        name: 'Full Body Strength A',
        description: 'A balanced workout targeting all major muscle groups.',
        programNotes: 'Focus on controlling the weight on the way down for every exercise. Form over everything this week!',
        warmup: [
             { id: uuidv4(), name: 'Jumping Jacks', sets: 1, reps: '60s', rest: '30s' },
             { id: uuidv4(), name: 'Cat-Cow Stretch', sets: 1, reps: '10', rest: '0s' },
        ],
        exercises: [
            { id: uuidv4(), name: 'Barbell Squat', sets: 4, reps: '5-8', rest: '90s', videoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8', cues: 'Keep your chest up and back straight. Drive through your heels.', prescribedWeight: '135lbs', prescribedRpe: '7-8' },
            { id: uuidv4(), name: 'Bench Press', sets: 4, reps: '5-8', rest: '90s', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', cues: 'Tuck your elbows slightly, don\'t let them flare out to 90 degrees.', prescribedWeight: '185lbs', prescribedRpe: '8' },
            { id: uuidv4(), name: 'Barbell Row', sets: 3, reps: '8-12', rest: '60s', videoUrl: 'https://www.youtube.com/watch?v=RQU8wZPbioA' },
            { id: uuidv4(), name: 'Overhead Press', sets: 3, reps: '8-12', rest: '60s' },
        ],
        cardio: [
            { id: uuidv4(), activity: 'Treadmill Run', goalType: 'time', goalValue: 15, intensity: 'moderate' }
        ],
        cooldown: [
            { id: uuidv4(), name: 'Quad Stretch', sets: 1, reps: '30s each side', rest: '0s' },
            { id: uuidv4(), name: 'Pigeon Pose', sets: 1, reps: '30s each side', rest: '0s' },
        ]
    },
    {
        id: 'program-2',
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training to maximize calorie burn.',
        exercises: [
            { id: uuidv4(), name: 'Burpees', sets: 5, reps: '45s work', rest: '15s' },
            { id: uuidv4(), name: 'High Knees', sets: 5, reps: '45s work', rest: '15s' },
            { id: uuidv4(), name: 'Jumping Jacks', sets: 5, reps: '45s work', rest: '15s' },
            { id: uuidv4(), name: 'Mountain Climbers', sets: 5, reps: '45s work', rest: '15s' },
        ],
    },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    { id: 'plan-1', name: 'Weekly Coaching', amount: 75, interval: 'week'},
    { id: 'plan-2', name: 'Monthly Standard', amount: 250, interval: 'month'},
    { id: 'plan-3', name: 'Monthly Premium', amount: 400, interval: 'month'},
];

export const NOTIFICATIONS: Notification[] = [
    {
        id: uuidv4(),
        title: 'New Feature: Submit Feedback!',
        body: "Testers, you can now submit feedback or report bugs directly from the app! Just open the Tools modal (wrench icon) and use the new 'Feedback' tab.",
        read: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: uuidv4(),
        title: 'Welcome to FitTrack AI!',
        body: "We're excited to have you. Explore the dashboard to manage clients, build workout programs, and track progress.",
        read: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    }
];
