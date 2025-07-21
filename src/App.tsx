import React, { useState, useEffect, useCallback } from 'react';
import AdminView from './components/admin/AdminView';
import ClientView from './components/client/ClientView';
import ClientLogin from './components/auth/ClientLogin';
import TrainerLogin from './components/auth/TrainerLogin';
import SoloLogin from './components/auth/SoloLogin';
import SoloView from './components/solo/SoloView';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { UserRole, AuthState, AdminAuthState, SoloAuthState, WeightUnit, Theme } from './types';
import Button from './components/ui/Button';

// Feather icons for a clean look
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const CheeseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-white">
        <path d="M20.25 8.75a2.001 2.001 0 0 0-2.09-1.92L3.61 4.39A2 2 0 0 0 2 6.28v10.43a2 2 0 0 0 2 2h14.28a2 2 0 0 0 2-1.63l1.81-8.62a2 2 0 0 0-1.84-2.71Z"/>
        <circle cx="15" cy="12" r="1"/>
        <circle cx="10" cy="15" r="1"/>
        <circle cx="7" cy="10" r="1"/>
    </svg>
);


type View = 'role_selection' | 'client_login' | 'trainer_login' | 'solo_login';

const App: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState | null>(null);
    const [view, setView] = useState<View>('role_selection');
    const [isLoading, setIsLoading] = useState(true);
    const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
    
    const [unit, setUnit] = useState<WeightUnit>(() => (localStorage.getItem('fai_unit') as WeightUnit) || 'lbs');
    
    // Theme state
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        return savedTheme || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(isDark ? 'dark' : 'light');
    }, [theme]);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        localStorage.setItem('fai_unit', unit);
    }, [unit]);

    const loadInitialData = useCallback(() => {
        if (!localStorage.getItem('initialized')) {
            storageService.seedData();
        }
        storageService.updateInvoiceStatuses();
        
        const inviteCode = new URLSearchParams(window.location.search).get('invite_code');
        if (inviteCode) {
            setPreselectedClientId(inviteCode);
            setView('client_login');
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const savedAuth = authService.getAuthState();
        if (savedAuth) {
            setAuthState(savedAuth);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleLoginSuccess = (newAuthState: AuthState) => {
        setAuthState(newAuthState);
        authService.saveAuthState(newAuthState);
        setView('role_selection'); // Go back to a neutral state after login
    };
    
    const handleLogout = () => {
        authService.clearAuthState();
        setAuthState(null);
        setView('role_selection');
    };
    
    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
    }

    if (authState?.role === UserRole.Admin) {
        return <AdminView 
            onLogout={handleLogout} 
            authState={authState as AdminAuthState} 
            setAuthState={setAuthState} 
            unit={unit}
            onUnitToggle={setUnit}
            theme={theme}
            onThemeChange={handleThemeChange}
        />;
    }

    if (authState?.role === UserRole.Solo) {
        return <SoloView 
            onLogout={handleLogout} 
            authState={authState as SoloAuthState}
            setAuthState={setAuthState}
            unit={unit}
            onUnitToggle={setUnit}
            theme={theme}
            onThemeChange={handleThemeChange}
        />;
    }
    
    if (authState?.role === UserRole.Client && authState.clientId) {
        return <ClientView 
            clientId={authState.clientId} 
            onLogout={handleLogout}
            unit={unit}
            onUnitToggle={setUnit} 
            theme={theme}
            onThemeChange={handleThemeChange}
        />;
    }

    if (view === 'trainer_login') {
        return <TrainerLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('role_selection')} />;
    }

    if (view === 'solo_login') {
        return <SoloLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('role_selection')} />;
    }
    
    if (view === 'client_login') {
        return <ClientLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('role_selection')} preselectedClientId={preselectedClientId} />;
    }

    // Default view: Role Selection
    return (
        <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center text-white p-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-2">F/AI</h1>
                <p className="text-xl text-slate-300">Your Personal Training Companion</p>
            </div>
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-8">
                <Button onClick={() => setView('trainer_login')} className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-lg p-8 w-64 h-48 shadow-lg transform hover:scale-105">
                    <UsersIcon />
                    <span className="mt-4 text-2xl font-semibold">I'm a Trainer</span>
                </Button>
                <Button onClick={() => setView('solo_login')} className="flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600 transition-all duration-300 rounded-lg p-8 w-64 h-48 shadow-lg transform hover:scale-105">
                    <CheeseIcon />
                    <span className="mt-4 text-2xl font-semibold">Gym Rat</span>
                </Button>
                <Button onClick={() => setView('client_login')} className="flex flex-col items-center justify-center bg-teal-600 hover:bg-teal-700 transition-all duration-300 rounded-lg p-8 w-64 h-48 shadow-lg transform hover:scale-105">
                    <UserIcon />
                    <span className="mt-4 text-2xl font-semibold">I'm a Client</span>
                </Button>
            </div>
        </div>
    );
};

export default App;