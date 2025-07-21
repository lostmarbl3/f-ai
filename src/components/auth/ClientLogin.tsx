import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Client, AuthState } from '../../types';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { TRAINER_CLIENT_ID, SOLO_USER_CLIENT_ID } from '../../constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface ClientLoginProps {
    onLoginSuccess: (authState: AuthState) => void;
    onBack: () => void;
    preselectedClientId?: string | null;
}

const ClientLogin: React.FC<ClientLoginProps> = ({ onLoginSuccess, onBack, preselectedClientId }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const allClients = storageService.getClients();
        let clientsNeedUpdate = false;
        
        const migratedClients = allClients.map(c => {
            if (!c.userHandle) {
                clientsNeedUpdate = true;
                return { ...c, userHandle: uuidv4() };
            }
            return c;
        });

        if (clientsNeedUpdate) {
            storageService.saveClients(migratedClients);
        }

        const activeClients = migratedClients.filter(c => c.status === 'active' && c.id !== TRAINER_CLIENT_ID && c.id !== SOLO_USER_CLIENT_ID);
        
        setClients(activeClients);
        if (preselectedClientId && activeClients.some(c => c.id === preselectedClientId)) {
            setSelectedClientId(preselectedClientId);
        } else if (activeClients.length > 0) {
            setSelectedClientId(activeClients[0].id);
        }
        setIsLoading(false);
    }, [preselectedClientId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId) return;
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            const client = clients.find(c => c.id === selectedClientId);
            if (!client) throw new Error("Selected client not found.");

            const isRegistered = authService.isClientRegistered(client);
            if (!isRegistered) {
                if (window.confirm("This is your first time logging in. You'll need to create a secure passkey to protect your account. Continue?")) {
                    await authService.registerClientPasskey(client.id);
                    onLoginSuccess(authService.loginClient(client.id));
                } else { setIsAuthenticating(false); }
            } else {
                const success = await authService.authenticateClient(client.id);
                if (success) {
                    onLoginSuccess(authService.loginClient(client.id));
                } else { throw new Error("Authentication failed or was cancelled."); }
            }
        } catch (error: any) {
            console.error("Client authentication error:", error);
            setAuthError(error.message || "An unknown authentication error occurred.");
            setIsAuthenticating(false);
        }
    };

    const handleResetPasskey = async () => {
        if (!selectedClientId) return;
        if (window.confirm("Are you sure you want to reset your passkey? This is useful if you're on a new device or your old key isn't working.")) {
            setIsAuthenticating(true);
            setAuthError(null);
            try {
                await authService.resetAndRegisterClientPasskey(selectedClientId);
                
                const success = await authService.authenticateClient(selectedClientId);
                 if (success) {
                    onLoginSuccess(authService.loginClient(selectedClientId));
                } else { throw new Error("Authentication failed after reset. Please try logging in again."); }
            } catch (error: any) {
                console.error("Client passkey reset error:", error);
                setAuthError(error.message || "Could not reset passkey.");
                setIsAuthenticating(false);
            }
        }
    };
    
    if (isLoading) {
        return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4"><Spinner /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Card>
                    <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white mb-2">Client Login</h2>
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-8">Select your profile and log in securely.</p>
                    {isAuthenticating ? (
                        <div className="flex flex-col items-center my-8"><Spinner /><p className="mt-4 text-slate-600 dark:text-slate-400">Waiting for passkey...</p></div>
                    ) : (
                        <>
                            {clients.length > 0 ? (
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div>
                                        <label htmlFor="client-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                                        <select
                                            id="client-select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                                            {clients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>))}
                                        </select>
                                    </div>
                                    {authError && <p className="text-sm text-danger bg-danger-50 dark:bg-danger/20 p-3 rounded-md">{authError}</p>}
                                    <Button type="submit" className="w-full">Login with Passkey</Button>
                                    <div className="text-center">
                                        <Button variant="ghost" size="sm" type="button" onClick={handleResetPasskey}>Passkey not working? Reset it.</Button>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400">No active client profiles found.</p>
                            )}
                        </>
                    )}
                     <div className="mt-6 text-center"><Button variant="ghost" onClick={onBack}>&larr; Back to Role Selection</Button></div>
                </Card>
            </div>
        </div>
    );
};

export default ClientLogin;
