
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { SubscriptionStatus, UserRole } from '../../types';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: () => void;
    onCancel: () => void;
    currentStatus: SubscriptionStatus;
    role?: UserRole;
}

const StarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-500 mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>);

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscribe, onCancel, currentStatus, role }) => {
    const [isSubscribing, setIsSubscribing] = useState(false);
    const isPro = currentStatus === 'pro';
    const title = isPro ? "Manage Your Pro Subscription" : "Upgrade to F/AI Pro";
    const proFeatures = [
        "Unlock AI-powered workout suggestions",
        "Personalized recommendations based on history",
        "Advanced progress analysis (coming soon!)",
        "Priority support"
    ];

    const handleSubscribeClick = () => {
        if (role === UserRole.Solo) {
            setIsSubscribing(true);
            setTimeout(() => {
                onSubscribe();
                setIsSubscribing(false);
            }, 2000); // Simulate network/payment processing delay
        } else {
            onSubscribe();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            {isPro ? (
                 <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <CheckIcon />
                    </div>
                    <p className="text-lg text-gray-700 mb-4">
                        You are currently subscribed to F/AI Pro.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        You can manage your subscription below.
                    </p>
                    <div className="flex flex-col space-y-3">
                        <Button onClick={onCancel} size="lg" variant="danger" className="w-full">
                            Cancel Subscription
                        </Button>
                         <Button variant="ghost" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            ) : isSubscribing ? (
                 <div className="text-center py-8">
                    <Spinner />
                    <p className="mt-4 text-slate-600 animate-pulse">Processing your subscription...</p>
                </div>
            ) : (
                <>
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <StarIcon />
                        </div>
                        <p className="text-lg text-gray-700 mb-4">
                            Supercharge your training with our most advanced features.
                        </p>
                    </div>
                    
                    <div className="mt-6 mb-8">
                        <h3 className="text-md font-semibold text-gray-800 text-center mb-3">Pro Benefits:</h3>
                        <ul className="space-y-2">
                            {proFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start">
                                    <CheckIcon />
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-center text-xs text-gray-500 mb-6">
                        This is a mock subscription for demonstration purposes. No payment is required.
                    </p>

                    <div className="flex flex-col space-y-3">
                        <Button onClick={handleSubscribeClick} size="lg" className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500">
                            Subscribe Now
                        </Button>
                         <Button variant="ghost" onClick={onClose} className="w-full">
                            Maybe Later
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default SubscriptionModal;