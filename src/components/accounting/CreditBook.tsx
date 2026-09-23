import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useGlobal } from '../../context/GlobalContext';
import { formatCurrency, cn } from '../../lib/utils';
import { Payable, Receivable, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface CreditBookProps {
  onBack: () => void;
}

export function CreditBook({ onBack }: CreditBookProps) {
  const { payables, setPayables, receivables, setReceivables, setTransactions, setHistoryLogs, addNotification } = useGlobal();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    type: 'payable' | 'receivable';
    record: Payable | Receivable | null;
  }>({ isOpen: false, type: 'receivable', record: null });
  
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // --- Metrics ---
  const totalReceivablesDue = useMemo(() => 
    receivables.reduce((sum, r) => sum + r.dueAmount, 0)
  , [receivables]);

  const totalPayablesDue = useMemo(() => 
    payables.reduce((sum, p) => sum + p.dueAmount, 0)
  , [payables]);

  // --- Filtering ---
  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.relatedEntityId && r.relatedEntityId.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receivables, searchQuery]);

  const filteredPayables = useMemo(() => {
    return payables.filter(p => 
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.relatedEntityId && p.relatedEntityId.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payables, searchQuery]);

  // --- Handlers ---
  const openPaymentModal = (type: 'payable' | 'receivable', record: Payable | Receivable) => {
    setPaymentModal({ isOpen: true, type, record });
    // Fix floating point issues and ensure it perfectly matches the displayed formatCurrency which has 0 fraction digits
    setPaymentAmount(Math.round(record.dueAmount).toString());
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, type: 'receivable', record: null });
    setPaymentAmount('');
  };

  const handleProcessPayment = () => {
    const amount = parseFloat(paymentAmount);
    const { type, record } = paymentModal;
    
    if (!record || isNaN(amount) || amount <= 0 || amount > Math.round(record.dueAmount)) return;

    // Recalculate accurately
    const newDueAmount = Math.max(0, record.dueAmount - amount);
    const newPaidAmount = record.paidAmount + amount;
    const newStatus = newDueAmount <= 0 ? 'paid' : 'partial';

    if (newDueAmount <= 0) {
      if (!window.confirm(t('This will fully clear the due and remove the record from the credit book. Are you sure you want to proceed?'))) {
        return;
      }
    }

    if (type === 'receivable') {
      // Update Receivable
      setReceivables(prev => {
        if (newDueAmount <= 0) {
          return prev.filter(r => r.id !== record.id);
        }
        return prev.map(r => r.id === record.id ? { ...r, dueAmount: newDueAmount, paidAmount: newPaidAmount, status: newStatus } : r);
      });
      
      // Add Income Transaction
      const newTx: Transaction = {
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'sale',
        amount: amount,
        description: `Payment received from ${(record as Receivable).customerName}`,
        category: 'Accounts Receivable',
        referenceId: record.relatedEntityId,
        status: 'completed',
        paymentMethod
      };
      setTransactions(prev => [newTx, ...prev]);
      
      addNotification({
        title: t('Payment Received'),
        message: `${formatCurrency(amount)} ${t('received from')} ${(record as Receivable).customerName}.`,
        type: 'success',
        module: 'accounting'
      });
    } else {
      // Update Payable
      setPayables(prev => {
        if (newDueAmount <= 0) {
          return prev.filter(p => p.id !== record.id);
        }
        return prev.map(p => p.id === record.id ? { ...p, dueAmount: newDueAmount, paidAmount: newPaidAmount, status: newStatus } : p);
      });
      
      // Add Expense Transaction
      const newTx: Transaction = {
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'expense',
        amount: amount,
        description: `Payment made to ${(record as Payable).supplierName}`,
        category: 'Accounts Payable',
        referenceId: record.relatedEntityId,
        status: 'completed',
        paymentMethod
      };
      setTransactions(prev => [newTx, ...prev]);
      // Log History
      setHistoryLogs(prev => [{
        id: `LOG-${Date.now()}`,
        date: new Date().toISOString(),
        module: 'accounting',
        action: 'Make Payment',
        description: `Paid ${formatCurrency(amount)} to ${(record as Payable).supplierName}`,
        user: 'Admin'
      }, ...prev]);
    }

    // Notification
    addNotification({
      title: type === 'receivable' ? t('Payment Received') : t('Payment Made'),
      message: type === 'receivable' 
        ? `${formatCurrency(amount)} ${t('received from')} ${(record as Receivable).customerName}.` 
        : `${formatCurrency(amount)} ${t('paid to')} ${(record as Payable).supplierName}.`,
      type: type === 'receivable' ? 'success' : 'info',
      module: 'accounting'
    });

    closePaymentModal();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" /> {t('Paid')}</span>;
      case 'partial':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="mr-1 h-3 w-3" /> {t('Partial')}</span>;
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="mr-1 h-3 w-3" /> {t('Pending')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Credit Book')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('Manage accounts receivable and accounts payable.')}</p>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button Grid (Directory Style) */}
      <div className="flex md:hidden bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-800 w-full mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('receivables')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm transition-all",
            activeTab === 'receivables' 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <span className="font-medium text-xs uppercase tracking-wider mb-1">{t('Receivables')}</span>
          <span className="font-bold text-lg">{formatCurrency(totalReceivablesDue)}</span>
        </button>
        <button
          onClick={() => setActiveTab('payables')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm transition-all",
            activeTab === 'payables' 
              ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 shadow-sm" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <span className="font-medium text-xs uppercase tracking-wider mb-1">{t('Payables')}</span>
          <span className="font-bold text-lg">{formatCurrency(totalPayablesDue)}</span>
        </button>
      </div>

      {/* Desktop Summary Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cn("cursor-pointer transition-all border-2", activeTab === 'receivables' ? "border-emerald-500 shadow-md" : "border-transparent hover:border-slate-200 dark:hover:border-slate-800")} onClick={() => setActiveTab('receivables')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Receivables (You are owed)')}</p>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalReceivablesDue)}</h2>
            <p className="text-sm text-slate-500 mt-2">{t('From')} {receivables.filter(r => r.dueAmount > 0).length} {t('customers')}</p>
          </CardContent>
        </Card>

        <Card className={cn("cursor-pointer transition-all border-2", activeTab === 'payables' ? "border-rose-500 shadow-md" : "border-transparent hover:border-slate-200 dark:hover:border-slate-800")} onClick={() => setActiveTab('payables')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Payables (You owe)')}</p>
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalPayablesDue)}</h2>
            <p className="text-sm text-slate-500 mt-2">{t('To')} {payables.filter(p => p.dueAmount > 0).length} {t('suppliers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={activeTab === 'receivables' ? t('Search customers or reference...') : t('Search suppliers or reference...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {(activeTab === 'receivables' ? filteredReceivables : filteredPayables).length > 0 ? (
              (activeTab === 'receivables' ? filteredReceivables : filteredPayables).map((record: any) => {
                const isExpanded = selectedRecord === record.id;
                const isReceivable = activeTab === 'receivables';
                const borderColor = isReceivable ? 'border-l-emerald-500' : 'border-l-rose-500';
                const name = isReceivable ? record.customerName : record.supplierName;
                
                return (
                  <div key={record.id} className="flex flex-col bg-white dark:bg-slate-900/40 transition-colors">
                    <div 
                      className={`border-l-4 ${borderColor} p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                      onClick={() => setSelectedRecord(isExpanded ? null : record.id)}
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm truncate pr-2 flex-1">{name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-sm text-rose-600 dark:text-rose-400">{formatCurrency(record.dueAmount)}</span>
                        <Button 
                          size="sm" 
                          variant={record.dueAmount > 0 ? 'default' : 'outline'}
                          disabled={record.dueAmount <= 0}
                          onClick={(e) => { e.stopPropagation(); openPaymentModal(isReceivable ? 'receivable' : 'payable', record); }}
                          className={`h-7 px-3 text-[11px] ${record.dueAmount > 0 ? (isReceivable ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700") : ""}`}
                        >
                          {isReceivable ? t('Receive') : t('Pay')}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-l-4 border-l-slate-200 dark:border-l-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                          <span className="font-mono">{record.relatedEntityId}</span>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t('Total Amount')}:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(record.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t('Paid')}:</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(record.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{t('Due Balance')}:</span>
                            <span className="text-rose-600 dark:text-rose-400">{formatCurrency(record.dueAmount)}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/50">
                          {renderStatusBadge(record.status)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                {activeTab === 'receivables' ? t('No receivables found.') : t('No payables found.')}
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('Date & Ref')}</th>
                  <th className="px-6 py-4 font-semibold">{activeTab === 'receivables' ? t('Customer') : t('Supplier')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Total Amount')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Paid')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Due Balance')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Status')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTab === 'receivables' ? (
                  filteredReceivables.length > 0 ? filteredReceivables.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">{record.relatedEntityId}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{record.customerName}</td>
                      <td className="px-6 py-4">{formatCurrency(record.totalAmount)}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(record.paidAmount)}</td>
                      <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(record.dueAmount)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant={record.dueAmount > 0 ? 'default' : 'outline'}
                          disabled={record.dueAmount <= 0}
                          onClick={() => openPaymentModal('receivable', record)}
                          className={record.dueAmount > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        >
                          {t('Receive Payment')}
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">{t('No receivables found.')}</td></tr>
                  )
                ) : (
                  filteredPayables.length > 0 ? filteredPayables.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">{record.relatedEntityId}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{record.supplierName}</td>
                      <td className="px-6 py-4">{formatCurrency(record.totalAmount)}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(record.paidAmount)}</td>
                      <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(record.dueAmount)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant={record.dueAmount > 0 ? 'default' : 'outline'}
                          disabled={record.dueAmount <= 0}
                          onClick={() => openPaymentModal('payable', record)}
                          className={record.dueAmount > 0 ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
                        >
                          {t('Make Payment')}
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">{t('No payables found.')}</td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {paymentModal.isOpen && paymentModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {paymentModal.type === 'receivable' ? t('Receive Payment') : t('Make Payment')}
              </h2>
              <Button variant="ghost" size="icon" onClick={closePaymentModal} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('To/From:')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {paymentModal.type === 'receivable' 
                      ? (paymentModal.record as Receivable).customerName 
                      : (paymentModal.record as Payable).supplierName}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('Reference:')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{paymentModal.record.relatedEntityId}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('Total Amount')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(paymentModal.record.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <span className="text-slate-900 dark:text-slate-50">{t('Current Due:')}</span>
                  <span className="text-rose-600 dark:text-rose-400">{formatCurrency(paymentModal.record.dueAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Payment Amount')}</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">৳</span>
                    <input 
                      type="number" 
                      min="1" 
                      max={paymentModal.record.dueAmount}
                      step="1"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-8 pr-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                    />
                  </div>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-1/3 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="cash">{t('Cash')}</option>
                    <option value="bkash">{t('bKash')}</option>
                    <option value="bank">{t('Bank Transfer')}</option>
                  </select>
                </div>
                {parseFloat(paymentAmount) > paymentModal.record.dueAmount && (
                  <p className="text-xs text-rose-500">{t('Amount cannot exceed the due balance.')}</p>
                )}
              </div>

              <Button 
                className={cn("w-full py-6 text-lg", paymentModal.type === 'receivable' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")} 
                onClick={handleProcessPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > paymentModal.record.dueAmount}
              >
                <Wallet className="mr-2 h-5 w-5" />
                {paymentModal.type === 'receivable' ? t('Confirm Receipt') : t('Confirm Payment')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
