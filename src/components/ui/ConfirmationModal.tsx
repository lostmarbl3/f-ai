
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onDecline: () => void;
    title: string;
    children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, onDecline, title, children }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-slate-600 mb-6">
                {children}
            </div>
            <div className="flex justify-end space-x-4">
                <Button variant="secondary" onClick={onDecline}>
                    No
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    Yes
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;