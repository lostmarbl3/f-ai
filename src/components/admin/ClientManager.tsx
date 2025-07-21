import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Client, WorkoutProgram, LoggedWorkout, AIAssistSuggestion } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService, isApiKeySet } from '../../services/geminiService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

interface ClientManagerProps {
    clients: Client[];
    programs: WorkoutProgram[];
    loggedWorkouts: LoggedWorkout[];
    onUpdate: () => void;
    isPro: boolean;
    onPromptUpgrade: () => void;
}

const WandIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M15 4V2m0 14v-2m-7.5-1.5L6 13l-1.5 1.5M19.5 19.5L18 18l-1.5 1.5m-12-6.4L4.5 10.1M4 2v2m16 0v2m-3.9 11.5L15 14l1.5-1.5m-6.4 12l1.5-1.5L10.1 18M10 4V2m0 14v-2M4.5 4.5L6 6l1.5-1.5M18 6l1.5-1.5L21 6m-12 12l-1.5 1.5L6 21"></path></svg>);
const StarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>);


type ClientViewTab = 'active' | 'suspended';

const ClientManager: React.FC<ClientManagerProps> = ({ clients, programs, loggedWorkouts, onUpdate, isPro, onPromptUpgrade }) => {
    const [newClientName, setNewClientName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [assignedPrograms, setAssignedPrograms] = useState<string[]>([]);
    const [editingNotes, setEditingNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AIAssistSuggestion[]>([]);
    const [viewTab, setViewTab] = useState<ClientViewTab>('active');
    const [copyButtonText, setCopyButtonText] = useState('Copy Link');

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (newClientName.trim()) {
            const newClient: Client = {
                id: uuidv4(),
                name: newClientName.trim(),
                assignedProgramIds: [],
                notes: '',
                status: 'active',
                userHandle: uuidv4(), // Assign a stable handle for passkeys
            };
            const allClients = storageService.getClients();
            storageService.saveClients([...allClients, newClient]);
            setNewClientName('');
            onUpdate();
        }
    };
    
    const openManageModal = (client: Client) => {
        setSelectedClient(client);
        setAssignedPrograms(client.assignedProgramIds);
        setEditingNotes(client.notes || '');
        setAiSuggestions([]); // Clear previous suggestions
        setCopyButtonText('Copy Link'); // Reset copy button text
        setIsModalOpen(true);
    };
    
    const updateClientStatus = (clientId: string, status: 'active' | 'suspended') => {
        const allClients = storageService.getClients();
        const updatedClients = allClients.map(c => c.id === clientId ? {...c, status} : c);
        storageService.saveClients(updatedClients);
        onUpdate();
    }

    const handleGetSuggestions = async () => {
        if (!selectedClient) return;
        setIsGenerating(true);
        setAiSuggestions([]);
        const clientPrograms = programs.filter(p => selectedClient.assignedProgramIds.includes(p.id));
        const clientHistory = loggedWorkouts.filter(w => w.clientId === selectedClient.id);
        const suggestions = await geminiService.getAgenticSuggestions(selectedClient, clientPrograms, clientHistory);
        if (suggestions) {
            setAiSuggestions(suggestions);
        } else {
            alert("Could not get AI suggestions at this time. Please try again later.");
        }
        setIsGenerating(false);
    };

    const handleAssignAISuggestion = (suggestion: AIAssistSuggestion) => {
        const newProgram: WorkoutProgram = {
            id: uuidv4(),
            name: suggestion.name || 'AI Generated Program',
            description: suggestion.description || '',
            exercises: suggestion.exercises?.map(e => ({ ...e, id: uuidv4(), videoUrl: '' })) || [],
            scope: 'client',
        };
        const updatedPrograms = [...storageService.getPrograms(), newProgram];
        storageService.savePrograms(updatedPrograms);
        
        if (selectedClient) {
            const updatedAssignedPrograms = [...assignedPrograms, newProgram.id];
            setAssignedPrograms(updatedAssignedPrograms);

            const updatedClient = { ...selectedClient, assignedProgramIds: updatedAssignedPrograms };
            const allClients = storageService.getClients();
            const updatedClients = allClients.map(c => c.id === selectedClient.id ? updatedClient : c);
            storageService.saveClients(updatedClients);
            onUpdate();
        }
        alert(`Program "${newProgram.name}" created and assigned!`);
    };
    
    const handleProgramToggle = (programId: string) => {
        setAssignedPrograms(prev => 
            prev.includes(programId) 
                ? prev.filter(id => id !== programId)
                : [...prev, programId]
        );
    };
    
    const handleSaveChanges = () => {
        if (selectedClient) {
            const updatedClient = { 
                ...selectedClient, 
                assignedProgramIds: assignedPrograms,
                notes: editingNotes 
            };
            const allClients = storageService.getClients();
            const updatedClients = allClients.map(c => c.id === selectedClient.id ? updatedClient : c);
            storageService.saveClients(updatedClients);
            onUpdate();
            setIsModalOpen(false);
            setSelectedClient(null);
        }
    };

    const handleCopyInviteLink = () => {
        if (!selectedClient) return;
        const inviteLink = `${window.location.origin}${window.location.pathname}?invite_code=${selectedClient.id}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Link'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy link.');
        });
    };

    const activeClients = clients.filter(c => c.status === 'active');
    const suspendedClients = clients.filter(c => c.status === 'suspended');
    const clientsToShow = viewTab === 'active' ? activeClients : suspendedClients;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Clients</h2>
                    <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setViewTab('active')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                Active ({activeClients.length})
                            </button>
                            <button onClick={() => setViewTab('suspended')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewTab === 'suspended' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                Suspended ({suspendedClients.length})
                            </button>
                        </nav>
                    </div>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {clientsToShow.map(client => (
                            <div key={client.id} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{client.assignedProgramIds.length} programs assigned</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button size="sm" onClick={() => openManageModal(client)}>Manage</Button>
                                        {viewTab === 'active' ? (
                                            <Button size="sm" variant="secondary" onClick={() => updateClientStatus(client.id, 'suspended')}>Suspend</Button>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => updateClientStatus(client.id, 'active')}>Reactivate</Button>
                                        )}
                                    </div>
                                </div>
                                {client.notes && (
                                    <div className="mt-3 text-sm text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border-l-4 border-amber-400 dark:border-amber-500 p-3 rounded-r-lg">
                                        <p className="font-medium">Notes:</p>
                                        <p className="whitespace-pre-wrap">{client.notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                         {clientsToShow.length === 0 && <p className="text-slate-500 dark:text-slate-400">No {viewTab} clients.</p>}
                    </div>
                </Card>
            </div>
            <div>
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Add New Client</h2>
                    <form onSubmit={handleAddClient} className="space-y-4">
                        <Input
                            label="Client Name"
                            id="client-name"
                            value={newClientName}
                            onChange={e => setNewClientName(e.target.value)}
                            placeholder="e.g., Jane Doe"
                            required
                        />
                        <Button type="submit" className="w-full">Add Client</Button>
                    </form>
                </Card>
            </div>
            
            <Modal title={`Manage ${selectedClient?.name}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <div className="mt-6 pt-4 border-t dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Invite Client</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Share this unique link with your client to have them log in and set up their passkey.</p>
                        <div className="flex gap-2">
                            <Input readOnly value={`${window.location.origin}${window.location.pathname}?invite_code=${selectedClient?.id}`} />
                            <Button variant="secondary" onClick={handleCopyInviteLink} className="flex-shrink-0"><CopyIcon/> {copyButtonText}</Button>
                        </div>
                    </div>
                    <div className="space-y-4 mt-6 pt-4 border-t dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Assign Programs</h3>
                        <div className="max-h-40 overflow-y-auto pr-2">
                            {programs.map(program => (
                                <div key={program.id} className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id={`program-${program.id}`}
                                        className="h-4 w-4 text-primary bg-slate-200 border-slate-300 rounded focus:ring-primary"
                                        checked={assignedPrograms.includes(program.id)}
                                        onChange={() => handleProgramToggle(program.id)}
                                    />
                                    <label htmlFor={`program-${program.id}`} className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">{program.name}</label>
                                </div>
                            ))}
                        </div>
                        {programs.length === 0 && <p className="text-slate-500 dark:text-slate-400">No workout programs exist. Create one in the 'Workouts' tab.</p>}
                    </div>

                    <div className="mt-6">
                        <label htmlFor="client-notes" className="block text-lg font-medium text-slate-900 dark:text-white">Private Notes</label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">These notes are only visible to you.</p>
                        <textarea
                            id="client-notes"
                            rows={5}
                            className="block w-full mt-1 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="e.g., Prefers morning workouts, has a slight knee issue..."
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">AI Suggestions (Pro Feature)</h3>
                        {!isPro ? (
                            <div className="text-center p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <p className="text-slate-600 dark:text-slate-300 mb-4">Upgrade to Pro to get personalized workout suggestions for this client.</p>
                                <Button onClick={onPromptUpgrade} variant="accent">
                                    <StarIcon />
                                    Upgrade to Pro
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <Button
                                    onClick={handleGetSuggestions}
                                    disabled={isGenerating || !isApiKeySet}
                                    title={!isApiKeySet ? "AI features are currently unavailable." : "Get AI workout suggestions"}
                                >
                                    {isGenerating ? <Spinner/> : <WandIcon />}
                                    {isGenerating ? 'Analyzing...' : 'Get Suggestions'}
                                </Button>
                                {isGenerating && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The AI is analyzing the client's data. This may take a moment...</p>}
                                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {aiSuggestions.map((s, i) => (
                                        <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <p className="font-bold text-blue-800 dark:text-blue-300">{s.name}</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-400 italic">"{s.reasoning}"</p>
                                            <Button size="sm" className="mt-2" onClick={() => handleAssignAISuggestion(s)}>Create & Assign</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                     <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                     <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
            </Modal>
        </div>
    );
};

export default ClientManager;
