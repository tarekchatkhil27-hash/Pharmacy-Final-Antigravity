import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useGlobal } from '../context/GlobalContext';
import { Users, Truck, Phone, Search, X, DollarSign, Calendar, FileText } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Customer, Supplier, SaleRecord, PurchaseRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { InvoiceModal } from '../components/sales/InvoiceModal';
import { PurchaseInvoiceModal } from '../components/inventory/PurchaseInvoiceModal';
import { motion, AnimatePresence } from 'motion/react';

export function Directory() {
  const { customers, suppliers, receivables, payables, sales, purchases } = useGlobal();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.mobile && c.mobile.includes(searchQuery))
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.mobile && s.mobile.includes(searchQuery))
  );

  const getCustomerSales = (customer: Customer) => {
    return sales.filter(s => s.customerId === customer.id || s.customerName === customer.name);
  };

  const getSupplierPurchases = (supplier: Supplier) => {
    return purchases.filter(p => p.supplierId === supplier.id || p.supplierName === supplier.name);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Directory')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('Manage your customers and suppliers.')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-800 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('customers')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'customers' 
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Users className="h-4 w-4" />
            {t('Customers')}
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'suppliers' 
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Truck className="h-4 w-4" />
            {t('Suppliers')}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'customers' ? t('Search Customers...') : t('Search Suppliers...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 shadow-sm"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'customers' ? t('Customers') : t('Suppliers')}</CardTitle>
          <CardDescription>
            {activeTab === 'customers' 
              ? `${t('You have')} ${customers.length} ${t('registered customers.')}` 
              : `${t('You have')} ${suppliers.length} ${t('registered suppliers.')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur-md text-xs uppercase text-slate-500 shadow-sm dark:bg-black/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4 rounded-tl-xl">{t('Name')}</th>
                  <th className="px-4 py-4">{t('Contact')}</th>
                  <th className="px-4 py-4">{t('Address')}</th>
                  <th className="px-4 py-4 rounded-tr-xl text-right">{t('Added On')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {(activeTab === 'customers' ? filteredCustomers : filteredSuppliers).length === 0 ? (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={4} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                          </div>
                          <p className="text-base font-medium text-slate-900 dark:text-slate-50">{activeTab === 'customers' ? t('No customers found') : t('No suppliers found')}</p>
                          <p className="text-sm">{t('Try adjusting your search criteria.')}</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    (activeTab === 'customers' ? filteredCustomers : filteredSuppliers).map(contact => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        key={contact.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => activeTab === 'customers' ? setSelectedCustomer(contact as Customer) : setSelectedSupplier(contact as Supplier)}
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">
                          {contact.name}
                        </td>
                        <td className="px-4 py-4">
                          {contact.mobile ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {contact.mobile}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">{t('No contact info')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {(contact as any).address || '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-slate-500">
                          {new Date(parseInt(contact.id.replace(/[^0-9]/g, '')) || Date.now()).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl shadow-2xl dark:bg-slate-900/90 dark:sm:bg-black/50 sm:border sm:border-white/20 dark:sm:border-white/10 flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/50 bg-transparent px-6 py-4 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{selectedCustomer.name}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {selectedCustomer.mobile || t('No contact info')}
                  </p>
                  {selectedCustomer.address && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <Search className="h-3 w-3" /> {selectedCustomer.address}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                {t('Invoice History')}
              </h3>
              
              {getCustomerSales(selectedCustomer).length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  {t('No invoices found for this customer.')}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Total Amount')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        {formatCurrency(getCustomerSales(selectedCustomer).reduce((sum, s) => sum + s.grandTotal, 0))}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t('Total Paid')}</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(getCustomerSales(selectedCustomer).reduce((sum, s) => sum + s.paidAmount, 0))}
                      </p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20">
                      <p className="text-sm text-rose-600 dark:text-rose-400 mb-1">{t('Total Due')}</p>
                      <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                        {formatCurrency(getCustomerSales(selectedCustomer).reduce((sum, s) => sum + (s.grandTotal - s.paidAmount), 0))}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">{t('Invoice')}</th>
                          <th className="px-4 py-3">{t('Date')}</th>
                          <th className="px-4 py-3 text-right">{t('Total')}</th>
                          <th className="px-4 py-3 text-right">{t('Paid')}</th>
                          <th className="px-4 py-3 text-right">{t('Due')}</th>
                          <th className="px-4 py-3 text-center">{t('Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {getCustomerSales(selectedCustomer).map(s => {
                          const due = s.grandTotal - s.paidAmount;
                          const status = due <= 0 ? 'paid' : s.paidAmount > 0 ? 'partial' : 'unpaid';
                          return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-3">
                                <button 
                                  onClick={() => setSelectedSale(s)}
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium underline"
                                >
                                  {s.id}
                                </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {new Date(s.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-50">
                              {formatCurrency(s.grandTotal)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(s.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                              {formatCurrency(due)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                status === 'paid' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                status === 'partial' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                              )}>
                                {t(status.charAt(0).toUpperCase() + status.slice(1))}
                              </span>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl shadow-2xl dark:bg-slate-900/90 dark:sm:bg-black/50 sm:border sm:border-white/20 dark:sm:border-white/10 flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/50 bg-transparent px-6 py-4 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{selectedSupplier.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <Phone className="h-3 w-3" /> {selectedSupplier.mobile || t('No contact info')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                {t('Invoice History')}
              </h3>
              
              {getSupplierPurchases(selectedSupplier).length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  {t('No invoices found for this supplier.')}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Total Amount')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        {formatCurrency(getSupplierPurchases(selectedSupplier).reduce((sum, p) => sum + p.grandTotal, 0))}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t('Total Paid')}</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(getSupplierPurchases(selectedSupplier).reduce((sum, p) => sum + p.paidAmount, 0))}
                      </p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20">
                      <p className="text-sm text-rose-600 dark:text-rose-400 mb-1">{t('Total Due')}</p>
                      <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                        {formatCurrency(getSupplierPurchases(selectedSupplier).reduce((sum, p) => sum + (p.grandTotal - p.paidAmount), 0))}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">{t('Invoice')}</th>
                          <th className="px-4 py-3">{t('Date')}</th>
                          <th className="px-4 py-3 text-right">{t('Total')}</th>
                          <th className="px-4 py-3 text-right">{t('Paid')}</th>
                          <th className="px-4 py-3 text-right">{t('Due')}</th>
                          <th className="px-4 py-3 text-center">{t('Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {getSupplierPurchases(selectedSupplier).map(p => {
                          const due = p.grandTotal - p.paidAmount;
                          const status = due <= 0 ? 'paid' : p.paidAmount > 0 ? 'partial' : 'unpaid';
                          return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-3">
                                <button 
                                  onClick={() => setSelectedPurchase(p)}
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium underline"
                                >
                                  {p.poNumber}
                                </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {new Date(p.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-50">
                              {formatCurrency(p.grandTotal)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                              {formatCurrency(due)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                status === 'paid' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                status === 'partial' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                              )}>
                                {t(status.charAt(0).toUpperCase() + status.slice(1))}
                              </span>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modals */}
      <InvoiceModal 
        isOpen={!!selectedSale} 
        onClose={() => setSelectedSale(null)} 
        sale={selectedSale} 
      />
      <PurchaseInvoiceModal 
        isOpen={!!selectedPurchase} 
        onClose={() => setSelectedPurchase(null)} 
        purchase={selectedPurchase} 
      />
    </motion.div>
  );
}
