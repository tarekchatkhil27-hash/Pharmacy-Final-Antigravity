import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Plus, Minus, FileText, DollarSign, TrendingUp, TrendingDown, Settings2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useGlobal } from '../../context/GlobalContext';
import { formatCurrency, cn } from '../../lib/utils';
import { Transaction, TransactionType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface CashBoxProps {
  onBack: () => void;
}

export function CashBox({ onBack }: CashBoxProps) {
  const { transactions, setTransactions, setHistoryLogs, addNotification } = useGlobal();
  const { t } = useLanguage();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Modals State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');
  
  // Form State
  const [adjustAmount, setAdjustAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addCategory, setAddCategory] = useState('');

  // --- Metrics Calculation ---
  const cashTransactions = useMemo(() => {
    return transactions.filter(t => t.paymentMethod?.toLowerCase() === 'cash' || t.type === 'adjustment');
  }, [transactions]);

  const { totalIncome, totalExpense, currentBalance, netAdjustment } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let adj = 0;
    let bal = 0;
    
    cashTransactions.forEach(t => {
      if (t.type === 'sale' || t.type === 'income') {
        inc += t.amount;
        bal += t.amount;
      } else if (t.type === 'purchase' || t.type === 'expense') {
        exp += t.amount;
        bal -= t.amount;
      } else if (t.type === 'adjustment') {
        adj += t.amount;
        bal += t.amount;
      }
    });
    
    return { totalIncome: inc, totalExpense: exp, currentBalance: bal, netAdjustment: adj };
  }, [cashTransactions]);

  // --- Filtering ---
  const filteredTransactions = useMemo(() => {
    return cashTransactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || 
                          (typeFilter === 'income' && (t.type === 'sale' || t.type === 'income')) ||
                          (typeFilter === 'expense' && (t.type === 'purchase' || t.type === 'expense')) ||
                          (typeFilter === 'adjustment' && t.type === 'adjustment');
      
      // Basic date filtering
      let matchesDate = true;
      const txDate = new Date(t.date);
      const today = new Date();
      if (dateFilter === 'today') {
        matchesDate = txDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'month') {
        matchesDate = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      }
      
      return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, typeFilter, dateFilter]);

  // --- Handlers ---
  const handleAdjustBalance = () => {
    const targetBalance = parseFloat(adjustAmount);
    if (isNaN(targetBalance)) return;
    
    const diff = targetBalance - currentBalance;
    if (diff === 0) {
      setIsAdjustModalOpen(false);
      return;
    }
    
    const newTx: Transaction = {
      id: `TXN-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'adjustment',
      amount: diff,
      description: 'Daily Cash Balance Adjustment',
      status: 'completed',
      paymentMethod: 'cash'
    };
    
    setTransactions(prev => [newTx, ...prev]);
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'accounting',
      action: 'Cash Adjustment',
      description: `Adjusted cash balance by ${formatCurrency(diff)}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: t('Cash Balance Adjusted'),
      message: `${t('Cash balance has been adjusted by')} ${formatCurrency(diff)}. ${t('New balance:')} ${formatCurrency(targetBalance)}`,
      type: diff >= 0 ? 'success' : 'warning',
      module: 'accounting'
    });
    
    setAdjustAmount('');
    setIsAdjustModalOpen(false);
  };

  const handleAddTransaction = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0 || !addDesc) return;
    
    const newTx: Transaction = {
      id: `TXN-${Date.now()}`,
      date: new Date().toISOString(),
      type: addType,
      amount: amount,
      description: addDesc,
      category: addCategory || 'Manual Entry',
      status: 'completed',
      paymentMethod: 'cash'
    };
    
    setTransactions(prev => [newTx, ...prev]);
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'accounting',
      action: `Manual ${addType}`,
      description: `Added manual ${addType} of ${formatCurrency(amount)}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: addType === 'income' ? t('Manual Income Added') : t('Manual Expense Added'),
      message: `${addDesc}: ${formatCurrency(amount)} ${t('has been recorded.')}`,
      type: addType === 'income' ? 'success' : 'info',
      module: 'accounting'
    });
    
    setAddAmount('');
    setAddDesc('');
    setAddCategory('');
    setIsAddModalOpen(false);
  };

  const openAddModal = (type: 'income' | 'expense') => {
    setAddType(type);
    setIsAddModalOpen(true);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Daily Cash Box')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('Manage liquid cash, manual income, and expenses.')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCashFlowOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            {t('Cash Flow Statement')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-emerald-100 font-medium">{t('Current Cash Balance')}</p>
              <DollarSign className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(currentBalance)}</h2>
            <div className="mt-6">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => { setAdjustAmount(currentBalance.toString()); setIsAdjustModalOpen(true); }}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                {t('Adjust Balance')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Cash Income')}</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalIncome)}</h2>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9" onClick={() => openAddModal('income')}>
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> {t('Add')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Cash Expense')}</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalExpense)}</h2>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9" onClick={() => openAddModal('expense')}>
                <Minus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> {t('Add')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Section */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('Search transactions...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="all">{t('All Types')}</option>
                <option value="income">{t('Income Only')}</option>
                <option value="expense">{t('Expense Only')}</option>
                <option value="adjustment">{t('Adjustments')}</option>
              </select>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="all">{t('All Time')}</option>
                <option value="today">{t('Today')}</option>
                <option value="month">{t('This Month')}</option>
              </select>
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {filteredTransactions.length > 0 ? filteredTransactions.map(tx => {
              const isIncome = tx.type === 'sale' || tx.type === 'income';
              const isExpense = tx.type === 'purchase' || tx.type === 'expense';
              const isAdj = tx.type === 'adjustment';
              
              const borderColor = isIncome ? 'border-l-emerald-500' : isExpense ? 'border-l-rose-500' : 'border-l-blue-500';
              const typeLabel = isAdj ? t('Adj') : isIncome ? t('In') : t('Out');
              const moneyColor = isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-rose-600 dark:text-rose-400' : (tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400');
              const sign = isExpense || (isAdj && tx.amount < 0) ? '-' : '+';
              
              return (
                <div 
                  key={tx.id} 
                  className={`border-l-4 ${borderColor} bg-white dark:bg-slate-900/40 p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isIncome ? 'bg-emerald-100 text-emerald-700' : isExpense ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                      {typeLabel}
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {tx.referenceId || tx.id}
                    </span>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${moneyColor}`}>
                    {sign}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              );
            }) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                {t('No transactions found matching your filters.')}
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('Date')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Description')}</th>
                  <th className="px-6 py-4 font-semibold">{t('Type')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('Amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'sale' || tx.type === 'income';
                  const isExpense = tx.type === 'purchase' || tx.type === 'expense';
                  const isAdj = tx.type === 'adjustment';
                  
                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{tx.description}</p>
                        {tx.category && <p className="text-xs text-slate-500">{tx.category}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {isIncome && <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><ArrowUpRight className="mr-1 h-3 w-3" /> {t('Income')}</span>}
                        {isExpense && <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"><ArrowDownRight className="mr-1 h-3 w-3" /> {t('Expense')}</span>}
                        {isAdj && <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Settings2 className="mr-1 h-3 w-3" /> {t('Adjustment')}</span>}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-medium",
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : 
                        isExpense ? "text-rose-600 dark:text-rose-400" : 
                        tx.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {isExpense || (isAdj && tx.amount < 0) ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      {t('No transactions found matching your filters.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- Modals --- */}

      {/* Adjust Balance Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Adjust Cash Balance')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAdjustModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Current Balance')}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(currentBalance)}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('New Target Balance')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">৳</span>
                  <input 
                    type="number" 
                    step="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('This will create an adjustment transaction to match the physical cash.')}</p>
              </div>
              <Button className="w-full mt-4" onClick={handleAdjustBalance}>{t('Confirm Adjustment')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{addType === 'income' ? t('Add Manual Income') : t('Add Manual Expense')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Amount')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">৳</span>
                  <input 
                    type="number" 
                    min="0" step="1"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Description')}</label>
                <input 
                  type="text" 
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder={t('e.g., Office Supplies, Service Fee')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Category (Optional)')}</label>
                <input 
                  type="text" 
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  placeholder={t('e.g., Utilities, Marketing')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
              <Button 
                className={cn("w-full mt-4", addType === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")} 
                onClick={handleAddTransaction}
              >
                {addType === 'income' ? t('Save Income') : t('Save Expense')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Transaction Details')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTx(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500">{t('Amount')}</span>
                <span className={cn(
                  "text-2xl font-bold",
                  selectedTx.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {formatCurrency(Math.abs(selectedTx.amount))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500">{t('Type')}</span>
                  <span className="font-medium capitalize text-slate-900 dark:text-slate-50">{selectedTx.type}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">{t('Date')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{new Date(selectedTx.date).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-slate-500">{t('Description')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{selectedTx.description}</span>
                </div>
                {selectedTx.category && (
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500">{t('Category')}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{selectedTx.category}</span>
                  </div>
                )}
                {(selectedTx.referenceId || selectedTx.id) && (
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500">{t('Reference ID')}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50 break-all">{selectedTx.referenceId || selectedTx.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Statement Modal */}
      {isCashFlowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Cash Flow Statement')}</h2>
                <p className="text-sm text-slate-500">{t('Summary of all cash inflows and outflows')}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCashFlowOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Inflows */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">{t('Cash Inflows')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{t('Sales Revenue')}</span>
                    <span>{formatCurrency(transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{t('Manual Income')}</span>
                    <span>{formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{t('Total Inflows')}</span>
                    <span>{formatCurrency(totalIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Outflows */}
              <div>
                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">{t('Cash Outflows')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{t('Purchases (COGS)')}</span>
                    <span>{formatCurrency(transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{t('Operating Expenses')}</span>
                    <span>{formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{t('Total Outflows')}</span>
                    <span>{formatCurrency(totalExpense)}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('Net Cash Flow (Inflows - Outflows)')}</span>
                  <span className={cn("font-medium", (totalIncome - totalExpense) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {formatCurrency(totalIncome - totalExpense)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('Net Adjustments')}</span>
                  <span className={cn("font-medium", netAdjustment >= 0 ? "text-blue-600" : "text-rose-600")}>
                    {formatCurrency(netAdjustment)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>{t('Ending Cash Balance')}</span>
                  <span>{formatCurrency(currentBalance)}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800 shrink-0 flex justify-end">
              <Button onClick={() => setIsCashFlowOpen(false)}>{t('Close Statement')}</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
