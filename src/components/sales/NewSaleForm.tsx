import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, ShoppingCart, LayoutGrid } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { Product, SaleItem, SaleRecord, Customer, Receivable, HistoryLog } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency, cn } from '../../lib/utils';
import { InvoiceModal } from './InvoiceModal';
import { useLanguage } from '../../context/LanguageContext';

export function NewSaleForm() {
  const { products, setProducts, customers, setCustomers, sales, setSales, setReceivables, setHistoryLogs, setTransactions, addNotification, businessSettings } = useGlobal();
  const { t } = useLanguage();

  // Left Side: Products
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Right Side: Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<'percent' | 'flat'>('percent');
  const taxRate = businessSettings.taxPercentage;

  // Payment & Customer
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    address: '',
    saveCustomer: false,
  });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [showConfirm, setShowConfirm] = useState(false);

  // Invoice Modal
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // --- Product Filtering ---
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
      return matchesSearch && matchesCategory && product.quantity > 0; // Only show in-stock
    });
  }, [products, searchQuery, categoryFilter]);

  // --- Customer Filtering ---
  const filteredCustomers = useMemo(() => {
    if (!customerData.name) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerData.name.toLowerCase()));
  }, [customerData.name, customers]);

  // --- Cart Actions ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // Cannot add more than stock
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        cost: product.movingAverageCost || product.cost,
        quantity: 1,
        discount: 0,
        discountType: 'percent'
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = Math.max(1, Math.min(item.quantity + delta, product?.quantity || 1));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: string, discount: number, type?: 'percent' | 'flat') => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newType = type || item.discountType;
        const newDiscount = newType === 'percent' ? Math.max(0, Math.min(100, discount)) : Math.max(0, discount);
        return { ...item, discount: newDiscount, discountType: newType };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // --- Calculations ---
  const hasIndividualDiscounts = cart.some(item => item.discount > 0);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const itemDiscountsTotal = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    if (item.discountType === 'percent') {
      return sum + (itemTotal * (item.discount / 100));
    } else {
      return sum + item.discount;
    }
  }, 0);

  let finalDiscountAmount = itemDiscountsTotal;
  
  // If no individual discounts, apply cart discount
  if (!hasIndividualDiscounts && cartDiscount > 0) {
    if (cartDiscountType === 'percent') {
      finalDiscountAmount = subtotal * (cartDiscount / 100);
    } else {
      finalDiscountAmount = cartDiscount;
    }
  }

  const afterDiscount = Math.max(0, subtotal - finalDiscountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = afterDiscount + taxAmount;

  // --- Handlers ---
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setCustomerData(prev => ({ ...prev, [name]: val }));
    if (name === 'name') setShowCustomerDropdown(true);
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerData({
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address || '',
      saveCustomer: false,
    });
    setShowCustomerDropdown(false);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    
    if (paymentOption === 'partial' && !customerData.name) {
      alert(t("Customer Name is mandatory for partial payments."));
      return;
    }

    const paidAmt = paymentOption === 'full' ? grandTotal : parseFloat(paidAmount || '0');
    if (paidAmt < 0 || paidAmt > grandTotal) {
      alert(t("Invalid paid amount."));
      return;
    }

    setShowConfirm(true);
  };

  const processCheckout = () => {
    const paidAmt = paymentOption === 'full' ? grandTotal : parseFloat(paidAmount || '0');
    const dueAmount = grandTotal - paidAmt;
    let finalCustomerId = '';

    // Handle Customer
    if (customerData.name) {
      const existing = customers.find(c => c.name.toLowerCase() === customerData.name.toLowerCase());
      if (existing) {
        finalCustomerId = existing.id;
      } else if (customerData.saveCustomer) {
        const newCustomer: Customer = {
          id: `C${Date.now()}`,
          name: customerData.name,
          mobile: customerData.mobile,
          address: customerData.address,
        };
        setCustomers(prev => [...prev, newCustomer]);
        finalCustomerId = newCustomer.id;
      }
    }

    const now = new Date();
    const monthStr = now.toLocaleString('default', { month: 'short' }).toUpperCase();
    const dateStr = now.getDate().toString().padStart(2, '0');
    const serial = String((sales?.length || 0) + 1).padStart(3, '0');
    const invoiceId = `INV-${monthStr}-${dateStr}-${serial}`;

    // Create Sale Record
    const newSale: SaleRecord = {
      id: invoiceId,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discountAmount: finalDiscountAmount,
      taxAmount,
      grandTotal,
      paymentOption,
      paymentMethod,
      paidAmount: paidAmt,
      customerId: finalCustomerId || undefined,
      customerName: customerData.name || undefined,
      customerMobile: customerData.mobile || undefined,
      customerAddress: customerData.address || undefined,
    };

    setSales(prev => [newSale, ...prev]);

    // Deduct Inventory & Check for Low Stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        const newQuantity = Math.max(0, p.quantity - cartItem.quantity);
        
        // Low Stock Notification
        if (newQuantity <= p.minThreshold) {
          addNotification({
            title: t('Low Stock Alert'),
            message: `${p.name} ${t('is low on stock.')} ${t('Remaining:')} ${newQuantity}`,
            type: 'warning',
            module: 'inventory'
          });
        }
        
        return { ...p, quantity: newQuantity };
      }
      return p;
    }));

    // Handle Receivables
    if (dueAmount > 0 && (customerData.name || customerData.mobile)) {
      const newReceivable: Receivable = {
        id: `REC-${Date.now()}`,
        date: new Date().toISOString(),
        customerId: finalCustomerId || undefined,
        customerName: customerData.name || customerData.mobile || 'Unknown',
        customerMobile: customerData.mobile || undefined,
        totalAmount: grandTotal,
        paidAmount: paidAmt,
        dueAmount: dueAmount,
        status: 'partial',
        relatedEntityId: newSale.id,
      };
      setReceivables(prev => [newReceivable, ...prev]);
    }

    // Add Accounting Transaction for the paid amount
    if (paidAmt > 0) {
      setTransactions(prev => [{
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'income',
        amount: paidAmt,
        description: `Sale Revenue (Inv: ${newSale.id})`,
        category: 'Sales Revenue',
        status: 'completed',
        referenceId: newSale.id,
        paymentMethod: paymentMethod
      }, ...prev]);
    }

    // History Log
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'sales',
      action: 'New Sale',
      description: `Completed sale ${newSale.id} for ${formatCurrency(grandTotal)}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: t('New Sale Completed'),
      message: `${t('Sale')} ${newSale.id} ${t('for')} ${formatCurrency(grandTotal)} ${t('has been processed.')}`,
      type: 'success',
      module: 'sales'
    });

    // Show Success & Invoice
    setCompletedSale(newSale);
    setIsInvoiceOpen(true);

    // Reset Form
    setCart([]);
    setCartDiscount(0);
    setPaymentOption('full');
    setPaidAmount('');
    setCustomerData({ name: '', mobile: '', address: '', saveCustomer: false });
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-start min-h-[calc(100vh-8rem)] gap-6 relative">
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-2xl overflow-hidden shrink-0">
        <button 
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
            activeTab === 'products' 
              ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          {t('Products')}
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'cart' 
              ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('Cart')}
          {cart.length > 0 && (
            <span className="absolute top-2 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Left Side: Products */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)]",
        activeTab === 'products' ? "flex h-[calc(100vh-12rem)]" : "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('Search products...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950 w-full sm:w-40"
            >
              <option value="">{t('All Categories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
              >
                <div className="aspect-square w-full rounded-lg bg-slate-100 flex items-center justify-center mb-3 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="mb-1">
                  {product.brand && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{product.brand}</p>}
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 line-clamp-2 leading-tight">{product.name}</h3>
                </div>
                <div className="mt-auto pt-2 space-y-1">
                  <div className="flex items-end justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(product.price)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} {t('in stock')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                    <span title={t('Moving Average Cost')}>MAC: {formatCurrency(product.movingAverageCost || product.cost)}</span>
                    {product.costHistory && product.costHistory.length > 0 && (
                      <span className="text-orange-500/80 truncate max-w-[80px]" title={t('Recent Prices')}>
                        {Array.from(new Set(product.costHistory.map(h => h.cost))).slice(0, 3).map(c => formatCurrency(c as number)).join('/')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                {t('No products found.')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Checkout */}
      <div className={cn(
        "w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm shrink-0 transition-all",
        activeTab === 'cart' ? "flex h-[calc(100vh-12rem)]" : "hidden lg:flex lg:h-auto"
      )}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {t('Current Order')}
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag className="h-12 w-12 opacity-20" />
              <p>{t('Cart is empty')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-slate-500">{t('Price:')} {formatCurrency(item.price)}</div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                        {t('Cost:')} {formatCurrency(item.cost)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 -mt-1 -mr-1" onClick={() => removeFromCart(item.productId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs">
                      <span className="text-slate-500 mr-1">{t('Discount')}</span>
                      <input 
                        type="number" 
                        min="0" step="1"
                        value={item.discount || ''} 
                        onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-12 rounded-l border border-slate-200 px-1 py-0.5 text-center dark:border-slate-700 dark:bg-slate-950"
                      />
                      <select 
                        value={item.discountType}
                        onChange={(e) => updateItemDiscount(item.productId, item.discount, e.target.value as 'percent' | 'flat')}
                        className="rounded-r border border-l-0 border-slate-200 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="percent">%</option>
                        <option value="flat">৳</option>
                      </select>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(
                        Math.max(0, (item.price * item.quantity) - (item.discountType === 'percent' ? (item.price * item.quantity) * (item.discount / 100) : item.discount))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
          
          {/* Customer Selection */}
          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text" 
                name="name"
                placeholder={t('Customer Name (Optional)')}
                value={customerData.name}
                onChange={handleCustomerChange}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                autoComplete="off"
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 bottom-full mb-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-900 dark:border-slate-800 max-h-40 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-50"
                      onClick={() => selectCustomer(c)}
                    >
                      {c.name} {c.mobile && `(${c.mobile})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                name="mobile"
                placeholder={t('Mobile Number (Optional)')}
                value={customerData.mobile}
                onChange={handleCustomerChange}
                className="flex-1 px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50"
              />
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                name="address"
                placeholder={t('Customer Address (Optional)')}
                value={customerData.address}
                onChange={handleCustomerChange}
                className="flex-1 px-3 py-2 text-sm focus:ring-2 dark: dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50"
              />
              {(customerData.name || customerData.mobile) && !customers.find(c => c.name.toLowerCase() === customerData.name.toLowerCase() || (customerData.mobile && c.mobile === customerData.mobile)) && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 px-2 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" name="saveCustomer" checked={customerData.saveCustomer} onChange={handleCustomerChange} className="rounded text-indigo-600" />
                  {t('Save')}
                </label>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{t('Subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-500">
              <span>{t('Discount')}</span>
              {hasIndividualDiscounts ? (
                <span>-{formatCurrency(itemDiscountsTotal)}</span>
              ) : (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    min="0" step="1"
                    value={cartDiscount || ''}
                    onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                    className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-xs dark:border-slate-700 dark:bg-slate-950"
                    placeholder="0"
                  />
                  <select 
                    value={cartDiscountType} 
                    onChange={(e) => setCartDiscountType(e.target.value as any)}
                    className="rounded border border-slate-200 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="percent">%</option>
                    <option value="flat">৳</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-slate-500">
              <span>{t('Tax')} ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>{t('Total')}</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={paymentOption} 
              onChange={(e) => setPaymentOption(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="full">{t('Full Payment')}</option>
              <option value="partial">{t('Partial Payment')}</option>
            </select>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="cash">{t('Cash')}</option>
              <option value="card">{t('Card')}</option>
              <option value="bkas">{t('bKash')}</option>
              <option value="bank">{t('Bank Transfer')}</option>
            </select>
          </div>

          {paymentOption === 'partial' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 whitespace-nowrap">{t('Paid Amt:')}</span>
                <input 
                  type="number" 
                  min="0" step="1"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  placeholder={t('Enter amount')}
                />
              </div>
              <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 mt-2">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-400">{t('Remaining Due:')}</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  {formatCurrency(grandTotal - (parseFloat(paidAmount) || 0))}
                </span>
              </div>
            </>
          )}

          <Button 
            className="w-full h-12 text-base font-bold shadow-lg shadow-indigo-500/20" 
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {t('Complete Sale')}
          </Button>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isInvoiceOpen} 
        onClose={() => setIsInvoiceOpen(false)} 
        sale={completedSale} 
      />

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl sm:border sm:border-white/20 dark:bg-slate-900/90 dark:sm:bg-black/50 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:border sm:border-slate-200 dark:sm:border-slate-800 animate-in slide-in-from-bottom duration-300 relative">
            <div className="flex justify-center -mt-2 mb-4 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{t('Confirm Sale')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {t('Are you sure you want to complete this sale for')} <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>{t('Cancel')}</Button>
              <Button onClick={() => { setShowConfirm(false); processCheckout(); }}>{t('Confirm Sale')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
