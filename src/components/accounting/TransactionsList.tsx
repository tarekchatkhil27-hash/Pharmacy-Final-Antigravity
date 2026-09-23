import React, { useState, useMemo } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw, PackageX, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { InvoiceModal } from '../sales/InvoiceModal';
import { PurchaseInvoiceModal } from '../inventory/PurchaseInvoiceModal';
import { SaleRecord, PurchaseRecord } from '../../types';

export function TransactionsList() {
  const { transactions, sales, purchases } = useGlobal();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Invoice Modal States
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const handleInvoiceClick = (referenceId: string | undefined, type: string) => {
    if (!referenceId) return;

    if (type === 'sale' || type === 'income') {
      const sale = sales.find(s => s.id === referenceId);
      if (sale) {
        setSelectedSale(sale);
        setIsSaleModalOpen(true);
      }
    } else if (type === 'purchase') {
      const purchase = purchases.find(p => p.id === referenceId || p.poNumber === referenceId);
      if (purchase) {
        setSelectedPurchase(purchase);
        setIsPurchaseModalOpen(true);
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (txn.category && txn.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || txn.type === typeFilter;
      
      const txnDate = new Date(txn.date).getTime();
      const matchesDateFrom = dateFrom ? txnDate >= new Date(dateFrom).getTime() : true;
      const matchesDateTo = dateTo ? txnDate <= new Date(dateTo).getTime() + 86400000 : true; // Include end of day

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('All Transactions')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('View and filter every transaction across the system.')}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('Search transactions, IDs, or categories...')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950 w-full sm:w-auto"
              >
                <option value="all">{t('All Types')}</option>
                <option value="sale">{t('Sales')}</option>
                <option value="purchase">{t('Purchases')}</option>
                <option value="expense">{t('Expenses')}</option>
                <option value="income">{t('Income')}</option>
                <option value="adjustment">{t('Adjustments')}</option>
              </select>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950"
                  title="From Date"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950"
                  title="To Date"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Date & ID')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Description')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Type')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Status')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-50">{formatDate(txn.date)}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{txn.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      {txn.referenceId ? (
                        <div 
                          className="flex items-center gap-1.5 cursor-pointer group"
                          onClick={() => handleInvoiceClick(txn.referenceId, txn.type)}
                        >
                          <p className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline underline-offset-2 decoration-indigo-400/50">
                            {txn.description}
                          </p>
                          <ExternalLink className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <p className="text-slate-900 dark:text-slate-50">{txn.description}</p>
                      )}
                      {txn.category && (
                        <p className="text-xs text-slate-500 mt-0.5">{txn.category}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {txn.type === 'sale' || txn.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : txn.type === 'expense' || txn.type === 'purchase' ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{t(txn.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        txn.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t(txn.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${
                        txn.type === 'sale' || txn.type === 'income' || (txn.type === 'adjustment' && txn.amount > 0) ? 'text-emerald-600 dark:text-emerald-400' : 
                        txn.type === 'expense' || txn.type === 'purchase' || (txn.type === 'adjustment' && txn.amount < 0) ? 'text-red-600 dark:text-red-400' : 
                        'text-slate-900 dark:text-slate-50'
                      }`}>
                        {txn.type === 'sale' || txn.type === 'income' || (txn.type === 'adjustment' && txn.amount > 0) ? '+' : 
                         txn.type === 'expense' || txn.type === 'purchase' || (txn.type === 'adjustment' && txn.amount < 0) ? '-' : ''}
                        {formatCurrency(Math.abs(txn.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map(txn => {
              const isIncome = txn.type === 'sale' || txn.type === 'income';
              const isExpense = txn.type === 'purchase' || txn.type === 'expense';
              const isAdj = txn.type === 'adjustment';
              
              const borderColor = isIncome ? 'border-l-emerald-500' : isExpense ? 'border-l-rose-500' : 'border-l-blue-500';
              const typeLabel = isAdj ? t('Adj') : isIncome ? t('In') : t('Out');
              const moneyColor = isIncome || (isAdj && txn.amount > 0) ? 'text-emerald-600 dark:text-emerald-400' : isExpense || (isAdj && txn.amount < 0) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-50';
              const sign = isIncome || (isAdj && txn.amount > 0) ? '+' : isExpense || (isAdj && txn.amount < 0) ? '-' : '';

              const isExpanded = selectedTx?.id === txn.id;

              return (
                <div key={txn.id} className="flex flex-col bg-white dark:bg-slate-900/40 transition-colors">
                  <div 
                    className={`border-l-4 ${borderColor} p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                    onClick={() => setSelectedTx(isExpanded ? null : txn)}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isIncome ? 'bg-emerald-100 text-emerald-700' : isExpense ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                        {typeLabel}
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {txn.referenceId || txn.id}
                      </span>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${moneyColor}`}>
                      {sign}{formatCurrency(Math.abs(txn.amount))}
                    </span>
                  </div>

                  {/* Expanded View (The old card) */}
                  {isExpanded && (
                    <div className="p-4 border-l-4 border-l-slate-200 dark:border-l-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-4">
                          {txn.referenceId ? (
                            <div 
                              className="cursor-pointer group"
                              onClick={() => handleInvoiceClick(txn.referenceId, txn.type)}
                            >
                              <p className="font-medium text-indigo-600 dark:text-indigo-400 leading-tight group-hover:underline underline-offset-2 decoration-indigo-400/50 flex items-center gap-1">
                                {txn.description}
                                <ExternalLink className="h-3 w-3 inline-block" />
                              </p>
                            </div>
                          ) : (
                            <p className="font-medium text-slate-900 dark:text-slate-50 leading-tight">{txn.description}</p>
                          )}
                          {txn.category && (
                            <p className="text-xs text-slate-500 mt-1">{txn.category}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                        <span>{formatDate(txn.date)}</span>
                        <span className="font-mono">{txn.id}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800/50">
                        <div className="flex items-center gap-1.5">
                          {isIncome ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          ) : isExpense ? (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="capitalize text-slate-700 dark:text-slate-300 font-medium text-xs">{t(txn.type)}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          txn.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {t(txn.status)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <PackageX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{t('No transactions found')}</p>
              <p className="text-slate-400 text-xs mt-1">{t('Try adjusting your filters')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modals */}
      <InvoiceModal 
        isOpen={isSaleModalOpen} 
        onClose={() => setIsSaleModalOpen(false)} 
        sale={selectedSale} 
      />
      <PurchaseInvoiceModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
        purchase={selectedPurchase} 
      />
    </div>
  );
}
