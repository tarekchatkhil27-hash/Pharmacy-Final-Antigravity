import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, ShoppingCart, Search, Filter, Download, Upload, MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AddProductModal } from '../components/inventory/AddProductModal';
import { AddPurchaseForm } from '../components/inventory/AddPurchaseForm';
import { ProductDetailsModal } from '../components/inventory/ProductDetailsModal';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export function Inventory() {
  const { products, setProducts, setHistoryLogs, addNotification } = useGlobal();
  const { t } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // Filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = (product.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                            (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
      
      let matchesStatus = true;
      if (statusFilter === 'in_stock') matchesStatus = product.quantity > product.minThreshold;
      if (statusFilter === 'low_stock') matchesStatus = product.quantity > 0 && product.quantity <= product.minThreshold;
      if (statusFilter === 'out_of_stock') matchesStatus = product.quantity === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t('Are you sure you want to delete')} ${name}?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setHistoryLogs(prev => [{
        id: `LOG-${Date.now()}`,
        date: new Date().toISOString(),
        module: 'inventory',
        action: 'Delete Product',
        description: `Deleted product: ${name}`,
        user: 'Admin'
      }, ...prev]);

      // Notification
      addNotification({
        title: 'Product Deleted',
        message: `${name} has been removed from inventory.`,
        type: 'warning',
        module: 'inventory'
      });
    }
  };

  const CSV_HEADERS = ['SKU', 'Name', 'Brand', 'Category', 'Size', 'Color', 'Design', 'Price', 'Cost', 'Quantity', 'MinThreshold'];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const parseCSVLine = (text: string) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' && text[i+1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell);
    return result;
  };

  // CSV Export
  const exportCSV = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      ...filteredProducts.map(p => 
        [
          escapeCSV(p.sku), 
          escapeCSV(p.name), 
          escapeCSV(p.brand || ''), 
          escapeCSV(p.category), 
          escapeCSV(p.size || ''), 
          escapeCSV(p.color || ''), 
          escapeCSV(p.design || ''), 
          escapeCSV(p.price), 
          escapeCSV(p.cost), 
          escapeCSV(p.quantity), 
          escapeCSV(p.minThreshold)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Split by newlines, handling both \n and \r\n
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length > 1) {
        const newProducts: Product[] = [];
        
        // Parse headers to map indexes dynamically
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        
        const getIndex = (key: string) => headers.indexOf(key.toLowerCase());
        const skuIdx = getIndex('SKU');
        const nameIdx = getIndex('Name');
        const brandIdx = getIndex('Brand');
        const categoryIdx = getIndex('Category');
        const sizeIdx = getIndex('Size');
        const colorIdx = getIndex('Color');
        const designIdx = getIndex('Design');
        const priceIdx = getIndex('Price');
        const costIdx = getIndex('Cost');
        const qtyIdx = getIndex('Quantity');
        const minIdx = getIndex('MinThreshold');

        if (skuIdx === -1 || nameIdx === -1) {
          alert(t('Invalid CSV format. Required columns missing (SKU, Name). Please use the sample CSV format.'));
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          
          // Safety fallback if the row is somehow incomplete
          const getValue = (idx: number) => idx !== -1 && values[idx] ? values[idx].trim() : '';

          const sku = getValue(skuIdx) || `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
          const name = getValue(nameIdx);
          
          if (!name) continue; // Name is fundamentally required

          newProducts.push({
            id: `P${Date.now()}-${i}`,
            sku,
            name,
            brand: getValue(brandIdx),
            category: getValue(categoryIdx) || 'Uncategorized',
            size: getValue(sizeIdx),
            color: getValue(colorIdx),
            design: getValue(designIdx),
            price: parseFloat(getValue(priceIdx)) || 0,
            cost: parseFloat(getValue(costIdx)) || 0,
            quantity: parseInt(getValue(qtyIdx), 10) || 0,
            minThreshold: parseInt(getValue(minIdx), 10) || 5,
            unit: 'Pc',
            lastRestocked: new Date().toISOString()
          });
        }
        
        if (newProducts.length > 0) {
          setProducts(prev => [...newProducts, ...prev]);
          setHistoryLogs(prev => [{
            id: `LOG-${Date.now()}`,
            date: new Date().toISOString(),
            module: 'inventory',
            action: 'Import CSV',
            description: `Imported ${newProducts.length} products`,
            user: 'Admin'
          }, ...prev]);
          alert(`${t('Successfully imported')} ${newProducts.length} ${t('products')}.`);
        } else {
          alert(t('No valid products found in the CSV.'));
        }
      } else {
        alert(t('The CSV file is empty or missing data rows.'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadSampleCSV = () => {
    const content = [
      CSV_HEADERS.join(','),
      'PRD-123456,Sample Product,TechCorp,Electronics,L,Black,Modern,99.99,50.00,100,10'
    ].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_inventory.csv';
    link.click();
  };

  const getStatusBadge = (qty: number, min: number) => {
    if (qty === 0) {
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('Out of Stock')}</span>;
    }
    if (qty <= min) {
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{t('Low Stock')}</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{t('In Stock')}</span>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Inventory')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('Manage your products and stock levels.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">

          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            {t('Export CSV')}
          </Button>
          <Button variant="secondary" onClick={() => setIsPurchaseModalOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('Add Purchase')}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Add to Inventory')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>{t('Products')}</CardTitle>
          </div>
          
          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('Search by name or SKU...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950"
            >
              <option value="">{t('All Categories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-50 dark:bg-slate-950"
              >
                <option value="">{t('All Statuses')}</option>
                <option value="in_stock">{t('In Stock')}</option>
                <option value="low_stock">{t('Low Stock')}</option>
                <option value="out_of_stock">{t('Out of Stock')}</option>
              </select>
              {(searchQuery || categoryFilter || statusFilter) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title={t('Clear Filters')}>
                  <Filter className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur-md text-xs uppercase text-slate-700 shadow-sm dark:bg-black/50 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-4 rounded-tl-xl">{t('Product')}</th>
                  <th className="px-4 py-4">{t('Brand')}</th>
                  <th className="px-4 py-4">{t('SKU')}</th>
                  <th className="px-4 py-4">{t('Category')}</th>
                  <th className="px-4 py-4">{t('Price')}</th>
                  <th className="px-4 py-4">{t('Cost')}</th>
                  <th className="px-4 py-4">{t('Stock')}</th>
                  <th className="px-4 py-4">{t('Total Cost')}</th>
                  <th className="px-4 py-4">{t('Last Updated')}</th>
                  <th className="px-4 py-4">{t('Status')}</th>
                  <th className="px-4 py-4 rounded-tr-xl text-right">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      key={product.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" 
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/30 dark:text-indigo-400">
                          <Package className="h-4 w-4" />
                        </div>
                        {product.name}
                      </td>
                      <td className="px-4 py-4">{product.brand || '-'}</td>
                      <td className="px-4 py-4">{product.sku}</td>
                      <td className="px-4 py-4">{product.category || '-'}</td>
                      <td className="px-4 py-4">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-4">{formatCurrency(product.movingAverageCost || product.cost)}</td>
                      <td className="px-4 py-4">{product.quantity}</td>
                      <td className="px-4 py-4 font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency((product.movingAverageCost || product.cost) * product.quantity)}</td>
                      <td className="px-4 py-4 text-xs">
                        {formatDate(product.lastRestocked)}
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(product.quantity, product.minThreshold)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(product.id, product.name); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={11} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Package className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                          </div>
                          <p className="text-base font-medium text-slate-900 dark:text-slate-50">{t('No products found')}</p>
                          <p className="text-sm">{t('Try adjusting your search or filters.')}</p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => {
              const getBorderColor = () => {
                if (product.quantity === 0) return 'border-l-red-500';
                if (product.quantity <= product.minThreshold) return 'border-l-amber-500';
                return 'border-l-emerald-500';
              };
              
              const getBadgeColor = () => {
                if (product.quantity === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                if (product.quantity <= product.minThreshold) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
              };
              
              return (
                <div 
                  key={product.id} 
                  className={`rounded-xl border border-slate-200 border-l-4 p-3 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between shadow-sm bg-white dark:bg-slate-900/40 transition-colors ${getBorderColor()}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center min-w-0 pr-2 gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm truncate">{product.name}</span>
                    {product.brand && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">
                        {product.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center shrink-0 gap-3">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{formatCurrency(product.price)}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
                      {product.quantity}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center text-slate-500">
                {t('No products found.')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <AddPurchaseForm isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
      <ProductDetailsModal 
        isOpen={!!selectedProduct} 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onDelete={handleDelete}
      />
    </motion.div>
  );
}
