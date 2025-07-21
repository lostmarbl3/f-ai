import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { Invoice, ClientSubscription, SubscriptionPlan } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface ClientBillingProps {
    clientId: string;
    onPayment?: () => void;
}

const ClientBilling: React.FC<ClientBillingProps> = ({ clientId, onPayment }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const allInvoices = storageService.getInvoices();
        const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId && inv.status !== 'draft');
        setInvoices(clientInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));

        const allSubs = storageService.getClientSubscriptions();
        setSubscriptions(allSubs.filter(sub => sub.clientId === clientId));
        setPlans(storageService.getSubscriptionPlans());

    }, [clientId]);

    const openPayModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPayModalOpen(true);
    };

    const handleSimulatedPayment = () => {
        if (!selectedInvoice) return;
        const allInvoices = storageService.getInvoices();
        const updatedInvoices = allInvoices.map(inv => 
            inv.id === selectedInvoice.id ? { ...inv, status: 'paid' as const, paidDate: new Date().toISOString() } : inv
        );
        storageService.saveInvoices(updatedInvoices);
        setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'paid' as const } : inv));
        setIsPayModalOpen(false);
        setSelectedInvoice(null);
        if(onPayment) {
            onPayment();
        }
    };

    const openInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

    const filteredPaidInvoices = paidInvoices.filter(inv =>
        inv.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Open Invoices</h2>
                {openInvoices.length > 0 ? (
                    <div className="space-y-4">
                        {openInvoices.map(inv => (
                             <div key={inv.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                                 <div>
                                     <p className="font-medium text-slate-900 dark:text-white">{inv.description}</p>
                                     <p className="text-sm text-slate-500 dark:text-slate-400">
                                         Issued: {new Date(inv.issueDate).toLocaleDateString()} | Due: {new Date(inv.dueDate).toLocaleDateString()}
                                     </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="font-semibold text-lg text-slate-800 dark:text-white">${inv.amount.toFixed(2)}</p>
                                     <Button size="sm" onClick={() => openPayModal(inv)}>Pay Now</Button>
                                 </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">You have no open invoices. Great job!</p>
                )}
            </Card>

            <Card>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Active Subscriptions</h2>
                {activeSubscriptions.length > 0 ? (
                    <div className="space-y-3">
                        {activeSubscriptions.map(sub => {
                            const plan = plans.find(p => p.id === sub.planId);
                            if (!plan) return null;
                            return (
                                <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                                    <p className="text-slate-600 dark:text-slate-300">${plan.amount.toFixed(2)} / {plan.interval}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Next payment will be handled automatically.</p>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">You have no active subscriptions.</p>
                )}
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Payment History</h2>
                    <div className="w-full sm:w-64">
                        <Input 
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search payment history"
                        />
                    </div>
                </div>
                 {filteredPaidInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                             <thead className="bg-slate-50 dark:bg-slate-700">
                                 <tr>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date Paid</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                 {filteredPaidInvoices.map(inv => (
                                     <tr key={inv.id}>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : '-'}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{inv.description}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${inv.amount.toFixed(2)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                        {paidInvoices.length > 0 ? 'No results found for your search.' : 'You have no payment history yet.'}
                    </p>
                )}
            </Card>

            <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Simulated Payment">
                {selectedInvoice && (
                    <div className="text-center">
                        <p className="text-lg text-slate-700 dark:text-slate-200 mb-4">
                            You are about to "pay" an invoice for <span className="font-bold">${selectedInvoice.amount.toFixed(2)}</span>.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            In a real application, you would be redirected to a secure payment page hosted by Stripe. Here, you could use Apple Pay, Google Pay, or your credit card.
                        </p>
                         <div className="flex flex-col space-y-3">
                            <Button onClick={handleSimulatedPayment} size="lg" className="w-full">
                                Simulate Successful Payment
                            </Button>
                             <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ClientBilling;