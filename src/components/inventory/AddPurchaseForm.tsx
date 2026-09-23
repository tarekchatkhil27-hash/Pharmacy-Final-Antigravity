import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Trash2, Plus, CheckCircle2, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGlobal } from '../../context/GlobalContext';
import { Product, Supplier, HistoryLog, Payable, Transaction, PurchaseRecord } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

interface AddPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  discount: string;
  discountType: 'percent' | 'flat';
}

export function AddPurchaseForm({ isOpen, onClose }: AddPurchaseFormProps) {
  const { products, setProducts, suppliers, setSuppliers, setHistoryLogs, setPayables, setTransactions, addNotification, staff, purchases, setPurchases } = useGlobal();
  const { t } = useLanguage();

  // Header State
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [addedBy, setAddedBy] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  
  // Supplier State
  const [supplierData, setSupplierData] = useState({
    name: '',
    mobile: '',
    saveSupplier: false,
  });
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Items State
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Totals & Payment State
  const [shippingCost, setShippingCost] = useState<string>('');
  const [tax, setTax] = useState<string>('');
  const [globalDiscount, setGlobalDiscount] = useState<string>('');
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'flat'>('percent');
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedPurchase, setGeneratedPurchase] = useState<PurchaseRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const monthStr = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const dateStr = now.getDate().toString().padStart(2, '0');
      const serial = String((purchases?.length || 0) + 1).padStart(3, '0');
      setPoNumber(`PO-${monthStr}-${dateStr}-${serial}`);
      setOrderDate(now.toISOString().split('T')[0]);
    }
  }, [isOpen, purchases]);

  // --- Filtering ---
  const filteredSuppliers = useMemo(() => {
    if (!supplierData.name) return [];
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierData.name.toLowerCase()));
  }, [supplierData.name, suppliers]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch, products]);

  // --- Handlers ---
  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSupplierData(prev => ({ ...prev, [name]: val }));
    if (name === 'name') setShowSupplierDropdown(true);
  };

  const selectSupplier = (supplier: Supplier) => {
    setSupplierData({
      name: supplier.name,
      mobile: supplier.mobile,
      saveSupplier: false,
    });
    setShowSupplierDropdown(false);
  };

  const addProductToPurchase = (product: Product) => {
    setPurchaseItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitCost: product.cost,
        discount: '',
        discountType: 'percent',
      }];
    });
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updatePurchaseItem = (productId: string, field: keyof PurchaseItem, value: any) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.productId === productId) {
        if (field === 'quantity' || field === 'unitCost') {
          return { ...item, [field]: Math.max(0, Number(value)) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removePurchaseItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.productId !== productId));
  };

  // --- Calculations ---
  const hasIndividualDiscount = purchaseItems.some(item => parseFloat(item.discount || '0') > 0);
  
  const subtotal = purchaseItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitCost;
    let itemDiscount = 0;
    if (item.discountType === 'percent') {
      itemDiscount = itemTotal * (parseFloat(item.discount || '0') / 100);
    } else {
      itemDiscount = parseFloat(item.discount || '0');
    }
    return sum + Math.max(0, itemTotal - itemDiscount);
  }, 0);

  const shipping = parseFloat(shippingCost) || 0;
  const taxAmount = parseFloat(tax) || 0;
  
  let totalDiscount = 0;
  if (!hasIndividualDiscount) {
    if (globalDiscountType === 'percent') {
      totalDiscount = subtotal * (parseFloat(globalDiscount || '0') / 100);
    } else {
      totalDiscount = parseFloat(globalDiscount || '0');
    }
  }
  
  const grandTotal = Math.max(0, subtotal + shipping + taxAmount - totalDiscount);

  const handleCheckout = () => {
    if (purchaseItems.length === 0) {
      alert(t("Please add at least one product to the purchase order."));
      return;
    }

    const paidAmt = paymentOption === 'full' ? grandTotal : parseFloat(paidAmount || '0');
    if (paidAmt < 0 || paidAmt > grandTotal) {
      alert(t("Invalid paid amount."));
      return;
    }

    setShowConfirmation(true);
  };

  const confirmCheckout = () => {
    const paidAmt = paymentOption === 'full' ? grandTotal : parseFloat(paidAmount || '0');
    const dueAmount = grandTotal - paidAmt;
    let finalSupplierId = '';

    // Handle Supplier
    if (supplierData.name) {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === supplierData.name.toLowerCase());
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id;
      } else if (supplierData.saveSupplier) {
        const newSupplier: Supplier = {
          id: `S${Date.now()}`,
          name: supplierData.name,
          mobile: supplierData.mobile,
        };
        setSuppliers(prev => [...prev, newSupplier]);
        finalSupplierId = newSupplier.id;
      }
    }

    // Update Inventory (Add quantities & update cost)
    setProducts(prev => prev.map(p => {
      const purchasedItem = purchaseItems.find(item => item.productId === p.id);
      if (purchasedItem) {
        const currentQty = p.quantity;
        const currentMac = p.movingAverageCost || p.cost;
        const newQty = purchasedItem.quantity;
        const newUnitCost = purchasedItem.unitCost;
        const totalNewQty = currentQty + newQty;
        
        let newMac = newUnitCost;
        if (totalNewQty > 0) {
          newMac = ((currentQty * currentMac) + (newQty * newUnitCost)) / totalNewQty;
        }

        const newHistoryItem = { date: new Date().toISOString(), cost: newUnitCost, quantity: newQty };
        const updatedHistory = [newHistoryItem, ...(p.costHistory || [])];

        const newBatch = {
          id: `BATCH-${Date.now()}-${p.id}`,
          batchNumber: batchNumber || `PO-${poNumber}`,
          quantity: newQty,
          cost: newUnitCost,
          addedBy: addedBy || 'System',
          date: new Date().toISOString(),
          supplierId: finalSupplierId || undefined,
        };
        return { 
          ...p, 
          quantity: totalNewQty,
          cost: newUnitCost, // Keep latest cost for reference
          movingAverageCost: newMac,
          costHistory: updatedHistory,
          lastRestocked: new Date().toISOString(),
          batches: [...(p.batches || []), newBatch]
        };
      }
      return p;
    }));

    // Handle Payables (Accounting)
    if (dueAmount > 0) {
      const newPayable: Payable = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString(),
        supplierId: finalSupplierId || undefined,
        supplierName: supplierData.name,
        totalAmount: grandTotal,
        paidAmount: paidAmt,
        dueAmount: dueAmount,
        status: 'partial',
        relatedEntityId: poNumber,
      };
      setPayables(prev => [newPayable, ...prev]);
    }

    // Add Purchase Record
    const newPurchaseRecord = {
      id: poNumber,
      poNumber: poNumber,
      date: new Date().toISOString(),
      items: purchaseItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        discount: item.discount || 0,
        discountType: item.discountType || 'percent'
      })),
      subtotal,
      shipping,
      taxAmount,
      discountAmount: totalDiscount,
      grandTotal,
      paymentOption,
      paymentMethod,
      paidAmount: paidAmt,
      supplierId: finalSupplierId || undefined,
      supplierName: supplierData.name,
      supplierMobile: supplierData.mobile || undefined,
      addedBy: addedBy || undefined,
      batchNumber: batchNumber || undefined,
    };
    setPurchases(prev => [newPurchaseRecord, ...prev]);

    // Add Transaction
    const newTransaction: Transaction = {
      id: `TXN-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'purchase',
      amount: grandTotal,
      description: `Purchase Order ${poNumber} from ${supplierData.name}`,
      referenceId: poNumber,
      status: 'completed',
      paymentMethod
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // History Log
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'inventory',
      action: 'Add Purchase',
      description: `Created PO ${poNumber} for ${formatCurrency(grandTotal)}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: t('Purchase Order Completed'),
      message: `PO ${poNumber} ${t('for')} ${formatCurrency(grandTotal)} ${t('from')} ${supplierData.name} ${t('has been recorded.')}`,
      type: 'success',
      module: 'inventory'
    });

    setGeneratedPurchase(newPurchaseRecord);
    setShowConfirmation(false);
  };

  const handleCloseAll = () => {
    setGeneratedPurchase(null);
    setPurchaseItems([]);
    setSupplierData({ name: '', mobile: '', saveSupplier: false });
    setShippingCost('');
    setTax('');
    setPaymentOption('full');
    setPaidAmount('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  if (generatedPurchase) {
    return (
      <PurchaseInvoiceModal 
        isOpen={true} 
        onClose={handleCloseAll} 
        purchase={generatedPurchase} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-0 sm:p-6">
      <div className="flex flex-col w-full sm:max-w-5xl h-[95vh] sm:h-full sm:max-h-[90vh] bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl sm:border sm:border-white/20 sm:shadow-2xl dark:bg-slate-900/90 dark:sm:bg-black/50 rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 m-0">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 bg-transparent px-6 py-4 dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t('New Purchase Order')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Record new stock purchases from suppliers')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white dark:bg-slate-800 shadow-sm">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Section: PO Details & Supplier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider">{t('Order Details')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('PO Number')}</label>
                  <input 
                    value={poNumber} 
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Order Date')}</label>
                  <input 
                    type="date"
                    value={orderDate} 
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Added By (Staff)')}</label>
                  <select 
                    value={addedBy} 
                    onChange={(e) => setAddedBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="">{t('Select Staff...')}</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.position})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Batch Number')}</label>
                  <input 
                    value={batchNumber} 
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" 
                    placeholder={t('e.g. BATCH-001')}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider">{t('Supplier Information')}</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    name="name"
                    placeholder={t('Search or enter supplier name *')}
                    value={supplierData.name}
                    onChange={handleSupplierChange}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                    autoComplete="off"
                  />
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-900 dark:border-slate-800 max-h-40 overflow-y-auto">
                      {filteredSuppliers.map(s => (
                        <div 
                          key={s.id} 
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-50"
                          onClick={() => selectSupplier(s)}
                        >
                          {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {supplierData.name && !suppliers.find(s => s.name.toLowerCase() === supplierData.name.toLowerCase()) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      name="mobile"
                      placeholder={t('Mobile Number')}
                      value={supplierData.mobile}
                      onChange={handleSupplierChange}
                      className="flex-1 px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" name="saveSupplier" checked={supplierData.saveSupplier} onChange={handleSupplierChange} className="rounded text-indigo-600" />
                      {t('Save to Directory')}
                    </label>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Middle Section: Itemized List */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider">{t('Purchase Items')}</h3>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('Search & Add Product...')} 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onFocus={() => setShowProductDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-900 dark:border-slate-800 max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => addProductToPurchase(p)}
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku}</p>
                        </div>
                        <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">{t('Product')}</div>
                <div className="col-span-2 text-center">{t('Quantity')}</div>
                <div className="col-span-2 text-right">{t('Unit Cost')}</div>
                <div className="col-span-2 text-right">{t('Discount')}</div>
                <div className="col-span-1 text-right">{t('Total')}</div>
                <div className="col-span-1 text-center">{t('Action')}</div>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {purchaseItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <Package className="h-10 w-10 mb-2 opacity-20" />
                    <p>{t('No items added yet. Search and add products above.')}</p>
                  </div>
                ) : (
                  purchaseItems.map(item => (
                    <div key={item.productId} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center bg-white dark:bg-slate-950">
                      <div className="col-span-1 md:col-span-4 flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-50">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.sku}</span>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-center">
                        <span className="md:hidden text-sm text-slate-500">{t('Quantity')}:</span>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end">
                        <span className="md:hidden text-sm text-slate-500">{t('Unit Cost')}:</span>
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">৳</span>
                          <input 
                            type="number" 
                            min="0" step="1"
                            value={item.unitCost}
                            onChange={(e) => updatePurchaseItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-300 pl-6 pr-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end">
                        <span className="md:hidden text-sm text-slate-500">{t('Discount')}:</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            min="0" step="1"
                            value={item.discount}
                            onChange={(e) => updatePurchaseItem(item.productId, 'discount', e.target.value)}
                            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            placeholder="0"
                          />
                          <select 
                            value={item.discountType}
                            onChange={(e) => updatePurchaseItem(item.productId, 'discountType', e.target.value)}
                            className="rounded-lg border border-slate-300 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                          >
                            <option value="percent">%</option>
                            <option value="flat">৳</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-span-1 md:col-span-1 flex items-center justify-between md:justify-end font-medium text-slate-900 dark:text-slate-50">
                        <span className="md:hidden text-sm text-slate-500">{t('Total')}:</span>
                        {(() => {
                          const itemTotal = item.quantity * item.unitCost;
                          let itemDiscount = 0;
                          if (item.discountType === 'percent') {
                            itemDiscount = itemTotal * (parseFloat(item.discount || '0') / 100);
                          } else {
                            itemDiscount = parseFloat(item.discount || '0');
                          }
                          return formatCurrency(Math.max(0, itemTotal - itemDiscount));
                        })()}
                      </div>
                      
                      <div className="col-span-1 flex justify-end md:justify-center">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 h-8 w-8" onClick={() => removePurchaseItem(item.productId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Bottom Section: Totals & Payment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider">{t('Payment & Notes')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Payment Option')}</label>
                  <select 
                    value={paymentOption} 
                    onChange={(e) => setPaymentOption(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="full">{t('Full Payment')}</option>
                    <option value="partial">{t('Partial Payment')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Payment Method')}</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="cash">{t('Cash')}</option>
                    <option value="bkas">{t('Bkas')}</option>
                    <option value="card">{t('Card')}</option>
                    <option value="bank">{t('Bank Transfer')}</option>
                  </select>
                </div>
              </div>

              {paymentOption === 'partial' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Amount Paid')}</label>
                  <input 
                    type="number" 
                    min="0" step="1"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                    placeholder={t('Enter amount paid')}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Notes / Terms')}</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 resize-none"
                  placeholder={t('Optional instructions or terms...')}
                />
              </div>
            </section>

            <section className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-4">{t('Order Summary')}</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('Subtotal')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{t('Shipping / Freight')}</span>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">৳</span>
                    <input 
                      type="number" 
                      min="0" step="1"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-6 pr-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {!hasIndividualDiscount && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{t('Discount')}</span>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0" step="1"
                        value={globalDiscount}
                        onChange={(e) => setGlobalDiscount(e.target.value)}
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        placeholder="0"
                      />
                      <select 
                        value={globalDiscountType}
                        onChange={(e) => setGlobalDiscountType(e.target.value as 'percent' | 'flat')}
                        className="rounded-lg border border-slate-300 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      >
                        <option value="percent">%</option>
                        <option value="flat">৳</option>
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{t('Tax')}</span>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">৳</span>
                    <input 
                      type="number" 
                      min="0" step="1"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-6 pr-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-slate-50 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span>{t('Grand Total')}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50 shrink-0">
          <Button variant="outline" onClick={onClose}>{t('Cancel')}</Button>
          <Button onClick={handleCheckout} className="shadow-lg shadow-indigo-500/20" disabled={purchaseItems.length === 0}>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {t('Complete Purchase')}
          </Button>
        </div>

      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{t('Confirm Purchase')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t('Are you sure you want to save this purchase order? This will update inventory quantities and create accounting records.')}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                {t('Cancel')}
              </Button>
              <Button onClick={() => {
                setShowConfirmation(false);
                confirmCheckout();
              }}>
                {t('Confirm & Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
