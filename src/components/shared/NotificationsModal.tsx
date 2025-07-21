import React from 'react';
import { Notification } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
}

const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
            <div className="max-h-[60vh] overflow-y-auto -mr-6 pr-6">
                {notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => (
                            <div key={n.id} className={`p-4 rounded-lg relative ${n.read ? 'bg-slate-50 dark:bg-slate-700/50' : 'bg-primary-50 dark:bg-primary/20'}`}>
                                {!n.read && <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary"></span>}
                                <h3 className="font-semibold text-slate-800 dark:text-white text-md">{n.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{n.body}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{timeSince(n.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">You have no notifications.</p>
                )}
            </div>
            <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};

export default NotificationsModal;