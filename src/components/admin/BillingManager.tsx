import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../../services/storageService';
import { Client, Invoice, TrainerSettings, SubscriptionPlan, ClientSubscription } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface BillingManagerProps {
    clients: Client[];
    stripeConnected: boolean;
    onStripeConnect: () => void;
}

const daysOverdue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    if (today <= due) return 0;
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
};

type BillingTab = 'invoices' | 'subscriptions' | 'reports';

const BillingManager: React.FC<BillingManagerProps> = ({ clients, stripeConnected, onStripeConnect }) => {
    const [activeTab, setActiveTab] = useState<BillingTab>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [trainerSettings, setTrainerSettings] = useState<TrainerSettings>({ lockoutThresholdDays: 7 });
    
    // State for new items
    const [newInvoice, setNewInvoice] = useState({ clientId: '', amount: 0, description: '' });
    const [newPlan, setNewPlan] = useState<Omit<SubscriptionPlan, 'id'>>({ name: '', amount: 0, interval: 'month' });
    const [newSubscription, setNewSubscription] = useState({ clientId: '', planId: '' });
    
    // State for reports
    const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });

    const activeClients = clients.filter(c => c.status === 'active');

    const refreshData = () => {
        setInvoices(storageService.getInvoices());
        setPlans(storageService.getSubscriptionPlans());
        setSubscriptions(storageService.getClientSubscriptions());
        setTrainerSettings(storageService.getTrainerSettings());
    };
    
    const setDateRangeForPreset = (preset: 'this_quarter' | 'last_quarter' | 'this_year') => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case 'this_quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
                break;
            case 'last_quarter':
                const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
                if (lastQuarter < 0) {
                    start = new Date(today.getFullYear() - 1, 9, 1);
                    end = new Date(today.getFullYear() - 1, 11, 31);
                } else {
                    start = new Date(today.getFullYear(), lastQuarter * 3, 1);
                    end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
                }
                break;
            case 'this_year':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
        }
        
        setReportDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    useEffect(() => {
        refreshData();
        if (activeClients.length > 0) {
            setNewInvoice(prev => ({ ...prev, clientId: activeClients[0]?.id || '' }));
            setNewSubscription(prev => ({ ...prev, clientId: activeClients[0]?.id || '' }));
        }
        const savedPlans = storageService.getSubscriptionPlans();
        if (savedPlans.length > 0) {
            setNewSubscription(prev => ({ ...prev, planId: savedPlans[0]?.id || '' }));
        }
        setDateRangeForPreset('this_quarter'); // Default report view
    }, [clients]);

    // Handlers
    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients.find(c => c.id === newInvoice.clientId);
        if (!client || !newInvoice.description || newInvoice.amount <= 0) {
            alert("Please fill out all fields correctly."); return;
        }
        const invoice: Invoice = {
            id: uuidv4(), clientId: client.id, clientName: client.name,
            amount: newInvoice.amount, description: newInvoice.description, status: 'draft',
            issueDate: new Date().toISOString(), dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
        };
        storageService.saveInvoices([...invoices, invoice]);
        refreshData(); setIsInvoiceModalOpen(false);
        setNewInvoice({ clientId: activeClients[0]?.id || '', amount: 0, description: '' });
    };

    const handleSendInvoice = (invoiceId: string) => {
        const updatedInvoices = invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv);
        storageService.saveInvoices(updatedInvoices); refreshData();
    };

    const handleSendReminder = (invoice: Invoice) => alert(`Reminder sent to ${invoice.clientName}.`);

    const handleSaveSettings = () => {
        storageService.saveTrainerSettings(trainerSettings); setIsSettingsModalOpen(false);
    };

    const handleSavePlan = (e: React.FormEvent) => {
        e.preventDefault();
        const plan: SubscriptionPlan = { ...newPlan, id: uuidv4() };
        storageService.saveSubscriptionPlans([...plans, plan]);
        refreshData(); setIsPlanModalOpen(false); setNewPlan({ name: '', amount: 0, interval: 'month' });
    };

    const handleCreateSubscription = (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients.find(c => c.id === newSubscription.clientId);
        const plan = plans.find(p => p.id === newSubscription.planId);
        if (!client || !plan) { alert("Please select a valid client and plan."); return; }
        const subscription: ClientSubscription = {
            id: uuidv4(), clientId: client.id, planId: plan.id, status: 'active', startDate: new Date().toISOString(),
        };
        storageService.saveClientSubscriptions([...subscriptions, subscription]);
        const firstInvoice: Invoice = {
            id: uuidv4(), clientId: client.id, clientName: client.name, amount: plan.amount,
            description: `Subscription: ${plan.name}`, status: 'sent', issueDate: new Date().toISOString(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        }
        storageService.saveInvoices([...storageService.getInvoices(), firstInvoice]);
        refreshData(); setIsSubModalOpen(false);
    };
    
    const handleExport = () => {
        const filtered = invoices.filter(inv => {
            const paidDate = inv.paidDate ? new Date(inv.paidDate) : null;
            const startDate = new Date(reportDateRange.start);
            const endDate = new Date(reportDateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include full end day
            return inv.status === 'paid' && paidDate && paidDate >= startDate && paidDate <= endDate;
        });
        
        if (filtered.length === 0) {
            alert('No paid invoices in the selected date range to export.'); return;
        }

        const headers = ['Invoice ID', 'Client Name', 'Description', 'Date Paid', 'Amount'];
        const rows = filtered.map(inv => [
            inv.id, inv.clientName, `"${inv.description.replace(/"/g, '""')}"`,
            inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : '',
            inv.amount.toFixed(2)
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_report_${reportDateRange.start}_to_${reportDateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // UI Components & Render Logic
    const getStatusChip = (status: Invoice['status']) => {
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full inline-block';
        const statusClasses: Record<Invoice['status'], string> = {
            draft: 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200', 
            sent: 'bg-primary-100 text-primary-dark dark:bg-primary/20 dark:text-primary-light',
            paid: 'bg-success-100 text-success dark:bg-success/20 dark:text-green-400', 
            overdue: 'bg-danger-100 text-danger dark:bg-danger/20 dark:text-red-400',
        };
        return <span className={`${baseClasses} ${statusClasses[status]}`}>{status.toUpperCase()}</span>;
    };
    
    const renderInvoicesTab = () => (
         <div>
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Invoice History</h3><Button onClick={() => setIsInvoiceModalOpen(true)}>Create One-Time Invoice</Button></div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"><thead className="bg-slate-50 dark:bg-slate-700"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Client</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">{invoices.length > 0 ? invoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).map(inv => (<tr key={inv.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{inv.clientName}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(inv.issueDate).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{inv.description}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${inv.amount.toFixed(2)}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusChip(inv.status)}{inv.status === 'overdue' && <span className="block text-xs text-danger mt-1">{daysOverdue(inv.dueDate)} days overdue</span>}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">{inv.status === 'draft' && <Button size="sm" onClick={() => handleSendInvoice(inv.id)}>Send</Button>}{inv.status === 'overdue' && <Button size="sm" variant="secondary" onClick={() => handleSendReminder(inv)}>Send Reminder</Button>}</td></tr>)) : (<tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">No invoices created.</td></tr>)}</tbody></table></div>
        </div>
    );
    
    const renderSubscriptionsTab = () => (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Your Subscription Plans</h3><Button size="sm" onClick={() => setIsPlanModalOpen(true)}>New Plan</Button></div><div className="space-y-3">{plans.map(plan => (<div key={plan.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><p className="font-medium text-slate-900 dark:text-white">{plan.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">${plan.amount.toFixed(2)} / {plan.interval}</p></div>))}{plans.length === 0 && <p className="text-slate-500 dark:text-slate-400">No subscription plans created yet.</p>}</div></div><div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Active Client Subscriptions</h3><Button size="sm" onClick={() => setIsSubModalOpen(true)} disabled={plans.length === 0}>New Subscription</Button></div><div className="space-y-3">{subscriptions.map(sub => {const client = clients.find(c => c.id === sub.clientId); const plan = plans.find(p => p.id === sub.planId); return (<div key={sub.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><p className="font-medium text-slate-900 dark:text-white">{client?.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{plan?.name} (${plan?.amount.toFixed(2)} / {plan?.interval})</p><p className="text-xs text-slate-400">Started: {new Date(sub.startDate).toLocaleDateString()}</p></div>)})}{subscriptions.length === 0 && <p className="text-slate-500 dark:text-slate-400">No active client subscriptions.</p>}</div></div></div>
    );

    const renderReportsTab = () => {
        const filteredInvoices = invoices.filter(inv => {
            const paidDate = inv.paidDate ? new Date(inv.paidDate) : null;
            if (!paidDate || !reportDateRange.start || !reportDateRange.end) return false;
            const startDate = new Date(reportDateRange.start);
            const endDate = new Date(reportDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            return inv.status === 'paid' && paidDate >= startDate && paidDate <= endDate;
        });

        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const revenueByClient = filteredInvoices.reduce((acc, inv) => {
            acc[inv.clientName] = (acc[inv.clientName] || 0) + inv.amount;
            return acc;
        }, {} as Record<string, number>);

        return (
            <div>
                 <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                     <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Financial Reports</h3>
                     <div className="flex items-center gap-2">
                        <Input type="date" value={reportDateRange.start} onChange={e => setReportDateRange(prev => ({...prev, start: e.target.value}))} />
                        <span className="dark:text-slate-300">to</span>
                        <Input type="date" value={reportDateRange.end} onChange={e => setReportDateRange(prev => ({...prev, end: e.target.value}))} />
                     </div>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDateRangeForPreset('this_quarter')}>This Quarter</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDateRangeForPreset('last_quarter')}>Last Quarter</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDateRangeForPreset('this_year')}>This Year</Button>
                     </div>
                     <Button onClick={handleExport} disabled={filteredInvoices.length === 0}>Export to CSV</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</h4><p className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toFixed(2)}</p></div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid Invoices</h4><p className="text-2xl font-bold text-slate-900 dark:text-white">{filteredInvoices.length}</p></div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Revenue/Invoice</h4><p className="text-2xl font-bold text-slate-900 dark:text-white">${(totalRevenue / (filteredInvoices.length || 1)).toFixed(2)}</p></div>
                </div>
                 
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Client</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Revenue</th></tr></thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">{Object.entries(revenueByClient).sort(([,a], [,b]) => b - a).map(([name, amount]) => (<tr key={name}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${amount.toFixed(2)}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )
    };
    
    if (!stripeConnected) {
        return <Card className="text-center"><h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Set Up Billing</h2><p className="text-slate-600 dark:text-slate-400 mb-6">Connect your Stripe account to manage client invoices and get paid directly.</p><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">(This is a simulation. No real connection will be made.)</p><Button onClick={onStripeConnect} size="lg">Connect with Stripe</Button></Card>
    }
    
    return (
        <div>
            <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Billing</h2><Button variant="secondary" onClick={() => setIsSettingsModalOpen(true)}>Settings</Button></div>
                <div className="border-b border-slate-200 dark:border-slate-700 mb-6"><nav className="-mb-px flex space-x-4" aria-label="Tabs"><button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>Invoices</button><button onClick={() => setActiveTab('subscriptions')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscriptions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>Subscriptions</button><button onClick={() => setActiveTab('reports')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>Reports</button></nav></div>
                {activeTab === 'invoices' && renderInvoicesTab()}
                {activeTab === 'subscriptions' && renderSubscriptionsTab()}
                {activeTab === 'reports' && renderReportsTab()}
            </Card>

            <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Create One-Time Invoice"><form onSubmit={handleCreateInvoice} className="space-y-4"><Select label="Client" value={newInvoice.clientId} onChange={(e) => setNewInvoice(prev => ({ ...prev, clientId: e.target.value }))} required>{activeClients.length > 0 ? activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option disabled>No active clients</option>}</Select><Input label="Amount ($)" type="number" step="0.01" value={newInvoice.amount} onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required/><Input label="Description" value={newInvoice.description} onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g., 4 Personal Training Sessions" required/><div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button><Button type="submit">Create Draft</Button></div></form></Modal>
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Billing Settings"><div className="space-y-4"><Input label="Client Lockout Threshold (Days)" type="number" value={trainerSettings.lockoutThresholdDays} onChange={(e) => setTrainerSettings(prev => ({ ...prev, lockoutThresholdDays: parseInt(e.target.value, 10) || 0 }))}/><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automatically restrict client app access if an invoice is this many days past due.</p><div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveSettings}>Save Settings</Button></div></div></Modal>
            <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Create Subscription Plan"><form onSubmit={handleSavePlan} className="space-y-4"><Input label="Plan Name" placeholder="e.g., Gold Monthly Package" value={newPlan.name} onChange={(e) => setNewPlan(prev => ({...prev, name: e.target.value}))} required /><Input label="Amount ($)" type="number" step="0.01" value={newPlan.amount} onChange={(e) => setNewPlan(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))} required /><Select label="Billing Interval" value={newPlan.interval} onChange={(e) => setNewPlan(prev => ({...prev, interval: e.target.value as 'week' | 'month' | 'year'}))}><option value="week">Weekly</option><option value="month">Monthly</option><option value="year">Yearly</option></Select><div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button><Button type="submit">Save Plan</Button></div></form></Modal>
            <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Create New Client Subscription"><form onSubmit={handleCreateSubscription} className="space-y-4"><Select label="Client" value={newSubscription.clientId} onChange={(e) => setNewSubscription(prev => ({ ...prev, clientId: e.target.value }))} required>{activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Select label="Subscription Plan" value={newSubscription.planId} onChange={(e) => setNewSubscription(prev => ({...prev, planId: e.target.value}))} required>{plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.amount}/{p.interval})</option>)}</Select><p className="text-xs text-slate-500 dark:text-slate-400">This will start the subscription and create the first invoice automatically.</p><div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsSubModalOpen(false)}>Cancel</Button><Button type="submit">Start Subscription</Button></div></form></Modal>
        </div>
    );
};

export default BillingManager;