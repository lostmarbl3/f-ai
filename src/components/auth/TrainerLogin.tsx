import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { AuthState } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface TrainerLoginProps {
    onLoginSuccess: (authState: AuthState) => void;
    onBack: () => void;
}

const TrainerLogin: React.FC<TrainerLoginProps> = ({ onLoginSuccess, onBack }) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const handleLogin = async () => {
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            if (!await authService.isTrainerRegistered()) {
                if (window.confirm("No trainer passkey found. Would you like to create one now?")) {
                    await authService.registerTrainerPasskey();
                } else {
                    setIsAuthenticating(false); return;
                }
            }
            const success = await authService.authenticateTrainer();
            if (success) {
                onLoginSuccess(authService.loginTrainer());
            } else {
                throw new Error("Authentication failed or was cancelled.");
            }
        } catch (err: any) {
            console.error("Trainer authentication error:", err);
            setAuthError(err.message || "An unknown error occurred.");
            setIsAuthenticating(false);
        }
    };
    
    const handleResetPasskey = async () => {
        if (window.confirm("Are you sure you want to reset your trainer passkey? This will create a new one for this device.")) {
            setIsAuthenticating(true);
            setAuthError(null);
            try {
                await authService.resetAndRegisterTrainerPasskey();
                
                 const success = await authService.authenticateTrainer();
                 if (success) {
                    onLoginSuccess(authService.loginTrainer());
                } else { throw new Error("Authentication failed after reset. Please try logging in again."); }

            } catch (err: any) {
                 console.error("Reset and login error for trainer:", err);
                 setAuthError("Could not reset passkey. Please try again.");
                 setIsAuthenticating(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Card>
                    <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white mb-2">Trainer Login</h2>
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-8">Log in securely with your passkey.</p>
                    
                    {isAuthenticating ? (
                        <div className="flex flex-col items-center my-8">
                            <Spinner />
                            <p className="mt-4 text-slate-600 dark:text-slate-400">Waiting for passkey...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {authError && <p className="text-sm text-danger bg-danger-50 dark:bg-danger/20 p-3 rounded-md">{authError}</p>}
                            <Button onClick={handleLogin} className="w-full">Login with Passkey</Button>
                            <div className="text-center">
                                <Button variant="ghost" size="sm" type="button" onClick={handleResetPasskey}>
                                    Passkey not working? Reset it.
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 text-center">
                        <Button variant="ghost" onClick={onBack}>
                            &larr; Back to Role Selection
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TrainerLogin;
