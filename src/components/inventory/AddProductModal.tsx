import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGlobal } from '../../context/GlobalContext';
import { Product, Supplier, HistoryLog, Payable, PurchaseRecord, Transaction, Medicine } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { getMedicineDatabase } from '../../lib/medicineDatabase';
import { useLanguage } from '../../context/LanguageContext';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const { products, setProducts, suppliers, setSuppliers, setHistoryLogs, setPayables, setTransactions, staff, addNotification, purchases, setPurchases, categories } = useGlobal();
  const { t } = useLanguage();

  const [productsToAdd, setProductsToAdd] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedPurchase, setGeneratedPurchase] = useState<PurchaseRecord | null>(null);

  const [formData, setFormData] = useState({
    name: '', genericName: '', strength: '', dosageForm: '', sku: '', brand: '', category: '', size: '', color: '', design: '',
    price: '', cost: '', quantity: '', unit: '', minThreshold: '',
    discount: '', discountType: 'percent' as 'percent' | 'flat'
  });

  const [batchData, setBatchData] = useState({
    batchNumber: '', addedBy: ''
  });

  const [supplierData, setSupplierData] = useState({
    name: '', mobile: '', saveSupplier: false,
  });

  const [paymentData, setPaymentData] = useState({
    option: 'full', method: 'cash', paidAmount: '', discount: '', discountType: 'percent' as 'percent' | 'flat',
  });

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    getMedicineDatabase().then(data => setMedicines(data));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const monthStr = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const dateStr = now.getDate().toString().padStart(2, '0');
      const batchSerial = String((purchases?.length || 0) + 1).padStart(3, '0');
      const autoBatch = `${monthStr}-${dateStr}-${batchSerial}`;
      
      setBatchData(prev => ({ ...prev, batchNumber: autoBatch }));
      setFormData(prev => ({ ...prev, sku: '' })); // Let name effect handle it
    }
  }, [isOpen, purchases]);

  useEffect(() => {
    if (formData.name && isOpen) {
      const namePrefix = formData.name.substring(0, 3).toUpperCase().padEnd(3, 'X');
      const serial = String(products.length + productsToAdd.length + 1).padStart(3, '0');
      setFormData(prev => ({ ...prev, sku: `${namePrefix}-${serial}` }));
    }
  }, [formData.name, isOpen, products.length, productsToAdd.length]);
  const filteredSuppliers = useMemo(() => {
    if (!supplierData.name) return [];
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierData.name.toLowerCase()));
  }, [supplierData.name, suppliers]);

  const filteredMedicines = useMemo(() => {
    if (!formData.name) return [];
    const search = formData.name.toLowerCase();
    
    // Exact match or prefix match gets priority
    const prefixMatches = medicines.filter(m => m['Product Name']?.toLowerCase().startsWith(search));
    
    // Substring matches that are not prefix
    const includesMatches = medicines.filter(m => 
      !m['Product Name']?.toLowerCase().startsWith(search) && 
      m['Product Name']?.toLowerCase().includes(search)
    );
    
    return [...prefixMatches, ...includesMatches].slice(0, 50); // Limit to 50 for performance
  }, [formData.name, medicines]);

  const selectMedicine = (medicine: Medicine) => {
    setFormData(prev => ({
      ...prev,
      name: medicine['Product Name'] || '',
      genericName: medicine['Generic Name'] || '',
      strength: medicine['Strength'] || '',
      dosageForm: medicine['Dosage Form'] || '',
      brand: medicine['Brand Name'] || '',
    }));
    setShowMedicineDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'name') setShowMedicineDropdown(true);
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSupplierData(prev => ({ ...prev, [name]: val }));
    if (name === 'name') setShowSupplierDropdown(true);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const selectSupplier = (supplier: Supplier) => {
    setSupplierData({ name: supplier.name, mobile: supplier.mobile, saveSupplier: false });
    setShowSupplierDropdown(false);
  };

  const handleAddProductToList = () => {
    if (!formData.name || !formData.price || !formData.cost || !formData.quantity || !formData.unit) {
      alert(t('Please fill in all required product fields.'));
      return;
    }
    setProductsToAdd(prev => [...prev, { ...formData, id: `P${Date.now()}-${Math.random()}` }]);
    setFormData({
      name: '', genericName: '', strength: '', dosageForm: '', sku: '', brand: '', category: '', size: '', color: '', design: '',
      price: '', cost: '', quantity: '', unit: '', minThreshold: '',
      discount: '', discountType: 'percent'
    });
  };

  const removeProductFromList = (id: string) => {
    setProductsToAdd(prev => prev.filter(p => p.id !== id));
  };

  const subtotalCost = productsToAdd.reduce((sum, p) => sum + (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 0), 0);
  
  const itemDiscountsTotal = productsToAdd.reduce((sum, p) => {
    const itemTotal = (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 0);
    if (p.discountType === 'percent') {
      return sum + (itemTotal * (parseFloat(p.discount || '0') / 100));
    } else {
      return sum + (parseFloat(p.discount || '0'));
    }
  }, 0);

  let globalDiscountAmount = 0;
  if (paymentData.discountType === 'percent') {
    globalDiscountAmount = (subtotalCost - itemDiscountsTotal) * (parseFloat(paymentData.discount || '0') / 100);
  } else {
    globalDiscountAmount = parseFloat(paymentData.discount || '0');
  }
  
  const totalDiscount = itemDiscountsTotal + globalDiscountAmount;
  const totalCost = Math.max(0, subtotalCost - totalDiscount);
  const paidAmount = paymentData.option === 'full' ? totalCost : parseFloat(paymentData.paidAmount || '0');
  const dueAmount = totalCost - paidAmount;

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productsToAdd.length === 0) {
      alert(t('Please add at least one product.'));
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    let finalSupplierId = '';

    if (supplierData.name) {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === supplierData.name.toLowerCase());
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id;
      } else if (supplierData.saveSupplier) {
        const newSupplier: Supplier = { id: `S${Date.now()}`, name: supplierData.name, mobile: supplierData.mobile };
        setSuppliers(prev => [...prev, newSupplier]);
        finalSupplierId = newSupplier.id;
      }
    }

    const newProducts: Product[] = productsToAdd.map(p => ({
      id: p.id,
      name: p.name,
      genericName: p.genericName,
      strength: p.strength,
      dosageForm: p.dosageForm,
      sku: p.sku,
      brand: p.brand,
      category: p.category,
      size: p.size,
      color: p.color,
      design: p.design,
      price: parseFloat(p.price),
      cost: parseFloat(p.cost),
      movingAverageCost: parseFloat(p.cost),
      costHistory: [{ date: new Date().toISOString(), cost: parseFloat(p.cost), quantity: parseInt(p.quantity, 10) }],
      quantity: parseInt(p.quantity, 10),
      unit: p.unit,
      minThreshold: parseInt(p.minThreshold || '5', 10),
      batchNumber: batchData.batchNumber,
      addedBy: batchData.addedBy,
      supplierId: finalSupplierId || undefined,
      lastRestocked: new Date().toISOString(),
    }));

    setProducts(prev => [...newProducts, ...prev]);

    const now = new Date();
    const monthStr = now.toLocaleString('default', { month: 'short' }).toUpperCase();
    const dateStr = now.getDate().toString().padStart(2, '0');
    const serial = String((purchases?.length || 0) + 1).padStart(3, '0');
    const poNumber = `PO-${monthStr}-${dateStr}-${serial}`;

    if (dueAmount > 0 && supplierData.name) {
      const newPayable: Payable = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString(),
        supplierId: finalSupplierId || undefined,
        supplierName: supplierData.name,
        totalAmount: totalCost,
        paidAmount: paidAmount,
        dueAmount: dueAmount,
        status: 'partial',
        relatedEntityId: poNumber,
      };
      setPayables(prev => [newPayable, ...prev]);
    }

    if (paidAmount > 0) {
      setTransactions(prev => [{
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'purchase',
        amount: paidAmount,
        description: `Purchase Batch: ${productsToAdd.length} items`,
        category: 'Inventory Purchase',
        status: 'completed',
        referenceId: poNumber,
        paymentMethod: paymentData.method
      }, ...prev]);
    }

    const newPurchaseRecord: PurchaseRecord = {
      id: poNumber,
      poNumber: poNumber,
      date: new Date().toISOString(),
      items: productsToAdd.map(p => ({
        productId: p.id,
        name: p.name,
        quantity: parseInt(p.quantity, 10),
        unitCost: parseFloat(p.cost),
        discount: parseFloat(p.discount || '0'),
        discountType: p.discountType
      })),
      subtotal: subtotalCost,
      shipping: 0,
      taxAmount: 0,
      discountAmount: totalDiscount,
      grandTotal: totalCost,
      paymentOption: paymentData.option as 'full' | 'partial',
      paymentMethod: paymentData.method,
      paidAmount: paidAmount,
      supplierId: finalSupplierId || undefined,
      supplierName: supplierData.name,
      supplierMobile: supplierData.mobile || undefined,
      addedBy: batchData.addedBy || undefined,
      batchNumber: batchData.batchNumber || undefined,
    };
    setPurchases(prev => [newPurchaseRecord, ...prev]);

    const newLog: HistoryLog = {
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'inventory',
      action: 'Add Product Batch',
      description: `Added ${productsToAdd.length} new products`,
      user: batchData.addedBy || 'System',
    };
    setHistoryLogs(prev => [newLog, ...prev]);

    addNotification({
      title: t('Products Added'),
      message: `${productsToAdd.length} ${t('products have been added to inventory. Total cost:')} ${formatCurrency(totalCost)}`,
      type: 'success',
      module: 'inventory'
    });

    setGeneratedPurchase(newPurchaseRecord);
    setShowConfirmation(false);
  };

  const handleCloseAll = () => {
    setGeneratedPurchase(null);
    setProductsToAdd([]);
    setFormData({ name: '', genericName: '', strength: '', dosageForm: '', sku: '', brand: '', category: '', size: '', color: '', design: '', price: '', cost: '', quantity: '', unit: '', minThreshold: '', discount: '', discountType: 'percent' });
    setBatchData({ batchNumber: '', addedBy: '' });
    setSupplierData({ name: '', mobile: '', saveSupplier: false });
    setPaymentData({ option: 'full', method: 'cash', paidAmount: '', discount: '', discountType: 'percent' });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl sm:border sm:border-white/20 sm:shadow-2xl dark:bg-slate-900/90 dark:sm:bg-black/50 sm:rounded-3xl rounded-t-3xl overflow-y-auto max-h-[95vh] flex flex-col m-0 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/50 bg-transparent px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Add New Products')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Add Product Form */}
          <section className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">{t('Product Details')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 relative md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Product Name')} *</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  onFocus={() => setShowMedicineDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
                  autoComplete="off"
                  className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" 
                />
                {showMedicineDropdown && filteredMedicines.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-900 dark:border-slate-800 max-h-60 overflow-y-auto">
                    {filteredMedicines.map((m, idx) => (
                      <div 
                        key={idx} 
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 last:border-0" 
                        onClick={() => selectMedicine(m)}
                      >
                        <div className="font-medium">{m['Product Name']}</div>
                        <div className="text-xs text-slate-500">{m['Generic Name']} • {m['Strength']} • {m['Brand Name']}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Generic Name')}</label>
                <input name="genericName" value={formData.genericName} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Strength')}</label>
                <input name="strength" value={formData.strength} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Dosage Form')}</label>
                <input name="dosageForm" value={formData.dosageForm} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Brand Name')}</label>
                <input name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Category')}</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                  <option value="">{t('Select Category')}</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Purchase Price (Cost)')} *</label>
                <input type="number" min="0" step="1" name="cost" value={formData.cost} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Selling Price')} *</label>
                <input type="number" min="0" step="1" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Quantity')} *</label>
                <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Unit')} *</label>
                <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                  <option value="">{t('Select Unit')}</option>
                  <option value="Pc">{t('Pc')}</option>
                  <option value="Kg">{t('Kg')}</option>
                  <option value="Ft">{t('Ft')}</option>
                  <option value="Dozen">{t('Dozen')}</option>
                  <option value="Box">{t('Box')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Low Stock Threshold')}</label>
                <input type="number" min="0" name="minThreshold" value={formData.minThreshold} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Discount')}</label>
                <div className="flex gap-1">
                  <input type="number" min="0" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full px-3 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                  <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="px-2 py-1.5 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                    <option value="percent">%</option>
                    <option value="flat">৳</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="button" onClick={handleAddProductToList} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('Add to List')}
              </Button>
            </div>
          </section>

          {/* Products List */}
          {productsToAdd.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">{t('Products to Add')} ({productsToAdd.length})</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2">{t('Name')}</th>
                      <th className="px-4 py-2">{t('Brand')}</th>
                      <th className="px-4 py-2">{t('SKU')}</th>
                      <th className="px-4 py-2 text-right">{t('Cost')}</th>
                      <th className="px-4 py-2 text-right">{t('Qty')}</th>
                      <th className="px-4 py-2 text-right">{t('Discount')}</th>
                      <th className="px-4 py-2 text-right">{t('Total')}</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {productsToAdd.map(p => {
                      const itemTotal = (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 0);
                      const itemDiscount = p.discountType === 'percent' 
                        ? itemTotal * (parseFloat(p.discount || '0') / 100)
                        : parseFloat(p.discount || '0');
                      const finalTotal = Math.max(0, itemTotal - itemDiscount);

                      return (
                        <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2">{p.brand}</td>
                          <td className="px-4 py-2">{p.sku}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(p.cost)}</td>
                          <td className="px-4 py-2 text-right">{p.quantity}</td>
                          <td className="px-4 py-2 text-right">
                            {p.discount ? `${p.discount}${p.discountType === 'percent' ? '%' : '৳'}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(finalTotal)}</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => removeProductFromList(p.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <form onSubmit={handleInitiateSubmit} className="space-y-8">
            {/* Batch & Staff */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Batch Number')}</label>
                <input name="batchNumber" value={batchData.batchNumber} onChange={handleBatchChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Added By (Staff Name)')}</label>
                <select name="addedBy" value={batchData.addedBy} onChange={handleBatchChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                  <option value="">{t('Select Staff...')}</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.position})</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Supplier Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 border-b border-slate-200 pb-2 dark:border-slate-800">{t('Supplier Information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Supplier Name')}</label>
                  <input 
                    name="name" 
                    value={supplierData.name} 
                    onChange={handleSupplierChange} 
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50" 
                    autoComplete="off"
                  />
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-900 dark:border-slate-800 max-h-40 overflow-y-auto">
                      {filteredSuppliers.map(s => (
                        <div key={s.id} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-50" onClick={() => selectSupplier(s)}>
                          {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Mobile Number')}</label>
                  <input name="mobile" value={supplierData.mobile} onChange={handleSupplierChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="saveSupplier" name="saveSupplier" checked={supplierData.saveSupplier} onChange={handleSupplierChange} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                <label htmlFor="saveSupplier" className="text-sm text-slate-700 dark:text-slate-300">{t('Save to Customer & Supplier Directory')}</label>
              </div>
            </section>

            {/* Payment Info */}
            <section className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-200 pb-2 dark:border-slate-800">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">{t('Payment Details')}</h3>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Subtotal')}</p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{formatCurrency(subtotalCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Discount')}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input type="number" min="0" step="1" name="discount" value={paymentData.discount} onChange={handlePaymentChange} className="w-16 px-2 py-1 text-right text-xs dark: dark: focus:ring-2 border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" placeholder="0" />
                        <select name="discountType" value={paymentData.discountType} onChange={handlePaymentChange} className="py-1 text-xs dark: dark: focus:ring-2 border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                          <option value="percent">%</option>
                          <option value="flat">৳</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Total Amount')}</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Payment Option')}</label>
                  <select name="option" value={paymentData.option} onChange={handlePaymentChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                    <option value="full">{t('Full Payment')}</option>
                    <option value="partial">{t('Partial Payment')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Payment Method')}</label>
                  <select name="method" value={paymentData.method} onChange={handlePaymentChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50">
                    <option value="cash">{t('Cash')}</option>
                    <option value="bkas">{t('Bkas')}</option>
                    <option value="card">{t('Card')}</option>
                    <option value="bank">{t('Bank Transfer')}</option>
                  </select>
                </div>
                {paymentData.option === 'partial' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Paid Amount')}</label>
                      <input required type="number" min="0" step="1" name="paidAmount" value={paymentData.paidAmount} onChange={handlePaymentChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" placeholder={t("Write amount")} />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Remaining Due')}</p>
                      <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                        {formatCurrency(dueAmount)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose}>{t('Cancel')}</Button>
              <Button type="submit" disabled={productsToAdd.length === 0}>
                <Check className="mr-2 h-4 w-4" />
                {t('Save Products')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{t('Confirm Save')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t('Are you sure you want to save these products? This will update inventory and create accounting records.')}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                {t('Cancel')}
              </Button>
              <Button onClick={confirmSubmit}>
                {t('Confirm & Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
