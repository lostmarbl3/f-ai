import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import WeightConverter from './WeightConverter';
import PaceCalculator from './PaceCalculator';
import Select from '../ui/Select';
import { Theme } from '../../types';

interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

type ToolTab = 'weight' | 'pace' | 'appearance';

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, theme, onThemeChange }) => {
    const [activeTab, setActiveTab] = useState<ToolTab>('weight');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tools">
            <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('weight')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'weight' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                    >
                        Weight Converter
                    </button>
                    <button
                        onClick={() => setActiveTab('pace')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pace' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                    >
                        Pace Calculator
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                    >
                        Appearance
                    </button>
                </nav>
            </div>
            
            <div className="mt-6 min-h-[220px]">
                {activeTab === 'weight' && <WeightConverter />}
                {activeTab === 'pace' && <PaceCalculator />}
                {activeTab === 'appearance' && (
                     <div>
                        <Select label="Appearance" value={theme} onChange={(e) => onThemeChange(e.target.value as Theme)}>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </Select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">"System" will match your device's current theme setting.</p>
                    </div>
                )}
            </div>

             <div className="mt-6 text-right">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};

export default ToolsModal;
